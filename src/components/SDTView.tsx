// src/components/SDTView.tsx
import React, { useState } from 'react';
import {
  Workflow,
  Sparkles,
  Layers,
  ArrowDown,
  ArrowUp,
  FileCode2,
  CheckCircle2,
  HelpCircle,
  Hash,
} from 'lucide-react';
import { CompilationResult, SDTStep } from '../compiler/types';

interface SDTViewProps {
  compilationResult: CompilationResult | null;
}

export const SDTView: React.FC<SDTViewProps> = ({ compilationResult }) => {
  const steps = compilationResult?.sdtSteps || [];
  const [selectedOrder, setSelectedOrder] = useState<number>(1);

  if (!compilationResult || steps.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Workflow className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">No SDT derivations available. Compile a program to inspect syntax-directed translation.</p>
      </div>
    );
  }

  const activeStep: SDTStep = steps.find((s) => s.order === selectedOrder) || steps[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Workflow className="w-5 h-5 text-indigo-400" />
            <span>Syntax-Directed Translation (SDT) Inspector</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Grammar productions augmented with semantic actions. Demonstrating S-attributed bottom-up syntheses and L-attributed inherited control-flow targets.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
            {steps.length} SDT Production Steps Derived
          </span>
        </div>
      </div>

      {/* Conceptual Principles Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-slate-900/60">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
            <ArrowUp className="w-4 h-4" />
            <span>S-Attributed Definitions (Bottom-Up)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Attributes evaluated solely from child nodes. Used for arithmetic expressions, operator reduction,
            and intermediate temporary allocation (<code className="text-emerald-300 font-mono">E.val = newtemp()</code>).
          </p>
        </div>

        <div className="p-4 rounded-xl border border-rose-500/30 bg-slate-900/60">
          <div className="flex items-center gap-2 text-rose-400 font-bold mb-1">
            <ArrowDown className="w-4 h-4" />
            <span>Inherited Attributes (Top-Down / Sibling)</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Attributes passed downward from parents or left siblings. Used for statement-level control flow,
            jump targets (<code className="text-rose-300 font-mono">trueTarget</code>, <code className="text-rose-300 font-mono">falseTarget</code>, <code className="text-rose-300 font-mono">S.next</code>), and data types.
          </p>
        </div>
      </div>

      {/* Active Step Detailed Semantic Card */}
      <div className="p-6 rounded-xl border border-slate-800 bg-slate-950 shadow-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-mono font-bold flex items-center justify-center text-xs">
              #{activeStep.order}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                AST Node: {activeStep.nodeType} ({activeStep.nodeLabel})
              </span>
              <h3 className="text-base font-bold text-white font-mono">{activeStep.productionRule}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={activeStep.order <= 1}
              onClick={() => setSelectedOrder((o) => Math.max(1, o - 1))}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Previous Rule
            </button>
            <button
              disabled={activeStep.order >= steps.length}
              onClick={() => setSelectedOrder((o) => Math.min(steps.length, o + 1))}
              className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-medium disabled:opacity-40"
            >
              Next Rule
            </button>
          </div>
        </div>

        {/* Semantic Action Expression */}
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Semantic Action Rule:
          </span>
          <pre className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs text-indigo-300 overflow-x-auto">
            {activeStep.semanticAction}
          </pre>
        </div>

        {/* Synthesized vs Inherited Attribute Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Synthesized */}
          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Synthesized Attributes (Parent receives from Children)</span>
              </span>
            </div>
            {Object.keys(activeStep.synthesized).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No synthesized attributes for this production.</p>
            ) : (
              <div className="space-y-1.5 font-mono text-xs">
                {Object.entries(activeStep.synthesized).map(([key, val]) => (
                  <div key={key} className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold">{key}:</span>
                    <span className="text-emerald-300 font-bold">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inherited */}
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Inherited Attributes (Passed downward from Context)</span>
              </span>
            </div>
            {Object.keys(activeStep.inherited).length === 0 ? (
              <p className="text-xs text-slate-500 italic">No inherited attributes for this production.</p>
            ) : (
              <div className="space-y-1.5 font-mono text-xs">
                {Object.entries(activeStep.inherited).map(([key, val]) => (
                  <div key={key} className="flex justify-between p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 font-semibold">{key}:</span>
                    <span className="text-rose-300 font-bold">{String(val)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Emitted Code & Pedagogical Explanation */}
        <div className="space-y-3 pt-2">
          {activeStep.emittedCode.length > 0 && (
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Generated Intermediate Code (SDT Translation Output):
              </span>
              <div className="p-3 rounded-lg bg-slate-900 border border-emerald-500/30 font-mono text-xs text-emerald-300 space-y-1">
                {activeStep.emittedCode.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white block mb-0.5">Translation Mechanics:</span>
            {activeStep.explanation}
          </div>
        </div>
      </div>

      {/* Complete SDT Derivation History Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Workflow className="w-4 h-4 text-indigo-400" />
            <span>Complete SDT Evaluation Sequence</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">Click any row to inspect</span>
        </div>

        <div className="overflow-x-auto max-h-[380px]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-4 w-14">#</th>
                <th className="py-2.5 px-4">Grammar Production Rule</th>
                <th className="py-2.5 px-4 text-emerald-400">Synthesized Attribute</th>
                <th className="py-2.5 px-4 text-rose-400">Inherited Attribute</th>
                <th className="py-2.5 px-4 font-sans text-slate-400">Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {steps.map((st) => (
                <tr
                  key={st.order}
                  onClick={() => setSelectedOrder(st.order)}
                  className={`cursor-pointer transition-colors ${
                    selectedOrder === st.order
                      ? 'bg-indigo-950/40 text-white font-semibold'
                      : 'hover:bg-slate-900/50 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-4 text-slate-500 font-bold">{st.order}</td>
                  <td className="py-2.5 px-4 font-bold text-indigo-300">{st.productionRule}</td>
                  <td className="py-2.5 px-4 text-emerald-300">
                    {Object.entries(st.synthesized).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}
                  </td>
                  <td className="py-2.5 px-4 text-rose-300">
                    {Object.entries(st.inherited).map(([k, v]) => `${k}=${v}`).join(', ') || '—'}
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px] truncate max-w-xs">
                    {st.explanation}
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
