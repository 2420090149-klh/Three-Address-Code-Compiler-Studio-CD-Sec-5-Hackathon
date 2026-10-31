// src/compiler/tac.ts
import {
  ASTNode,
  ProgramNode,
  StatementNode,
  ExpressionNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  IdentifierNode,
  LiteralNode,
  RelationalExpressionNode,
  LogicalExpressionNode,
  TACInstruction,
  TACOp,
} from './types';
import { BackpatchManager } from './backpatch';

export interface BExprResult {
  truelist: number[];
  falselist: number[];
}

export interface StmtResult {
  nextlist: number[];
}

export class TACGenerator {
  private instructions: TACInstruction[] = [];
  private nextInstrId: number = 1;
  private tempCounter: number = 1;
  private labelCounter: number = 1;
  private backpatchManager: BackpatchManager;

  constructor(backpatchManager?: BackpatchManager) {
    this.backpatchManager = backpatchManager || new BackpatchManager();
  }

  public getInstructions(): TACInstruction[] {
    return this.instructions;
  }

  public getBackpatchManager(): BackpatchManager {
    return this.backpatchManager;
  }

  public getStats() {
    return {
      tacInstructions: this.instructions.length,
      tempVarsCount: this.tempCounter - 1,
      labelsCount: this.labelCounter - 1,
    };
  }

  public newTemp(): string {
    return `t${this.tempCounter++}`;
  }

  public newLabel(): string {
    return `L${this.labelCounter++}`;
  }

  public emit(
    op: TACOp,
    arg1?: string,
    arg2?: string,
    result?: string,
    rawText?: string,
    sourceNodeId?: string,
    description?: string,
    stageInfo?: string
  ): TACInstruction {
    const id = this.nextInstrId++;
    let raw = rawText;

    if (!raw) {
      if (op === 'label') {
        raw = `${result}:`;
      } else if (op === 'goto') {
        raw = `goto ${arg1 || '_'}`;
      } else if (op === 'if_goto') {
        raw = `if ${arg1} ${arg2} goto ${result || '_'}`;
      } else if (op === 'if_false_goto') {
        raw = `ifFalse ${arg1} ${arg2} goto ${result || '_'}`;
      } else if (op === '=') {
        raw = `${result} = ${arg1}`;
      } else if (['+', '-', '*', '/', '%'].includes(op)) {
        raw = `${result} = ${arg1} ${op} ${arg2}`;
      } else {
        raw = `${result} = ${arg1} ${op} ${arg2}`;
      }
    }

    const inst: TACInstruction = {
      id,
      op,
      arg1,
      arg2,
      result,
      raw,
      sourceNodeId,
      description: description || `Generated instruction ${id}`,
      stageInfo,
    };

    this.instructions.push(inst);
    return inst;
  }

  public generate(ast: ProgramNode): TACInstruction[] {
    this.instructions = [];
    this.nextInstrId = 1;
    this.tempCounter = 1;
    this.labelCounter = 1;
    this.backpatchManager.reset();

    for (const stmt of ast.statements) {
      this.generateStatement(stmt);
    }

    return this.instructions;
  }

  private generateStatement(stmt: StatementNode): StmtResult {
    switch (stmt.type) {
      case 'VarDeclaration': {
        for (const decl of stmt.declarations) {
          if (decl.init) {
            const val = this.generateExpression(decl.init);
            this.emit(
              '=',
              val,
              undefined,
              decl.id,
              `${decl.id} = ${val}`,
              stmt.id,
              `Initialize declared variable '${decl.id}' with evaluated expression '${val}'`,
              'Declaration'
            );
          }
        }
        return { nextlist: [] };
      }

      case 'AssignmentStatement': {
        const val = this.generateExpression(stmt.expression);
        this.emit(
          '=',
          val,
          undefined,
          stmt.variable,
          `${stmt.variable} = ${val}`,
          stmt.id,
          `Assign value of '${val}' to variable '${stmt.variable}'`,
          'Assignment'
        );
        return { nextlist: [] };
      }

      case 'IfStatement': {
        // If without else:
        // B.code
        // label M1:
        // S1.code
        // label M2:
        // backpatch(B.truelist, M1)
        // backpatch(B.falselist, M2)
        if (!stmt.alternate) {
          const bRes = this.generateBooleanExpr(stmt.condition);

          const m1 = this.newLabel();
          this.emit('label', undefined, undefined, m1, `${m1}:`, stmt.id, `True branch target for 'if'`, 'Control Flow');
          this.backpatchManager.backpatch(
            this.instructions,
            bRes.truelist,
            m1,
            'if condition',
            'Condition is TRUE -> jump to body'
          );

          const s1Res = this.generateStatement(stmt.consequent);

          const m2 = this.newLabel();
          this.emit('label', undefined, undefined, m2, `${m2}:`, stmt.id, `Exit label after 'if'`, 'Control Flow');
          this.backpatchManager.backpatch(
            this.instructions,
            bRes.falselist,
            m2,
            'if condition',
            'Condition is FALSE -> jump to exit'
          );
          this.backpatchManager.backpatch(
            this.instructions,
            s1Res.nextlist,
            m2,
            'if body next',
            'Body completed -> continue'
          );

          return { nextlist: [] };
        } else {
          // If with else:
          // B.code
          // label M1:
          // S1.code
          // goto _ (N)
          // label M2:
          // S2.code
          // label M3:
          const bRes = this.generateBooleanExpr(stmt.condition);

          const m1 = this.newLabel();
          this.emit('label', undefined, undefined, m1, `${m1}:`, stmt.id, `True branch target for 'if'`, 'Control Flow');
          this.backpatchManager.backpatch(
            this.instructions,
            bRes.truelist,
            m1,
            'if condition',
            'Condition TRUE -> jump to THEN branch'
          );

          const s1Res = this.generateStatement(stmt.consequent);

          // Skip else branch
          const skipInst = this.emit(
            'goto',
            '_',
            undefined,
            undefined,
            'goto _',
            stmt.id,
            'Unconditional jump past ELSE block',
            'Control Flow'
          );
          this.backpatchManager.recordJumpGen(skipInst.id, 'unconditional', 'goto _', 'skip else');
          const nNext = this.backpatchManager.makelist(skipInst.id, 'nextlist', 'skip else');

          const m2 = this.newLabel();
          this.emit('label', undefined, undefined, m2, `${m2}:`, stmt.id, `False branch target for 'else'`, 'Control Flow');
          this.backpatchManager.backpatch(
            this.instructions,
            bRes.falselist,
            m2,
            'if condition',
            'Condition FALSE -> jump to ELSE branch'
          );

          const s2Res = this.generateStatement(stmt.alternate);

          const m3 = this.newLabel();
          this.emit('label', undefined, undefined, m3, `${m3}:`, stmt.id, `Exit label after IF-ELSE`, 'Control Flow');

          // Backpatch all exits to m3
          const combinedExits = this.backpatchManager.merge(
            s1Res.nextlist,
            nNext,
            'nextlist',
            'then branch exit',
            'Combine then-branch jump and body next'
          );
          const allExits = this.backpatchManager.merge(
            combinedExits,
            s2Res.nextlist,
            'nextlist',
            'if-else exit',
            'Combine with else-branch next'
          );
          this.backpatchManager.backpatch(
            this.instructions,
            allExits,
            m3,
            'if-else nextlist',
            'All branches converge at exit label'
          );

          return { nextlist: [] };
        }
      }

      case 'WhileStatement': {
        // label M1: (loop header)
        // B.code
        // label M2: (loop body)
        // S1.code
        // goto M1
        // label M3: (loop exit)
        const m1 = this.newLabel();
        this.emit('label', undefined, undefined, m1, `${m1}:`, stmt.id, `Loop header / condition check for 'while'`, 'Loop');

        const bRes = this.generateBooleanExpr(stmt.condition);

        const m2 = this.newLabel();
        this.emit('label', undefined, undefined, m2, `${m2}:`, stmt.id, `Loop body start for 'while'`, 'Loop');
        this.backpatchManager.backpatch(
          this.instructions,
          bRes.truelist,
          m2,
          'while condition',
          'Condition TRUE -> execute loop body'
        );

        const sRes = this.generateStatement(stmt.body);

        // Jump back to loop condition
        this.emit(
          'goto',
          m1,
          undefined,
          undefined,
          `goto ${m1}`,
          stmt.id,
          `Jump back to loop header '${m1}' to re-evaluate condition`,
          'Loop'
        );

        const m3 = this.newLabel();
        this.emit('label', undefined, undefined, m3, `${m3}:`, stmt.id, `Loop exit label for 'while'`, 'Loop');
        this.backpatchManager.backpatch(
          this.instructions,
          bRes.falselist,
          m3,
          'while condition',
          'Condition FALSE -> exit loop'
        );
        this.backpatchManager.backpatch(
          this.instructions,
          sRes.nextlist,
          m1,
          'body nextlist',
          'Body end jumps back to loop header'
        );

        return { nextlist: [] };
      }

      case 'BlockStatement': {
        let currentNext: number[] = [];
        for (const inner of stmt.statements) {
          const res = this.generateStatement(inner);
          currentNext = this.backpatchManager.merge(
            currentNext,
            res.nextlist,
            'nextlist',
            'block statement',
            'Merge sequential statement exits'
          );
        }
        return { nextlist: currentNext };
      }

      case 'ExpressionStatement': {
        this.generateExpression(stmt.expression);
        return { nextlist: [] };
      }

      default:
        return { nextlist: [] };
    }
  }

  // Generates code for Boolean expressions with truelist and falselist
  public generateBooleanExpr(expr: ExpressionNode): BExprResult {
    switch (expr.type) {
      case 'RelationalExpression': {
        const leftVal = this.generateExpression(expr.left);
        const rightVal = this.generateExpression(expr.right);
        const exprStr = `${leftVal} ${expr.operator} ${rightVal}`;

        // 1. Emit conditional jump: if left relop right goto _
        const jumpTrue = this.emit(
          'if_goto',
          leftVal,
          `${expr.operator} ${rightVal}`,
          '_',
          `if ${leftVal} ${expr.operator} ${rightVal} goto _`,
          expr.id,
          `Check condition '${exprStr}'; jump if true`,
          'Relational'
        );
        this.backpatchManager.recordJumpGen(jumpTrue.id, 'conditional', jumpTrue.raw, exprStr);
        const truelist = this.backpatchManager.makelist(jumpTrue.id, 'truelist', exprStr);

        // 2. Emit unconditional jump: goto _ (false branch)
        const jumpFalse = this.emit(
          'goto',
          '_',
          undefined,
          undefined,
          'goto _',
          expr.id,
          `Fall-through when '${exprStr}' is false`,
          'Relational'
        );
        this.backpatchManager.recordJumpGen(jumpFalse.id, 'unconditional', jumpFalse.raw, exprStr);
        const falselist = this.backpatchManager.makelist(jumpFalse.id, 'falselist', exprStr);

        return { truelist, falselist };
      }

      case 'LogicalExpression': {
        if (expr.operator === '&&') {
          // B -> B1 && M B2
          // backpatch(B1.truelist, M.label)
          // B.truelist = B2.truelist
          // B.falselist = merge(B1.falselist, B2.falselist)
          const b1 = this.generateBooleanExpr(expr.left);

          const m = this.newLabel();
          this.emit('label', undefined, undefined, m, `${m}:`, expr.id, `Target for left operand TRUE in '&&'`, 'Short-Circuit');
          this.backpatchManager.backpatch(
            this.instructions,
            b1.truelist,
            m,
            'B1 && B2',
            `Left conjunct of '&&' evaluated to TRUE; check right conjunct`
          );

          const b2 = this.generateBooleanExpr(expr.right);

          const falselist = this.backpatchManager.merge(
            b1.falselist,
            b2.falselist,
            'falselist',
            'B1 && B2',
            `Either conjunct evaluates to FALSE -> whole expression is FALSE`
          );

          return {
            truelist: b2.truelist,
            falselist,
          };
        } else if (expr.operator === '||') {
          // B -> B1 || M B2
          // backpatch(B1.falselist, M.label)
          // B.truelist = merge(B1.truelist, B2.truelist)
          // B.falselist = B2.falselist
          const b1 = this.generateBooleanExpr(expr.left);

          const m = this.newLabel();
          this.emit('label', undefined, undefined, m, `${m}:`, expr.id, `Target for left operand FALSE in '||'`, 'Short-Circuit');
          this.backpatchManager.backpatch(
            this.instructions,
            b1.falselist,
            m,
            'B1 || B2',
            `Left disjunct of '||' evaluated to FALSE; check right disjunct`
          );

          const b2 = this.generateBooleanExpr(expr.right);

          const truelist = this.backpatchManager.merge(
            b1.truelist,
            b2.truelist,
            'truelist',
            'B1 || B2',
            `Either disjunct evaluates to TRUE -> whole expression is TRUE`
          );

          return {
            truelist,
            falselist: b2.falselist,
          };
        }
        break;
      }

      case 'UnaryExpression': {
        if (expr.operator === '!') {
          // B -> ! B1
          // B.truelist = B1.falselist
          // B.falselist = B1.truelist
          const b1 = this.generateBooleanExpr(expr.operand);
          return {
            truelist: b1.falselist,
            falselist: b1.truelist,
          };
        }
        break;
      }

      default: {
        // General expression used as boolean (e.g., if (x))
        const val = this.generateExpression(expr);
        const exprStr = `${val} != 0`;

        const jumpTrue = this.emit(
          'if_goto',
          val,
          '!= 0',
          '_',
          `if ${val} != 0 goto _`,
          expr.id,
          `Truthy test: jump if '${val}' is non-zero`,
          'Truthiness'
        );
        this.backpatchManager.recordJumpGen(jumpTrue.id, 'conditional', jumpTrue.raw, exprStr);
        const truelist = this.backpatchManager.makelist(jumpTrue.id, 'truelist', exprStr);

        const jumpFalse = this.emit(
          'goto',
          '_',
          undefined,
          undefined,
          'goto _',
          expr.id,
          `Falsey test: fall-through if '${val}' is zero`,
          'Truthiness'
        );
        this.backpatchManager.recordJumpGen(jumpFalse.id, 'unconditional', jumpFalse.raw, exprStr);
        const falselist = this.backpatchManager.makelist(jumpFalse.id, 'falselist', exprStr);

        return { truelist, falselist };
      }
    }

    return { truelist: [], falselist: [] };
  }

  // Generates code for arithmetic/value expressions, returning variable or temp name
  public generateExpression(expr: ExpressionNode): string {
    switch (expr.type) {
      case 'Identifier':
        return expr.name;

      case 'Literal':
        return expr.raw;

      case 'BinaryExpression': {
        const leftVal = this.generateExpression(expr.left);
        const rightVal = this.generateExpression(expr.right);
        const temp = this.newTemp();

        this.emit(
          expr.operator,
          leftVal,
          rightVal,
          temp,
          `${temp} = ${leftVal} ${expr.operator} ${rightVal}`,
          expr.id,
          `Perform binary '${expr.operator}' operation on '${leftVal}' and '${rightVal}'`,
          'Arithmetic'
        );
        return temp;
      }

      case 'UnaryExpression': {
        if (expr.operator === '-') {
          const operandVal = this.generateExpression(expr.operand);
          const temp = this.newTemp();
          this.emit(
            '-',
            operandVal,
            undefined,
            temp,
            `${temp} = -${operandVal}`,
            expr.id,
            `Unary negation of '${operandVal}'`,
            'Arithmetic'
          );
          return temp;
        } else if (expr.operator === '!') {
          // Convert boolean to numeric 0 or 1
          return this.booleanToValue(expr);
        }
        return this.generateExpression(expr.operand);
      }

      case 'RelationalExpression':
      case 'LogicalExpression':
        // If a boolean expression is evaluated for its value (e.g. x = a > b)
        return this.booleanToValue(expr);

      default:
        return '0';
    }
  }

  // Convert a boolean expression into 1 or 0 value stored in a temporary
  private booleanToValue(expr: ExpressionNode): string {
    const temp = this.newTemp();
    const bRes = this.generateBooleanExpr(expr);

    const trueLabel = this.newLabel();
    const endLabel = this.newLabel();

    this.emit('label', undefined, undefined, trueLabel, `${trueLabel}:`, expr.id, 'Boolean true outcome', 'Boolean Value');
    this.backpatchManager.backpatch(this.instructions, bRes.truelist, trueLabel, 'boolean value', 'Condition true');
    this.emit('=', '1', undefined, temp, `${temp} = 1`, expr.id, `Assign 1 (true) to ${temp}`, 'Boolean Value');
    this.emit('goto', endLabel, undefined, undefined, `goto ${endLabel}`, expr.id, 'Jump to join point', 'Boolean Value');

    const falseLabel = this.newLabel();
    this.emit('label', undefined, undefined, falseLabel, `${falseLabel}:`, expr.id, 'Boolean false outcome', 'Boolean Value');
    this.backpatchManager.backpatch(this.instructions, bRes.falselist, falseLabel, 'boolean value', 'Condition false');
    this.emit('=', '0', undefined, temp, `${temp} = 0`, expr.id, `Assign 0 (false) to ${temp}`, 'Boolean Value');

    this.emit('label', undefined, undefined, endLabel, `${endLabel}:`, expr.id, 'Boolean evaluation complete', 'Boolean Value');

    return temp;
  }
}
