// src/compiler/types.ts

export type TokenType =
  // Keywords
  | 'KEYWORD_INT'
  | 'KEYWORD_FLOAT'
  | 'KEYWORD_IF'
  | 'KEYWORD_ELSE'
  | 'KEYWORD_WHILE'
  | 'KEYWORD_PRINT'
  // Identifiers & Literals
  | 'IDENTIFIER'
  | 'INT_LITERAL'
  | 'FLOAT_LITERAL'
  // Operators
  | 'OP_ASSIGN'       // =
  | 'OP_PLUS'         // +
  | 'OP_MINUS'        // -
  | 'OP_MUL'          // *
  | 'OP_DIV'          // /
  | 'OP_MOD'          // %
  // Relational Operators
  | 'OP_EQ'           // ==
  | 'OP_NEQ'          // !=
  | 'OP_LT'           // <
  | 'OP_LE'           // <=
  | 'OP_GT'           // >
  | 'OP_GE'           // >=
  // Logical Operators
  | 'OP_AND'          // &&
  | 'OP_OR'           // ||
  | 'OP_NOT'          // !
  // Delimiters
  | 'LPAREN'          // (
  | 'RPAREN'          // )
  | 'LBRACE'          // {
  | 'RBRACE'          // }
  | 'SEMICOLON'       // ;
  | 'COMMA'           // ,
  // Special
  | 'EOF'
  | 'ERROR';

export interface Token {
  id: number;
  type: TokenType;
  lexeme: string;
  line: number;
  column: number;
  error?: string;
}

export interface CompilerError {
  line: number;
  column: number;
  message: string;
  stage: 'lexer' | 'parser' | 'sdt' | 'tac' | 'backpatch';
}

export type ASTNodeType =
  | 'Program'
  | 'VarDeclaration'
  | 'AssignmentStatement'
  | 'IfStatement'
  | 'WhileStatement'
  | 'BlockStatement'
  | 'ExpressionStatement'
  | 'BinaryExpression'
  | 'UnaryExpression'
  | 'Identifier'
  | 'Literal'
  | 'RelationalExpression'
  | 'LogicalExpression';

export interface BaseASTNode {
  id: string;
  type: ASTNodeType;
  line: number;
  column: number;
  synthesized?: Record<string, any>;
  inherited?: Record<string, any>;
}

export interface ProgramNode extends BaseASTNode {
  type: 'Program';
  statements: StatementNode[];
}

export interface VarDeclarationNode extends BaseASTNode {
  type: 'VarDeclaration';
  dataType: 'int' | 'float';
  declarations: Array<{
    id: string;
    init?: ExpressionNode;
  }>;
}

export interface AssignmentStatementNode extends BaseASTNode {
  type: 'AssignmentStatement';
  variable: string;
  expression: ExpressionNode;
}

export interface IfStatementNode extends BaseASTNode {
  type: 'IfStatement';
  condition: ExpressionNode;
  consequent: StatementNode;
  alternate?: StatementNode;
}

export interface WhileStatementNode extends BaseASTNode {
  type: 'WhileStatement';
  condition: ExpressionNode;
  body: StatementNode;
}

export interface BlockStatementNode extends BaseASTNode {
  type: 'BlockStatement';
  statements: StatementNode[];
}

export interface ExpressionStatementNode extends BaseASTNode {
  type: 'ExpressionStatement';
  expression: ExpressionNode;
}

export interface BinaryExpressionNode extends BaseASTNode {
  type: 'BinaryExpression';
  operator: '+' | '-' | '*' | '/' | '%';
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface UnaryExpressionNode extends BaseASTNode {
  type: 'UnaryExpression';
  operator: '-' | '!';
  operand: ExpressionNode;
}

export interface IdentifierNode extends BaseASTNode {
  type: 'Identifier';
  name: string;
}

export interface LiteralNode extends BaseASTNode {
  type: 'Literal';
  value: number;
  raw: string;
  dataType: 'int' | 'float';
}

export interface RelationalExpressionNode extends BaseASTNode {
  type: 'RelationalExpression';
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=';
  left: ExpressionNode;
  right: ExpressionNode;
}

export interface LogicalExpressionNode extends BaseASTNode {
  type: 'LogicalExpression';
  operator: '&&' | '||';
  left: ExpressionNode;
  right: ExpressionNode;
}

export type StatementNode =
  | VarDeclarationNode
  | AssignmentStatementNode
  | IfStatementNode
  | WhileStatementNode
  | BlockStatementNode
  | ExpressionStatementNode;

export type ExpressionNode =
  | BinaryExpressionNode
  | UnaryExpressionNode
  | IdentifierNode
  | LiteralNode
  | RelationalExpressionNode
  | LogicalExpressionNode;

export type ASTNode = ProgramNode | StatementNode | ExpressionNode;

// TAC Instruction Model
export type TACOp =
  | '='
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '=='
  | '!='
  | '<'
  | '<='
  | '>'
  | '>='
  | 'goto'
  | 'if_goto'
  | 'if_false_goto'
  | 'label'
  | 'print';

export interface TACInstruction {
  id: number;              // 1-based index (address)
  op: TACOp;
  arg1?: string;
  arg2?: string;
  result?: string;
  raw: string;
  sourceNodeId?: string;
  description: string;
  stageInfo?: string;
}

// Backpatching Details
export interface BackpatchStep {
  step: number;
  action: 'GENERATE_JUMP' | 'CREATE_LIST' | 'MERGE_LIST' | 'BACKPATCH';
  title: string;
  description: string;
  expression: string;
  instructionId?: number;
  listType?: 'truelist' | 'falselist' | 'nextlist';
  listValues?: number[];
  mergedFrom?: { list1: number[]; list2: number[] };
  targetLabel?: string;
  patchedInstructions?: number[];
  currentTacSnapshot: string[];
}

// Syntax-Directed Translation Details
export interface SDTStep {
  order: number;
  nodeId: string;
  nodeType: ASTNodeType;
  nodeLabel: string;
  productionRule: string;
  semanticAction: string;
  synthesized: Record<string, string>;
  inherited: Record<string, string>;
  emittedCode: string[];
  explanation: string;
}

// Postfix Conversion
export interface PostfixStep {
  step: number;
  inputToken: string;
  stack: string[];
  output: string[];
  action: string;
  reason: string;
}

export interface PostfixResult {
  expressionId: string;
  sourceExpression: string;
  tokens: string[];
  postfixTokens: string[];
  postfixString: string;
  steps: PostfixStep[];
  astTraversalExplanation: string;
}

// Step-by-Step Compilation Trace
export interface ExecutionTraceStep {
  stepIndex: number;
  stage: 'lexer' | 'parser' | 'ast' | 'postfix' | 'sdt' | 'tac' | 'backpatch';
  title: string;
  description: string;
  activeNodeId?: string;
  activeTacId?: number;
  activeTokenId?: number;
  codeSnippet?: string;
  statusText?: string;
}

// Full Compilation Output
export interface CompilationStats {
  lines: number;
  tokens: number;
  astNodes: number;
  tacInstructions: number;
  tempVarsCount: number;
  labelsCount: number;
  declarationsCount: number;
}

export interface CompilationResult {
  success: boolean;
  errors: CompilerError[];
  tokens: Token[];
  ast: ProgramNode | null;
  astNodeCount: number;
  postfixResults: PostfixResult[];
  tacInstructions: TACInstruction[];
  sdtSteps: SDTStep[];
  backpatchSteps: BackpatchStep[];
  executionTrace: ExecutionTraceStep[];
  stats: CompilationStats;
}
