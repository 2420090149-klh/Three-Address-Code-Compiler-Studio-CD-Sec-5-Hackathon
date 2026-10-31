// src/compiler/ast.ts
import {
  ASTNode,
  ASTNodeType,
  BaseASTNode,
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

let nextId = 1;

export function resetNodeIdCounter() {
  nextId = 1;
}

export function generateNodeId(prefix: string = 'node'): string {
  return `${prefix}_${nextId++}`;
}

// Tree node structure for UI layout
export interface VisualTreeNode {
  id: string;
  name: string;
  category: 'statement' | 'expression' | 'operator' | 'identifier' | 'literal' | 'program';
  details: string;
  line: number;
  column: number;
  astNode: ASTNode;
  children: VisualTreeNode[];
  collapsed?: boolean;
  // Layout coordinates computed for SVG
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export function getASTNodeCategory(node: ASTNode): VisualTreeNode['category'] {
  switch (node.type) {
    case 'Program':
      return 'program';
    case 'VarDeclaration':
    case 'AssignmentStatement':
    case 'IfStatement':
    case 'WhileStatement':
    case 'BlockStatement':
    case 'ExpressionStatement':
      return 'statement';
    case 'BinaryExpression':
    case 'RelationalExpression':
    case 'LogicalExpression':
    case 'UnaryExpression':
      return 'operator';
    case 'Identifier':
      return 'identifier';
    case 'Literal':
      return 'literal';
    default:
      return 'expression';
  }
}

export function getASTNodeLabel(node: ASTNode): string {
  switch (node.type) {
    case 'Program':
      return 'Program';
    case 'VarDeclaration':
      return `Declare (${node.dataType})`;
    case 'AssignmentStatement':
      return `Assign (=)`;
    case 'IfStatement':
      return node.alternate ? 'If-Else' : 'If';
    case 'WhileStatement':
      return 'While Loop';
    case 'BlockStatement':
      return 'Block { }';
    case 'ExpressionStatement':
      return 'Expr Stmt';
    case 'BinaryExpression':
      return `Binary (${node.operator})`;
    case 'RelationalExpression':
      return `Relational (${node.operator})`;
    case 'LogicalExpression':
      return `Logical (${node.operator})`;
    case 'UnaryExpression':
      return `Unary (${node.operator})`;
    case 'Identifier':
      return `Id: ${node.name}`;
    case 'Literal':
      return `Num: ${node.raw}`;
    default:
      return (node as any).type || 'Node';
  }
}

export function getASTNodeDetails(node: ASTNode): string {
  switch (node.type) {
    case 'Program':
      return `Total Statements: ${node.statements.length}`;
    case 'VarDeclaration':
      return `Type: ${node.dataType}, Vars: ${node.declarations.map((d) => d.id).join(', ')}`;
    case 'AssignmentStatement':
      return `Target: ${node.variable}`;
    case 'IfStatement':
      return `Has Else branch: ${node.alternate ? 'Yes' : 'No'}`;
    case 'WhileStatement':
      return 'Iteration statement with entry condition';
    case 'BinaryExpression':
      return `Operation: ${node.operator}`;
    case 'RelationalExpression':
      return `Comparison: ${node.operator}`;
    case 'LogicalExpression':
      return `Boolean op: ${node.operator}`;
    case 'Identifier':
      return `Variable name: ${node.name}`;
    case 'Literal':
      return `Value: ${node.value} (${node.dataType})`;
    default:
      return '';
  }
}

export function countASTNodes(node: ASTNode | null): number {
  if (!node) return 0;
  let count = 1;
  const children = getASTChildren(node);
  for (const child of children) {
    count += countASTNodes(child);
  }
  return count;
}

export function getASTChildren(node: ASTNode): ASTNode[] {
  switch (node.type) {
    case 'Program':
      return node.statements;
    case 'VarDeclaration': {
      const exprs: ASTNode[] = [];
      for (const decl of node.declarations) {
        if (decl.init) exprs.push(decl.init);
      }
      return exprs;
    }
    case 'AssignmentStatement':
      return [
        {
          id: `${node.id}_lhs`,
          type: 'Identifier',
          name: node.variable,
          line: node.line,
          column: node.column,
        } as IdentifierNode,
        node.expression,
      ];
    case 'IfStatement': {
      const res: ASTNode[] = [node.condition, node.consequent];
      if (node.alternate) res.push(node.alternate);
      return res;
    }
    case 'WhileStatement':
      return [node.condition, node.body];
    case 'BlockStatement':
      return node.statements;
    case 'ExpressionStatement':
      return [node.expression];
    case 'BinaryExpression':
    case 'RelationalExpression':
    case 'LogicalExpression':
      return [node.left, node.right];
    case 'UnaryExpression':
      return [node.operand];
    case 'Identifier':
    case 'Literal':
      return [];
    default:
      return [];
  }
}

export function convertToVisualTree(node: ASTNode): VisualTreeNode {
  const children = getASTChildren(node).map((child) => convertToVisualTree(child));
  return {
    id: node.id,
    name: getASTNodeLabel(node),
    category: getASTNodeCategory(node),
    details: getASTNodeDetails(node),
    line: node.line,
    column: node.column,
    astNode: node,
    children,
  };
}

export function findNodeById(root: ASTNode | null, id: string): ASTNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  const children = getASTChildren(root);
  for (const child of children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}
