// src/compiler/compiler.ts
import { Lexer } from './lexer';
import { Parser } from './parser';
import { countASTNodes } from './ast';
import { PostfixGenerator } from './postfix';
import { TACGenerator } from './tac';
import { SDTAnalyzer } from './sdt';
import { BackpatchManager } from './backpatch';
import {
  CompilationResult,
  CompilerError,
  ExecutionTraceStep,
} from './types';

export class Compiler {
  public static compile(source: string): CompilationResult {
    const errors: CompilerError[] = [];

    // Stage 1: Lexical Analysis
    const lexer = new Lexer(source);
    const { tokens, errors: lexerErrors } = lexer.tokenize();
    errors.push(...lexerErrors);

    // If critical lexer errors occurred without valid tokens
    if (lexerErrors.length > 0 && tokens.length <= 1) {
      return this.failureResult(source, tokens, errors);
    }

    // Stage 2: Parsing & AST Construction
    const parser = new Parser(tokens);
    const { ast, errors: parserErrors } = parser.parse();
    errors.push(...parserErrors);

    if (!ast || parserErrors.length > 0) {
      return this.failureResult(source, tokens, errors, ast);
    }

    // Stage 3: Postfix Notation Extraction
    const postfixResults = PostfixGenerator.generateFromProgram(ast);

    // Stage 4: Three-Address Code & Backpatching
    const backpatchManager = new BackpatchManager();
    const tacGenerator = new TACGenerator(backpatchManager);
    const tacInstructions = tacGenerator.generate(ast);
    const backpatchSteps = backpatchManager.getSteps();
    const tacStats = tacGenerator.getStats();

    // Stage 5: Syntax-Directed Translation Analysis
    const sdtAnalyzer = new SDTAnalyzer();
    const sdtSteps = sdtAnalyzer.analyze(ast);

    // Stage 6: Build Detailed Execution Trace for Step-Through
    const executionTrace = this.buildExecutionTrace(tokens, ast, tacInstructions, sdtSteps, backpatchSteps);

    const astNodeCount = countASTNodes(ast);
    const lines = source.split('\n').length;

    // Count declarations
    let declarationsCount = 0;
    for (const stmt of ast.statements) {
      if (stmt.type === 'VarDeclaration') {
        declarationsCount += stmt.declarations.length;
      }
    }

    return {
      success: true,
      errors: [],
      tokens,
      ast,
      astNodeCount,
      postfixResults,
      tacInstructions,
      sdtSteps,
      backpatchSteps,
      executionTrace,
      stats: {
        lines,
        tokens: tokens.length,
        astNodes: astNodeCount,
        tacInstructions: tacInstructions.length,
        tempVarsCount: tacStats.tempVarsCount,
        labelsCount: tacStats.labelsCount,
        declarationsCount,
      },
    };
  }

  private static failureResult(
    source: string,
    tokens: any[],
    errors: CompilerError[],
    ast: any = null
  ): CompilationResult {
    return {
      success: false,
      errors,
      tokens,
      ast,
      astNodeCount: countASTNodes(ast),
      postfixResults: [],
      tacInstructions: [],
      sdtSteps: [],
      backpatchSteps: [],
      executionTrace: [],
      stats: {
        lines: source.split('\n').length,
        tokens: tokens.length,
        astNodes: countASTNodes(ast),
        tacInstructions: 0,
        tempVarsCount: 0,
        labelsCount: 0,
        declarationsCount: 0,
      },
    };
  }

  private static buildExecutionTrace(
    tokens: any[],
    ast: any,
    tacInstructions: any[],
    sdtSteps: any[],
    backpatchSteps: any[]
  ): ExecutionTraceStep[] {
    const trace: ExecutionTraceStep[] = [];
    let idx = 1;

    // Initial Lexer Summary
    trace.push({
      stepIndex: idx++,
      stage: 'lexer',
      title: 'Lexical Analysis Completed',
      description: `Generated ${tokens.length} tokens (including EOF) with line and column coordinates.`,
      statusText: 'Tokens Ready',
    });

    // Sample Token Scans
    for (let i = 0; i < Math.min(tokens.length - 1, 5); i++) {
      const tok = tokens[i];
      trace.push({
        stepIndex: idx++,
        stage: 'lexer',
        title: `Token #${tok.id}: [${tok.type}] '${tok.lexeme}'`,
        description: `Recognized '${tok.lexeme}' at Line ${tok.line}, Column ${tok.column}.`,
        activeTokenId: tok.id,
        statusText: `Lexeme: ${tok.lexeme}`,
      });
    }

    // AST Parse Summary
    trace.push({
      stepIndex: idx++,
      stage: 'ast',
      title: 'Abstract Syntax Tree Constructed',
      description: `Recursive-descent parser verified grammar and synthesized ${ast.statements.length} top-level statements.`,
      activeNodeId: ast.id,
      statusText: 'AST Complete',
    });

    // SDT Bottom-Up Steps
    for (const sdt of sdtSteps) {
      trace.push({
        stepIndex: idx++,
        stage: 'sdt',
        title: `SDT: ${sdt.productionRule}`,
        description: sdt.explanation,
        activeNodeId: sdt.nodeId,
        statusText: `Action: ${sdt.semanticAction.slice(0, 45)}...`,
      });
    }

    // Backpatching Jump & Target Trace
    for (const bp of backpatchSteps) {
      trace.push({
        stepIndex: idx++,
        stage: 'backpatch',
        title: `Backpatching: ${bp.title}`,
        description: bp.description,
        statusText: bp.action,
      });
    }

    // TAC Instruction Trace
    for (const tac of tacInstructions) {
      trace.push({
        stepIndex: idx++,
        stage: 'tac',
        title: `TAC Instruction #${tac.id}: ${tac.raw}`,
        description: tac.description,
        activeTacId: tac.id,
        activeNodeId: tac.sourceNodeId,
        statusText: `Quad: (${tac.op}, ${tac.arg1 || '-'}, ${tac.arg2 || '-'}, ${tac.result || '-'})`,
      });
    }

    return trace;
  }
}
