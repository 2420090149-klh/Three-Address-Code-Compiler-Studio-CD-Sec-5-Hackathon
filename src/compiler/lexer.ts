// src/compiler/lexer.ts
import { Token, TokenType, CompilerError } from './types';

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;
  private tokens: Token[] = [];
  private errors: CompilerError[] = [];
  private tokenId: number = 1;

  private static KEYWORDS: Record<string, TokenType> = {
    int: 'KEYWORD_INT',
    float: 'KEYWORD_FLOAT',
    if: 'KEYWORD_IF',
    else: 'KEYWORD_ELSE',
    while: 'KEYWORD_WHILE',
    print: 'KEYWORD_PRINT',
  };

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): { tokens: Token[]; errors: CompilerError[] } {
    this.tokens = [];
    this.errors = [];
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.tokenId = 1;

    while (this.pos < this.source.length) {
      const char = this.source[this.pos];

      // Whitespace
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
        continue;
      }

      if (char === '\n') {
        this.advanceLine();
        continue;
      }

      // Single line comments
      if (char === '/' && this.peek() === '/') {
        this.skipLineComment();
        continue;
      }

      // Block comments
      if (char === '/' && this.peek() === '*') {
        this.skipBlockComment();
        continue;
      }

      const startLine = this.line;
      const startCol = this.col;

      // Numbers (int or float)
      if (this.isDigit(char)) {
        this.readNumber(startLine, startCol);
        continue;
      }

      // Identifiers & Keywords
      if (this.isAlpha(char) || char === '_') {
        this.readIdentifierOrKeyword(startLine, startCol);
        continue;
      }

      // Operators and Delimiters
      switch (char) {
        case '+':
          this.addToken('OP_PLUS', '+', startLine, startCol);
          this.advance();
          break;
        case '-':
          this.addToken('OP_MINUS', '-', startLine, startCol);
          this.advance();
          break;
        case '*':
          this.addToken('OP_MUL', '*', startLine, startCol);
          this.advance();
          break;
        case '/':
          this.addToken('OP_DIV', '/', startLine, startCol);
          this.advance();
          break;
        case '%':
          this.addToken('OP_MOD', '%', startLine, startCol);
          this.advance();
          break;
        case '=':
          if (this.peek() === '=') {
            this.addToken('OP_EQ', '==', startLine, startCol);
            this.advance(2);
          } else {
            this.addToken('OP_ASSIGN', '=', startLine, startCol);
            this.advance();
          }
          break;
        case '!':
          if (this.peek() === '=') {
            this.addToken('OP_NEQ', '!=', startLine, startCol);
            this.advance(2);
          } else {
            this.addToken('OP_NOT', '!', startLine, startCol);
            this.advance();
          }
          break;
        case '<':
          if (this.peek() === '=') {
            this.addToken('OP_LE', '<=', startLine, startCol);
            this.advance(2);
          } else {
            this.addToken('OP_LT', '<', startLine, startCol);
            this.advance();
          }
          break;
        case '>':
          if (this.peek() === '=') {
            this.addToken('OP_GE', '>=', startLine, startCol);
            this.advance(2);
          } else {
            this.addToken('OP_GT', '>', startLine, startCol);
            this.advance();
          }
          break;
        case '&':
          if (this.peek() === '&') {
            this.addToken('OP_AND', '&&', startLine, startCol);
            this.advance(2);
          } else {
            this.addError(startLine, startCol, "Unexpected character '&'. Did you mean '&&' for logical AND?");
            this.advance();
          }
          break;
        case '|':
          if (this.peek() === '|') {
            this.addToken('OP_OR', '||', startLine, startCol);
            this.advance(2);
          } else {
            this.addError(startLine, startCol, "Unexpected character '|'. Did you mean '||' for logical OR?");
            this.advance();
          }
          break;
        case '(':
          this.addToken('LPAREN', '(', startLine, startCol);
          this.advance();
          break;
        case ')':
          this.addToken('RPAREN', ')', startLine, startCol);
          this.advance();
          break;
        case '{':
          this.addToken('LBRACE', '{', startLine, startCol);
          this.advance();
          break;
        case '}':
          this.addToken('RBRACE', '}', startLine, startCol);
          this.advance();
          break;
        case ';':
          this.addToken('SEMICOLON', ';', startLine, startCol);
          this.advance();
          break;
        case ',':
          this.addToken('COMMA', ',', startLine, startCol);
          this.advance();
          break;
        default:
          this.addError(startLine, startCol, `Unrecognized character '${char}' (ASCII ${char.charCodeAt(0)})`);
          this.advance();
          break;
      }
    }

    this.tokens.push({
      id: this.tokenId++,
      type: 'EOF',
      lexeme: '<EOF>',
      line: this.line,
      column: this.col,
    });

    return { tokens: this.tokens, errors: this.errors };
  }

  private advance(n: number = 1): void {
    this.pos += n;
    this.col += n;
  }

  private advanceLine(): void {
    this.pos++;
    this.line++;
    this.col = 1;
  }

  private peek(offset: number = 1): string | null {
    const idx = this.pos + offset;
    return idx < this.source.length ? this.source[idx] : null;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  private skipLineComment(): void {
    while (this.pos < this.source.length && this.source[this.pos] !== '\n') {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(2); // skip /*

    while (this.pos < this.source.length) {
      if (this.source[this.pos] === '*' && this.peek() === '/') {
        this.advance(2); // skip */
        return;
      }
      if (this.source[this.pos] === '\n') {
        this.advanceLine();
      } else {
        this.advance();
      }
    }

    this.addError(startLine, startCol, 'Unterminated block comment (missing */)');
  }

  private readNumber(startLine: number, startCol: number): void {
    let numStr = '';
    let isFloat = false;

    while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
      numStr += this.source[this.pos];
      this.advance();
    }

    if (this.pos < this.source.length && this.source[this.pos] === '.' && this.peek() && this.isDigit(this.peek()!)) {
      isFloat = true;
      numStr += '.';
      this.advance(); // skip dot

      while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
        numStr += this.source[this.pos];
        this.advance();
      }
    }

    this.addToken(isFloat ? 'FLOAT_LITERAL' : 'INT_LITERAL', numStr, startLine, startCol);
  }

  private readIdentifierOrKeyword(startLine: number, startCol: number): void {
    let idStr = '';
    while (
      this.pos < this.source.length &&
      (this.isAlpha(this.source[this.pos]) || this.isDigit(this.source[this.pos]) || this.source[this.pos] === '_')
    ) {
      idStr += this.source[this.pos];
      this.advance();
    }

    const keywordType = Lexer.KEYWORDS[idStr];
    if (keywordType) {
      this.addToken(keywordType, idStr, startLine, startCol);
    } else {
      this.addToken('IDENTIFIER', idStr, startLine, startCol);
    }
  }

  private addToken(type: TokenType, lexeme: string, line: number, column: number): void {
    this.tokens.push({
      id: this.tokenId++,
      type,
      lexeme,
      line,
      column,
    });
  }

  private addError(line: number, column: number, message: string): void {
    this.errors.push({
      stage: 'lexer',
      line,
      column,
      message,
    });
  }
}
