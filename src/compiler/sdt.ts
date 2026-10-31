// src/compiler/sdt.ts
import {
  ASTNode,
  ProgramNode,
  StatementNode,
  ExpressionNode,
  SDTStep,
  BinaryExpressionNode,
  UnaryExpressionNode,
  AssignmentStatementNode,
  IfStatementNode,
  WhileStatementNode,
  VarDeclarationNode,
  RelationalExpressionNode,
  LogicalExpressionNode,
} from './types';
import { getASTNodeLabel } from './ast';

export class SDTAnalyzer {
  private steps: SDTStep[] = [];
  private orderCounter: number = 1;
  private tempCounter: number = 1;
  private labelCounter: number = 1;

  public analyze(ast: ProgramNode): SDTStep[] {
    this.steps = [];
    this.orderCounter = 1;
    this.tempCounter = 1;
    this.labelCounter = 1;

    // Traverse statements
    for (const stmt of ast.statements) {
      this.analyzeStatement(stmt, { next: 'L_next' });
    }

    return this.steps;
  }

  private newTemp(): string {
    return `t${this.tempCounter++}`;
  }

  private newLabel(): string {
    return `L${this.labelCounter++}`;
  }

  private analyzeStatement(stmt: StatementNode, inherited: { next: string }): void {
    switch (stmt.type) {
      case 'VarDeclaration': {
        const emitted: string[] = [];
        for (const decl of stmt.declarations) {
          if (decl.init) {
            const exprRes = this.analyzeExpression(decl.init);
            emitted.push(...exprRes.code);
            emitted.push(`${decl.id} = ${exprRes.val}`);
          }
        }

        this.steps.push({
          order: this.orderCounter++,
          nodeId: stmt.id,
          nodeType: stmt.type,
          nodeLabel: getASTNodeLabel(stmt),
          productionRule: `D -> type id_list ;`,
          semanticAction: `D.code = id_list.code; symbol_table.insert(id, type);`,
          synthesized: {
            type: stmt.dataType,
            vars: stmt.declarations.map((d) => d.id).join(', '),
            code: emitted.join('\n') || '<symbol-only>',
          },
          inherited: {
            scope: 'global/local',
          },
          emittedCode: emitted,
          explanation: `Inherited type '${stmt.dataType}' is distributed to declared variables. Declarations with initializers synthesize evaluation code.`,
        });
        break;
      }

      case 'AssignmentStatement': {
        // First evaluate expression (S-attributed, bottom-up)
        const exprRes = this.analyzeExpression(stmt.expression);
        const emitted = [...exprRes.code, `${stmt.variable} = ${exprRes.val}`];

        this.steps.push({
          order: this.orderCounter++,
          nodeId: stmt.id,
          nodeType: stmt.type,
          nodeLabel: getASTNodeLabel(stmt),
          productionRule: `S -> id = E ;`,
          semanticAction: `S.code = E.code || emit(id.name '=' E.val); S.next = inherited.next;`,
          synthesized: {
            target: stmt.variable,
            val: exprRes.val,
            code: emitted.join('\n'),
          },
          inherited: {
            next: inherited.next,
          },
          emittedCode: emitted,
          explanation: `S-attributed expression E synthesizes temporary '${exprRes.val}'. The assignment statement copies it to variable '${stmt.variable}'.`,
        });
        break;
      }

      case 'IfStatement': {
        const trueLabel = this.newLabel();
        const falseLabel = stmt.alternate ? this.newLabel() : inherited.next;
        const exitLabel = this.newLabel();

        // Condition evaluation
        const condRes = this.analyzeBoolean(stmt.condition, { true: trueLabel, false: falseLabel });

        // Consequent (then)
        this.analyzeStatement(stmt.consequent, { next: exitLabel });

        // Alternate (else)
        if (stmt.alternate) {
          this.analyzeStatement(stmt.alternate, { next: exitLabel });
        }

        const rule = stmt.alternate
          ? `S -> if ( B ) M1 S1 N else M2 S2`
          : `S -> if ( B ) M S1`;

        this.steps.push({
          order: this.orderCounter++,
          nodeId: stmt.id,
          nodeType: stmt.type,
          nodeLabel: getASTNodeLabel(stmt),
          productionRule: rule,
          semanticAction: stmt.alternate
            ? `backpatch(B.truelist, M1.label); backpatch(B.falselist, M2.label); S.nextlist = merge(S1.nextlist, N.nextlist, S2.nextlist);`
            : `backpatch(B.truelist, M.label); S.nextlist = merge(B.falselist, S1.nextlist);`,
          synthesized: {
            truelist: `[${condRes.truelist.join(', ')}]`,
            falselist: `[${condRes.falselist.join(', ')}]`,
            code: `if-then${stmt.alternate ? '-else' : ''} branching sequence`,
          },
          inherited: {
            trueTarget: trueLabel,
            falseTarget: falseLabel,
            next: inherited.next,
          },
          emittedCode: [
            ...condRes.code,
            `${trueLabel}:`,
            `  [Consequent Statements]`,
            ...(stmt.alternate ? [`goto ${exitLabel}`, `${falseLabel}:`, `  [Alternate Statements]`, `${exitLabel}:`] : [`${exitLabel}:`]),
          ],
          explanation: `Inherited control-flow attributes (trueTarget='${trueLabel}', falseTarget='${falseLabel}') are passed downward to guide jump resolution.`,
        });
        break;
      }

      case 'WhileStatement': {
        const loopStart = this.newLabel();
        const bodyStart = this.newLabel();
        const loopExit = this.newLabel();

        const condRes = this.analyzeBoolean(stmt.condition, { true: bodyStart, false: loopExit });
        this.analyzeStatement(stmt.body, { next: loopStart });

        this.steps.push({
          order: this.orderCounter++,
          nodeId: stmt.id,
          nodeType: stmt.type,
          nodeLabel: getASTNodeLabel(stmt),
          productionRule: `S -> while M1 ( B ) M2 S1`,
          semanticAction: `backpatch(S1.nextlist, M1.label); backpatch(B.truelist, M2.label); S.nextlist = B.falselist; emit('goto', M1.label);`,
          synthesized: {
            truelist: `[${condRes.truelist.join(', ')}]`,
            falselist: `[${condRes.falselist.join(', ')}]`,
            loopHeader: loopStart,
            loopExit,
          },
          inherited: {
            headerLabel: loopStart,
            exitTarget: loopExit,
            next: inherited.next,
          },
          emittedCode: [
            `${loopStart}:`,
            ...condRes.code,
            `${bodyStart}:`,
            `  [Body Statements]`,
            `goto ${loopStart}`,
            `${loopExit}:`,
          ],
          explanation: `While loop passes inherited header '${loopStart}' to body nextlist for backward loop jump, and exit label '${loopExit}' to condition falselist.`,
        });
        break;
      }

      case 'BlockStatement': {
        for (const inner of stmt.statements) {
          this.analyzeStatement(inner, inherited);
        }
        break;
      }

      case 'ExpressionStatement': {
        this.analyzeExpression(stmt.expression);
        break;
      }
    }
  }

  // Pure S-attributed evaluation for arithmetic expressions
  private analyzeExpression(expr: ExpressionNode): { val: string; code: string[] } {
    switch (expr.type) {
      case 'Identifier': {
        this.steps.push({
          order: this.orderCounter++,
          nodeId: expr.id,
          nodeType: expr.type,
          nodeLabel: getASTNodeLabel(expr),
          productionRule: `F -> id`,
          semanticAction: `F.val = id.name; F.type = lookup(id.name).type;`,
          synthesized: {
            val: expr.name,
            kind: 'identifier',
          },
          inherited: {},
          emittedCode: [],
          explanation: `Leaf node: synthesizes variable identifier name '${expr.name}' up the AST.`,
        });
        return { val: expr.name, code: [] };
      }

      case 'Literal': {
        this.steps.push({
          order: this.orderCounter++,
          nodeId: expr.id,
          nodeType: expr.type,
          nodeLabel: getASTNodeLabel(expr),
          productionRule: `F -> num`,
          semanticAction: `F.val = num.lexval; F.type = num.datatype;`,
          synthesized: {
            val: expr.raw,
            type: expr.dataType,
            kind: 'literal',
          },
          inherited: {},
          emittedCode: [],
          explanation: `Leaf node: synthesizes literal value '${expr.raw}' with primitive type '${expr.dataType}'.`,
        });
        return { val: expr.raw, code: [] };
      }

      case 'BinaryExpression': {
        const left = this.analyzeExpression(expr.left);
        const right = this.analyzeExpression(expr.right);
        const temp = this.newTemp();
        const code = [...left.code, ...right.code, `${temp} = ${left.val} ${expr.operator} ${right.val}`];

        this.steps.push({
          order: this.orderCounter++,
          nodeId: expr.id,
          nodeType: expr.type,
          nodeLabel: getASTNodeLabel(expr),
          productionRule: `E -> E1 ${expr.operator} T`,
          semanticAction: `E.val = newtemp(); emit(E.val '=' E1.val '${expr.operator}' T.val);`,
          synthesized: {
            val: temp,
            leftVal: left.val,
            rightVal: right.val,
            operator: expr.operator,
            code: `${temp} = ${left.val} ${expr.operator} ${right.val}`,
          },
          inherited: {},
          emittedCode: code,
          explanation: `S-attributed translation: Combines synthesized child attributes E1.val='${left.val}' and T.val='${right.val}' to emit intermediate code into temporary '${temp}'.`,
        });

        return { val: temp, code };
      }

      case 'UnaryExpression': {
        const operand = this.analyzeExpression(expr.operand);
        const temp = this.newTemp();
        const code = [...operand.code, `${temp} = ${expr.operator}${operand.val}`];

        this.steps.push({
          order: this.orderCounter++,
          nodeId: expr.id,
          nodeType: expr.type,
          nodeLabel: getASTNodeLabel(expr),
          productionRule: `E -> ${expr.operator} E1`,
          semanticAction: `E.val = newtemp(); emit(E.val '=' '${expr.operator}' E1.val);`,
          synthesized: {
            val: temp,
            operator: expr.operator,
            operand: operand.val,
            code: `${temp} = ${expr.operator}${operand.val}`,
          },
          inherited: {},
          emittedCode: code,
          explanation: `S-attributed unary operation: Negates synthesized attribute of child operand and assigns to '${temp}'.`,
        });

        return { val: temp, code };
      }

      case 'RelationalExpression':
      case 'LogicalExpression': {
        // Boolean value evaluation
        const temp = this.newTemp();
        return { val: temp, code: [`${temp} = <bool-eval>`] };
      }

      default:
        return { val: '0', code: [] };
    }
  }

  // Boolean SDT translation
  private analyzeBoolean(
    expr: ExpressionNode,
    inherited: { true: string; false: string }
  ): { truelist: string[]; falselist: string[]; code: string[] } {
    switch (expr.type) {
      case 'RelationalExpression': {
        const left = this.analyzeExpression(expr.left);
        const right = this.analyzeExpression(expr.right);
        const code = [
          ...left.code,
          ...right.code,
          `if ${left.val} ${expr.operator} ${right.val} goto ${inherited.true}`,
          `goto ${inherited.false}`,
        ];

        this.steps.push({
          order: this.orderCounter++,
          nodeId: expr.id,
          nodeType: expr.type,
          nodeLabel: getASTNodeLabel(expr),
          productionRule: `B -> E1 ${expr.operator} E2`,
          semanticAction: `B.truelist = makelist(nextinstr); B.falselist = makelist(nextinstr + 1); emit('if' E1.val '${expr.operator}' E2.val 'goto _'); emit('goto _');`,
          synthesized: {
            truelist: `[jump_true]`,
            falselist: `[jump_false]`,
            condition: `${left.val} ${expr.operator} ${right.val}`,
          },
          inherited: {
            trueTarget: inherited.true,
            falseTarget: inherited.false,
          },
          emittedCode: code,
          explanation: `Relational condition generates conditional jump targeting inherited trueTarget '${inherited.true}' and unconditional fall-through to '${inherited.false}'.`,
        });

        return { truelist: ['jump_true'], falselist: ['jump_false'], code };
      }

      case 'LogicalExpression': {
        if (expr.operator === '&&') {
          const midLabel = this.newLabel();
          const b1 = this.analyzeBoolean(expr.left, { true: midLabel, false: inherited.false });
          const b2 = this.analyzeBoolean(expr.right, { true: inherited.true, false: inherited.false });

          this.steps.push({
            order: this.orderCounter++,
            nodeId: expr.id,
            nodeType: expr.type,
            nodeLabel: getASTNodeLabel(expr),
            productionRule: `B -> B1 && M B2`,
            semanticAction: `backpatch(B1.truelist, M.label); B.truelist = B2.truelist; B.falselist = merge(B1.falselist, B2.falselist);`,
            synthesized: {
              truelist: `B2.truelist`,
              falselist: `merge(B1.falselist, B2.falselist)`,
            },
            inherited: {
              midLabel,
              finalTrue: inherited.true,
              finalFalse: inherited.false,
            },
            emittedCode: [...b1.code, `${midLabel}:`, ...b2.code],
            explanation: `Short-circuit AND: B1 true jumps to marker '${midLabel}' evaluating B2. Any falselist immediately routes to falseTarget '${inherited.false}'.`,
          });

          return {
            truelist: b2.truelist,
            falselist: [...b1.falselist, ...b2.falselist],
            code: [...b1.code, `${midLabel}:`, ...b2.code],
          };
        } else if (expr.operator === '||') {
          const midLabel = this.newLabel();
          const b1 = this.analyzeBoolean(expr.left, { true: inherited.true, false: midLabel });
          const b2 = this.analyzeBoolean(expr.right, { true: inherited.true, false: inherited.false });

          this.steps.push({
            order: this.orderCounter++,
            nodeId: expr.id,
            nodeType: expr.type,
            nodeLabel: getASTNodeLabel(expr),
            productionRule: `B -> B1 || M B2`,
            semanticAction: `backpatch(B1.falselist, M.label); B.truelist = merge(B1.truelist, B2.truelist); B.falselist = B2.falselist;`,
            synthesized: {
              truelist: `merge(B1.truelist, B2.truelist)`,
              falselist: `B2.falselist`,
            },
            inherited: {
              midLabel,
              finalTrue: inherited.true,
              finalFalse: inherited.false,
            },
            emittedCode: [...b1.code, `${midLabel}:`, ...b2.code],
            explanation: `Short-circuit OR: B1 false jumps to marker '${midLabel}' to evaluate B2. Any truelist immediately routes to trueTarget '${inherited.true}'.`,
          });

          return {
            truelist: [...b1.truelist, ...b2.truelist],
            falselist: b2.falselist,
            code: [...b1.code, `${midLabel}:`, ...b2.code],
          };
        }
        break;
      }

      default: {
        const exprRes = this.analyzeExpression(expr);
        return {
          truelist: ['jump_true'],
          falselist: ['jump_false'],
          code: [...exprRes.code, `if ${exprRes.val} != 0 goto ${inherited.true}`, `goto ${inherited.false}`],
        };
      }
    }

    return { truelist: [], falselist: [], code: [] };
  }
}
