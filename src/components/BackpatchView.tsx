// src/components/BackpatchView.tsx
import React, { useState } from 'react';
import {
  Crosshair,
  ArrowRight,
  GitMerge,
  ListPlus,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { CompilationResult, BackpatchStep } from '../compiler/types';

interface BackpatchViewProps {
  compilationResult: CompilationResult | null;
}

export const BackpatchView: React.FC<BackpatchViewProps> = ({ compilationResult }) => {
  const steps = compilationResult?.backpatchSteps || [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  if (!compilationResult || steps.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Crosshair className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">
          No backpatching operations recorded. Compile a program with conditional statements (if, if-else, while) or boolean expressions (&&, ||) to view backpatching.
        </p>
      </div>
    );
  }

  const activeStep: BackpatchStep = steps[Math.min(currentStepIndex, steps.length - 1)];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-rose-400" />
            <span>Boolean Short-Circuit Translation & Backpatching</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dragon Book backpatching algorithm: generating incomplete jumps with placeholder targets and filling destinations once semantic targets are materialized.
          </p>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentStepIndex(0)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            disabled={currentStepIndex <= 0}
            onClick={() => setCurrentStepIndex((i) => Math.max(0, i - 1))}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs font-mono text-slate-400 px-2">
            Step <strong className="text-white">{currentStepIndex + 1}</strong> of{' '}
            <strong className="text-white">{steps.length}</strong>
          </span>
          <button
            disabled={currentStepIndex >= steps.length - 1}
            onClick={() => setCurrentStepIndex((i) => Math.min(steps.length - 1, i + 1))}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs text-white font-semibold shadow-md shadow-rose-600/30 disabled:opacity-40"
          >
            Next Step
          </button>
        </div>
      </div>

      {/* 4 Core Backpatching Actions Concept Map */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl border border-blue-500/30 bg-slate-900/60">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold mb-1">
            <Zap className="w-4 h-4" />
            <span>1. Generate Jumps</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            emit('if a &gt; b goto _')<br />emit('goto _')
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-slate-900/60">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
            <ListPlus className="w-4 h-4" />
            <span>2. makelist(i)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            truelist = [i1]<br />falselist = [i2]
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-500/30 bg-slate-900/60">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
            <GitMerge className="w-4 h-4" />
            <span>3. merge(p1, p2)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            falselist = merge(B1.false, B2.false)
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-rose-500/30 bg-slate-900/60">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1">
            <Crosshair className="w-4 h-4" />
            <span>4. backpatch(p, label)</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            patch [i1, i2] → 'L1'
          </p>
        </div>
      </div>

      {/* Active Step Hero Inspection Card */}
      <div className="p-6 rounded-xl border border-rose-500/30 bg-slate-950 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-rose-600/30 border border-rose-500/40 text-rose-300 font-mono font-bold flex items-center justify-center text-xs">
              #{activeStep.step}
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Operation: {activeStep.action}
              </span>
              <h3 className="text-base font-bold text-white font-mono">{activeStep.title}</h3>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-900 border border-slate-800 text-rose-300">
            {activeStep.expression}
          </span>
        </div>

        {/* Detailed Explanation */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {activeStep.description}
        </p>

        {/* Action Specific Inspector */}
        {activeStep.action === 'CREATE_LIST' && (
          <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 flex items-center justify-between font-mono text-xs">
            <div>
              <span className="text-[10px] text-cyan-400 font-bold uppercase block">New Jump List Created:</span>
              <span className="text-white font-bold">{activeStep.listType}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-cyan-300 font-bold">
              [{activeStep.listValues?.join(', ')}]
            </div>
          </div>
        )}

        {activeStep.action === 'MERGE_LIST' && activeStep.mergedFrom && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 font-mono text-xs space-y-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase block">List Merge Operation:</span>
            <div className="flex items-center gap-3 text-slate-300">
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                List 1: [{activeStep.mergedFrom.list1.join(', ')}]
              </span>
              <span className="text-amber-400 font-bold">∪</span>
              <span className="px-2 py-1 rounded bg-slate-950 border border-slate-800">
                List 2: [{activeStep.mergedFrom.list2.join(', ')}]
              </span>
              <ArrowRight className="w-4 h-4 text-slate-500" />
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                Merged: [{activeStep.listValues?.join(', ')}]
              </span>
            </div>
          </div>
        )}

        {activeStep.action === 'BACKPATCH' && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 font-mono text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-rose-400 font-bold uppercase block">Destination Label Resolved:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 font-bold">
                Target: {activeStep.targetLabel}
              </span>
            </div>
            <div className="text-slate-300 flex items-center gap-2">
              <span>Patched Incomplete Jump Instructions:</span>
              <strong className="text-emerald-400">
                [{activeStep.patchedInstructions?.join(', ')}]
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Step History Log Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Crosshair className="w-4 h-4 text-rose-400" />
            <span>Chronological Backpatching Event Log</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Total {steps.length} backpatch events
          </span>
        </div>

        <div className="overflow-x-auto max-h-[420px]">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="bg-slate-900/60 text-slate-400 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="py-2.5 px-4 w-14">Step</th>
                <th className="py-2.5 px-4 w-36">Action</th>
                <th className="py-2.5 px-4">Event Summary</th>
                <th className="py-2.5 px-4">Expression / Context</th>
                <th className="py-2.5 px-4 text-right">Target / Resolved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {steps.map((st, i) => (
                <tr
                  key={st.step}
                  onClick={() => setCurrentStepIndex(i)}
                  className={`cursor-pointer transition-colors ${
                    currentStepIndex === i
                      ? 'bg-rose-950/40 text-white font-semibold'
                      : 'hover:bg-slate-900/50 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-4 text-slate-500 font-bold">{st.step}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        st.action === 'BACKPATCH'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : st.action === 'MERGE_LIST'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : st.action === 'CREATE_LIST'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {st.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold">{st.title}</td>
                  <td className="py-2.5 px-4 text-slate-400 font-sans text-[11px] truncate max-w-xs">
                    {st.expression}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-bold">
                    {st.targetLabel ? `→ ${st.targetLabel}` : st.listValues ? `[${st.listValues.join(',')}]` : '—'}
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
