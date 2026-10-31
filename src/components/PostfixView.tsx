// src/components/PostfixView.tsx
import React, { useState } from 'react';
import {
  ArrowRightLeft,
  BookOpen,
  Layers,
  ChevronRight,
  ListOrdered,
  HelpCircle,
  Copy,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { CompilationResult, PostfixResult } from '../compiler/types';

interface PostfixViewProps {
  compilationResult: CompilationResult | null;
}

export const PostfixView: React.FC<PostfixViewProps> = ({ compilationResult }) => {
  const [copied, setCopied] = useState(false);
  const postfixResults = compilationResult?.postfixResults || [];
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!compilationResult || postfixResults.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <ArrowRightLeft className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">No arithmetic expressions parsed. Compile a program with expressions to inspect postfix output.</p>
      </div>
    );
  }

  const activeResult: PostfixResult = postfixResults[Math.min(selectedIndex, postfixResults.length - 1)];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeResult.postfixString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <span>Postfix Notation (Reverse Polish Notation)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Parenthesis-free intermediate representation generated via post-order traversal (Left → Right → Root) of expression ASTs.
          </p>
        </div>

        {/* Expression Selector */}
        {postfixResults.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Select Expression:</span>
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(parseInt(e.target.value, 10))}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 font-mono"
            >
              {postfixResults.map((res, i) => (
                <option key={res.expressionId} value={i}>
                  Expr #{i + 1}: {res.sourceExpression.length > 30 ? res.sourceExpression.slice(0, 30) + '…' : res.sourceExpression}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Comparison Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Source Infix */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Source Infix Expression
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Standard Algebraic
              </span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-sm text-cyan-300 font-bold overflow-x-auto">
              {activeResult.sourceExpression}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 leading-relaxed">
            Requires parentheses and operator precedence rules (BODMAS / PEMDAS) to disambiguate evaluation order.
          </p>
        </div>

        {/* Generated Postfix */}
        <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Generated Postfix (RPN)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy RPN'}</span>
              </button>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-amber-500/30 font-mono text-sm text-amber-300 font-bold tracking-wider overflow-x-auto">
              {activeResult.postfixString}
            </div>
          </div>
          <p className="text-xs text-amber-200/80 mt-3 leading-relaxed">
            Operators strictly follow their operands. Can be directly evaluated on a stack machine without parentheses.
          </p>
        </div>
      </div>

      {/* Traversal Algorithm & Operator Precedence Explanation */}
      <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" />
          <span>AST Traversal & Precedence Mechanics</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {activeResult.astTraversalExplanation}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase font-sans">Step 1: Traverse Left</span>
            <span className="text-purple-300">traverse(node.left)</span>
            <p className="text-[11px] font-sans text-slate-400 mt-1">Evaluates all left subtree operands first.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase font-sans">Step 2: Traverse Right</span>
            <span className="text-cyan-300">traverse(node.right)</span>
            <p className="text-[11px] font-sans text-slate-400 mt-1">Evaluates all right subtree operands next.</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase font-sans">Step 3: Emit Operator</span>
            <span className="text-emerald-300">emit(node.operator)</span>
            <p className="text-[11px] font-sans text-slate-400 mt-1">Emits the root operator once both subtrees are ready.</p>
          </div>
        </div>
      </div>

      {/* Step-by-Step Traversal Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-cyan-400" />
            <span>Step-by-Step Post-Order Emission Sequence</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {activeResult.steps.length} total emission steps
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 w-16">Step</th>
                <th className="py-2.5 px-4 w-32">Visited Token</th>
                <th className="py-2.5 px-4">Action Taken</th>
                <th className="py-2.5 px-4">Postfix Stream So Far</th>
                <th className="py-2.5 px-4 font-sans text-slate-400">Pedagogical Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeResult.steps.map((st) => (
                <tr key={st.step} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 font-semibold">{st.step}</td>
                  <td className="py-2.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 font-bold">
                      {st.inputToken}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-200">{st.action}</td>
                  <td className="py-2.5 px-4 text-emerald-300 font-semibold">
                    {st.output.join(' ')}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px] leading-relaxed">
                    {st.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
