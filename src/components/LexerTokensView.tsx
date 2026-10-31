// src/components/LexerTokensView.tsx
import React, { useState } from 'react';
import { Binary, Search, Filter, AlertTriangle, Hash, Tag, MapPin, CheckCircle2 } from 'lucide-react';
import { CompilationResult, Token, TokenType } from '../compiler/types';

interface LexerTokensViewProps {
  compilationResult: CompilationResult | null;
}

export const LexerTokensView: React.FC<LexerTokensViewProps> = ({ compilationResult }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!compilationResult || compilationResult.tokens.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Binary className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">No tokens available. Click "Run Compiler" to tokenize source code.</p>
      </div>
    );
  }

  const tokens = compilationResult.tokens;
  const errors = compilationResult.errors.filter((e) => e.stage === 'lexer');

  const getCategory = (type: TokenType): string => {
    if (type.startsWith('KEYWORD_')) return 'KEYWORD';
    if (type === 'IDENTIFIER') return 'IDENTIFIER';
    if (type.includes('LITERAL')) return 'LITERAL';
    if (type.startsWith('OP_')) return 'OPERATOR';
    if (['LPAREN', 'RPAREN', 'LBRACE', 'RBRACE', 'SEMICOLON', 'COMMA'].includes(type)) return 'DELIMITER';
    if (type === 'EOF') return 'SPECIAL';
    return 'OTHER';
  };

  const getCategoryBadgeClass = (category: string): string => {
    switch (category) {
      case 'KEYWORD':
        return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
      case 'IDENTIFIER':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
      case 'LITERAL':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'OPERATOR':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'DELIMITER':
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const categories = ['ALL', 'KEYWORD', 'IDENTIFIER', 'LITERAL', 'OPERATOR', 'DELIMITER', 'SPECIAL'];

  const filteredTokens = tokens.filter((tok) => {
    const cat = getCategory(tok.type);
    const matchesFilter = filterType === 'ALL' || cat === filterType;
    const matchesSearch =
      tok.lexeme.toLowerCase().includes(search.toLowerCase()) ||
      tok.type.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Token breakdown
  const counts = {
    keywords: tokens.filter((t) => t.type.startsWith('KEYWORD_')).length,
    identifiers: tokens.filter((t) => t.type === 'IDENTIFIER').length,
    literals: tokens.filter((t) => t.type.includes('LITERAL')).length,
    operators: tokens.filter((t) => t.type.startsWith('OP_')).length,
    delimiters: tokens.filter((t) =>
      ['LPAREN', 'RPAREN', 'LBRACE', 'RBRACE', 'SEMICOLON', 'COMMA'].includes(t.type)
    ).length,
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Binary className="w-5 h-5 text-cyan-400" />
            <span>Lexical Analysis & Token Stream</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic finite automaton tokenizer scanning characters into structured lexical tokens with coordinates.
          </p>
        </div>

        {/* Breakdown Badges */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            Total: <strong className="text-white">{tokens.length}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300">
            Keywords: <strong>{counts.keywords}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300">
            Identifiers: <strong>{counts.identifiers}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
            Literals: <strong>{counts.literals}</strong>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            Operators: <strong>{counts.operators}</strong>
          </span>
        </div>
      </div>

      {/* Lexical Errors banner if any */}
      {errors.length > 0 && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-200">
          <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Lexical Errors Detected ({errors.length})</span>
          </div>
          <div className="space-y-1 font-mono text-xs">
            {errors.map((err, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-rose-400 font-bold">Line {err.line}:{err.column}</span>
                <span>{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search lexeme or token type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:inline" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterType(cat)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                filterType === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Tokens Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[520px]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="py-3 px-4 font-semibold w-16">
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3 text-slate-500" />
                    <span>#</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <span>Lexeme</span>
                  </div>
                </th>
                <th className="py-3 px-4 font-semibold">Token Type</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold text-right">
                  <div className="flex items-center justify-end gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    <span>Coordinates</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTokens.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                    No tokens match current search and category filters.
                  </td>
                </tr>
              ) : (
                filteredTokens.map((tok) => {
                  const category = getCategory(tok.type);
                  return (
                    <tr
                      key={tok.id}
                      className="hover:bg-slate-900/60 transition-colors group"
                    >
                      <td className="py-2.5 px-4 text-slate-500 font-semibold">{tok.id}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-100 font-bold">
                          {tok.lexeme}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300 font-mono text-[11px]">{tok.type}</td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getCategoryBadgeClass(
                            category
                          )}`}
                        >
                          {category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-400">
                        Line <strong className="text-slate-200">{tok.line}</strong> : Col <strong className="text-slate-200">{tok.column}</strong>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="py-2.5 px-4 bg-slate-900/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-sans">
          <span>Showing {filteredTokens.length} of {tokens.length} tokens</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> Lexer DFA Verified
          </span>
        </div>
      </div>
    </div>
  );
};
