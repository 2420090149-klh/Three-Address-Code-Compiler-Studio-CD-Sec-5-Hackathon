// src/compiler/parser.ts
import {
  Token,
  TokenType,
  CompilerError,
  ProgramNode,
  StatementNode,
  ExpressionNode,
  VarDeclarationNode,
  AssignmentStatementNode,
  IfStatementNode,
  WhileStatementNode,
  BlockStatementNode,
  ExpressionStatementNode,
  BinaryExpressionNode,
  UnaryExpressionNode,
  IdentifierNode,
  LiteralNode,
  RelationalExpressionNode,
  LogicalExpressionNode,
} from './types';
import { generateNodeId, resetNodeIdCounter } from './ast';

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private errors: CompilerError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  public parse(): { ast: ProgramNode | null; errors: CompilerError[] } {
    this.current = 0;
    this.errors = [];
    resetNodeIdCounter();

    const statements: StatementNode[] = [];
    const startToken = this.peek();

    while (!this.isAtEnd()) {
      try {
        const stmt = this.statement();
        if (stmt) {
          statements.push(stmt);
        }
      } catch (err: any) {
        this.synchronize();
      }
    }

    const programNode: ProgramNode = {
      id: generateNodeId('prog'),
      type: 'Program',
      line: startToken.line,
      column: startToken.column,
      statements,
    };

    return {
      ast: this.errors.length > 0 && statements.length === 0 ? null : programNode,
      errors: this.errors,
    };
  }

  // Statements
  private statement(): StatementNode {
    const token = this.peek();

    if (token.type === 'KEYWORD_INT' || token.type === 'KEYWORD_FLOAT') {
      return this.varDeclaration();
    }

    if (token.type === 'KEYWORD_IF') {
      return this.ifStatement();
    }

    if (token.type === 'KEYWORD_WHILE') {
      return this.whileStatement();
    }

    if (token.type === 'LBRACE') {
      return this.blockStatement();
    }

    if (token.type === 'IDENTIFIER') {
      // Lookahead: is this assignment or expression statement?
      if (this.peek(1).type === 'OP_ASSIGN') {
        return this.assignmentStatement();
      }
    }

    return this.expressionStatement();
  }

  // Variable Declaration: int a, b = 5, c;
  private varDeclaration(): VarDeclarationNode {
    const typeToken = this.advance(); // int or float
    const dataType: 'int' | 'float' = typeToken.type === 'KEYWORD_INT' ? 'int' : 'float';
    const declarations: Array<{ id: string; init?: ExpressionNode }> = [];

    do {
      const idToken = this.consume('IDENTIFIER', "Expected variable identifier in declaration.");
      let init: ExpressionNode | undefined = undefined;

      if (this.match('OP_ASSIGN')) {
        init = this.expression();
      }

      declarations.push({ id: idToken.lexeme, init });
    } while (this.match('COMMA'));

    this.consume('SEMICOLON', "Expected ';' after variable declaration.");

    return {
      id: generateNodeId('decl'),
      type: 'VarDeclaration',
      dataType,
      declarations,
      line: typeToken.line,
      column: typeToken.column,
    };
  }

  // Assignment: id = expr;
  private assignmentStatement(): AssignmentStatementNode {
    const idToken = this.consume('IDENTIFIER', "Expected variable name for assignment.");
    const eqToken = this.consume('OP_ASSIGN', "Expected '=' in assignment statement.");
    const expr = this.expression();
    this.consume('SEMICOLON', "Expected ';' after assignment statement.");

    return {
      id: generateNodeId('assign'),
      type: 'AssignmentStatement',
      variable: idToken.lexeme,
      expression: expr,
      line: eqToken.line,
      column: eqToken.column,
    };
  }

  // If Statement: if ( condition ) stmt [ else stmt ]
  private ifStatement(): IfStatementNode {
    const ifToken = this.consume('KEYWORD_IF', "Expected 'if'.");
    this.consume('LPAREN', "Expected '(' after 'if'.");
    const condition = this.expression();
    this.consume('RPAREN', "Expected ')' after if condition.");

    const consequent = this.statement();
    let alternate: StatementNode | undefined = undefined;

    if (this.match('KEYWORD_ELSE')) {
      alternate = this.statement();
    }

    return {
      id: generateNodeId('if'),
      type: 'IfStatement',
      condition,
      consequent,
      alternate,
      line: ifToken.line,
      column: ifToken.column,
    };
  }

  // While Statement: while ( condition ) stmt
  private whileStatement(): WhileStatementNode {
    const whileToken = this.consume('KEYWORD_WHILE', "Expected 'while'.");
    this.consume('LPAREN', "Expected '(' after 'while'.");
    const condition = this.expression();
    this.consume('RPAREN', "Expected ')' after while condition.");
    const body = this.statement();

    return {
      id: generateNodeId('while'),
      type: 'WhileStatement',
      condition,
      body,
      line: whileToken.line,
      column: whileToken.column,
    };
  }

  // Block Statement: { stmt* }
  private blockStatement(): BlockStatementNode {
    const lbrace = this.consume('LBRACE', "Expected '{'.");
    const statements: StatementNode[] = [];

    while (!this.check('RBRACE') && !this.isAtEnd()) {
      statements.push(this.statement());
    }

    this.consume('RBRACE', "Expected '}' after block.");

    return {
      id: generateNodeId('block'),
      type: 'BlockStatement',
      statements,
      line: lbrace.line,
      column: lbrace.column,
    };
  }

  // Expression Statement: expr;
  private expressionStatement(): ExpressionStatementNode {
    const expr = this.expression();
    this.consume('SEMICOLON', "Expected ';' after expression.");

    return {
      id: generateNodeId('exprStmt'),
      type: 'ExpressionStatement',
      expression: expr,
      line: expr.line,
      column: expr.column,
    };
  }

  // Expressions (Precedence Hierarchy)
  public expression(): ExpressionNode {
    return this.logicalOr();
  }

  // Logical OR: expr || expr
  private logicalOr(): ExpressionNode {
    let expr = this.logicalAnd();

    while (this.match('OP_OR')) {
      const opToken = this.previous();
      const right = this.logicalAnd();
      expr = {
        id: generateNodeId('or'),
        type: 'LogicalExpression',
        operator: '||',
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      } as LogicalExpressionNode;
    }

    return expr;
  }

  // Logical AND: expr && expr
  private logicalAnd(): ExpressionNode {
    let expr = this.equality();

    while (this.match('OP_AND')) {
      const opToken = this.previous();
      const right = this.equality();
      expr = {
        id: generateNodeId('and'),
        type: 'LogicalExpression',
        operator: '&&',
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      } as LogicalExpressionNode;
    }

    return expr;
  }

  // Equality: ==, !=
  private equality(): ExpressionNode {
    let expr = this.relational();

    while (this.match('OP_EQ', 'OP_NEQ')) {
      const opToken = this.previous();
      const op = opToken.lexeme as '==' | '!=';
      const right = this.relational();
      expr = {
        id: generateNodeId('rel'),
        type: 'RelationalExpression',
        operator: op,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      } as RelationalExpressionNode;
    }

    return expr;
  }

  // Relational: <, <=, >, >=
  private relational(): ExpressionNode {
    let expr = this.additive();

    while (this.match('OP_LT', 'OP_LE', 'OP_GT', 'OP_GE')) {
      const opToken = this.previous();
      const op = opToken.lexeme as '<' | '<=' | '>' | '>=';
      const right = this.additive();
      expr = {
        id: generateNodeId('rel'),
        type: 'RelationalExpression',
        operator: op,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      } as RelationalExpressionNode;
    }

    return expr;
  }

  // Additive: +, -
  private additive(): ExpressionNode {
    let expr = this.multiplicative();

    while (this.match('OP_PLUS', 'OP_MINUS')) {
      const opToken = this.previous();
      const op = opToken.lexeme as '+' | '-';
      const right = this.multiplicative();
      expr = {
        id: generateNodeId('bin'),
        type: 'BinaryExpression',
        operator: op,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      } as BinaryExpressionNode;
    }

    return expr;
  }

  // Multiplicative: *, /, %
  private multiplicative(): ExpressionNode {
    let expr = this.unary();

    while (this.match('OP_MUL', 'OP_DIV', 'OP_MOD')) {
      const opToken = this.previous();
      const op = opToken.lexeme as '*' | '/' | '%';
      const right = this.unary();
      expr = {
        id: generateNodeId('bin'),
        type: 'BinaryExpression',
        operator: op,
        left: expr,
        right,
        line: opToken.line,
        column: opToken.column,
      } as BinaryExpressionNode;
    }

    return expr;
  }

  // Unary: -, !
  private unary(): ExpressionNode {
    if (this.match('OP_MINUS', 'OP_NOT')) {
      const opToken = this.previous();
      const op = opToken.lexeme as '-' | '!';
      const operand = this.unary();
      return {
        id: generateNodeId('un'),
        type: 'UnaryExpression',
        operator: op,
        operand,
        line: opToken.line,
        column: opToken.column,
      } as UnaryExpressionNode;
    }

    return this.primary();
  }

  // Primary: identifier, literal, or ( expression )
  private primary(): ExpressionNode {
    const token = this.peek();

    if (this.match('IDENTIFIER')) {
      return {
        id: generateNodeId('id'),
        type: 'Identifier',
        name: token.lexeme,
        line: token.line,
        column: token.column,
      } as IdentifierNode;
    }

    if (this.match('INT_LITERAL')) {
      return {
        id: generateNodeId('lit'),
        type: 'Literal',
        value: parseInt(token.lexeme, 10),
        raw: token.lexeme,
        dataType: 'int',
        line: token.line,
        column: token.column,
      } as LiteralNode;
    }

    if (this.match('FLOAT_LITERAL')) {
      return {
        id: generateNodeId('lit'),
        type: 'Literal',
        value: parseFloat(token.lexeme),
        raw: token.lexeme,
        dataType: 'float',
        line: token.line,
        column: token.column,
      } as LiteralNode;
    }

    if (this.match('LPAREN')) {
      const expr = this.expression();
      this.consume('RPAREN', "Expected ')' after grouped expression.");
      return expr;
    }

    throw this.error(token, `Unexpected token '${token.lexeme}'. Expected an expression.`);
  }

  // Helper utilities
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === 'EOF';
  }

  private peek(offset: number = 0): Token {
    const idx = this.current + offset;
    if (idx >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1];
    }
    return this.tokens[idx];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private error(token: Token, message: string): Error {
    const err: CompilerError = {
      stage: 'parser',
      line: token.line,
      column: token.column,
      message,
    };
    this.errors.push(err);
    return new Error(`Line ${token.line}:${token.column} - ${message}`);
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === 'SEMICOLON') return;

      switch (this.peek().type) {
        case 'KEYWORD_INT':
        case 'KEYWORD_FLOAT':
        case 'KEYWORD_IF':
        case 'KEYWORD_WHILE':
        case 'LBRACE':
        case 'RBRACE':
          return;
      }

      this.advance();
    }
  }
}
