// src/compiler/postfix.ts
import { ExpressionNode, PostfixResult, PostfixStep, ProgramNode, StatementNode } from './types';

export class PostfixGenerator {
  public static generateFromProgram(ast: ProgramNode): PostfixResult[] {
    const results: PostfixResult[] = [];

    for (const stmt of ast.statements) {
      this.extractExpressionsFromStatement(stmt, results);
    }

    return results;
  }

  private static extractExpressionsFromStatement(stmt: StatementNode, results: PostfixResult[]): void {
    switch (stmt.type) {
      case 'AssignmentStatement':
        results.push(this.generateForExpression(stmt.expression, `${stmt.variable} = <expr>`));
        break;
      case 'VarDeclaration':
        for (const decl of stmt.declarations) {
          if (decl.init) {
            results.push(this.generateForExpression(decl.init, `${decl.id} = <init>`));
          }
        }
        break;
      case 'IfStatement':
        results.push(this.generateForExpression(stmt.condition, 'if (<condition>)'));
        this.extractExpressionsFromStatement(stmt.consequent, results);
        if (stmt.alternate) {
          this.extractExpressionsFromStatement(stmt.alternate, results);
        }
        break;
      case 'WhileStatement':
        results.push(this.generateForExpression(stmt.condition, 'while (<condition>)'));
        this.extractExpressionsFromStatement(stmt.body, results);
        break;
      case 'BlockStatement':
        for (const inner of stmt.statements) {
          this.extractExpressionsFromStatement(inner, results);
        }
        break;
      case 'ExpressionStatement':
        results.push(this.generateForExpression(stmt.expression, '<expression>;'));
        break;
    }
  }

  public static generateForExpression(expr: ExpressionNode, contextHint: string = ''): PostfixResult {
    const tokens: string[] = [];
    const postfixTokens: string[] = [];
    const steps: PostfixStep[] = [];
    let stepCount = 1;

    // Post-order traversal of AST
    const traverse = (node: ExpressionNode) => {
      switch (node.type) {
        case 'Identifier':
          tokens.push(node.name);
          postfixTokens.push(node.name);
          steps.push({
            step: stepCount++,
            inputToken: node.name,
            stack: [],
            output: [...postfixTokens],
            action: `Output operand '${node.name}'`,
            reason: 'In post-order AST traversal, leaf operands are emitted immediately.',
          });
          break;

        case 'Literal':
          tokens.push(node.raw);
          postfixTokens.push(node.raw);
          steps.push({
            step: stepCount++,
            inputToken: node.raw,
            stack: [],
            output: [...postfixTokens],
            action: `Output literal '${node.raw}'`,
            reason: 'Numeric literals are emitted directly to the postfix stream.',
          });
          break;

        case 'BinaryExpression':
        case 'RelationalExpression':
        case 'LogicalExpression':
          // Traverse left, traverse right, then emit operator
          traverse(node.left);
          traverse(node.right);
          tokens.push(node.operator);
          postfixTokens.push(node.operator);
          steps.push({
            step: stepCount++,
            inputToken: node.operator,
            stack: [node.operator],
            output: [...postfixTokens],
            action: `Emit operator '${node.operator}' after both operands`,
            reason: `Post-order traversal (Left, Right, Root) ensures operands are evaluated before operator '${node.operator}'.`,
          });
          break;

        case 'UnaryExpression':
          traverse(node.operand);
          tokens.push(node.operator);
          postfixTokens.push(node.operator);
          steps.push({
            step: stepCount++,
            inputToken: node.operator,
            stack: [node.operator],
            output: [...postfixTokens],
            action: `Emit unary operator '${node.operator}'`,
            reason: `Unary operator '${node.operator}' follows its single operand in postfix representation.`,
          });
          break;
      }
    };

    traverse(expr);

    const sourceExpression = this.formatExpression(expr);
    const postfixString = postfixTokens.join(' ');

    const astTraversalExplanation =
      `Post-Order AST Traversal Algorithm: Postfix (Reverse Polish Notation) eliminates parentheses by placing every operator immediately after its operands. ` +
      `We traverse the expression subtree using Post-Order (Left subtree → Right subtree → Operator node). ` +
      `Because of this, operator precedence is encoded directly in the order of operands and operators without ambiguity.`;

    return {
      expressionId: expr.id,
      sourceExpression: contextHint ? `${contextHint}: ${sourceExpression}` : sourceExpression,
      tokens,
      postfixTokens,
      postfixString,
      steps,
      astTraversalExplanation,
    };
  }

  public static formatExpression(expr: ExpressionNode): string {
    switch (expr.type) {
      case 'Identifier':
        return expr.name;
      case 'Literal':
        return expr.raw;
      case 'BinaryExpression':
      case 'RelationalExpression':
      case 'LogicalExpression':
        return `(${this.formatExpression(expr.left)} ${expr.operator} ${this.formatExpression(expr.right)})`;
      case 'UnaryExpression':
        return `${expr.operator}(${this.formatExpression(expr.operand)})`;
      default:
        return '';
    }
  }
}
