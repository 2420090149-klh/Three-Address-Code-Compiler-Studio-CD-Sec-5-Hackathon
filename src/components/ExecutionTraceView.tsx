// src/components/ExecutionTraceView.tsx
import React, { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sliders,
  CheckCircle2,
  FileCode2,
  Binary,
  Network,
  Workflow,
  Crosshair,
} from 'lucide-react';
import { CompilationResult, ExecutionTraceStep } from '../compiler/types';

interface ExecutionTraceViewProps {
  compilationResult: CompilationResult | null;
  onNavigateToTab?: (tab: any) => void;
}

export const ExecutionTraceView: React.FC<ExecutionTraceViewProps> = ({
  compilationResult,
  onNavigateToTab,
}) => {
  const trace = compilationResult?.executionTrace || [];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1200); // ms per step

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= trace.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(timer);
  }, [isPlaying, trace.length, playbackSpeed]);

  if (!compilationResult || trace.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">No execution trace recorded. Compile a program to step through the compilation pipeline.</p>
      </div>
    );
  }

  const currentStep: ExecutionTraceStep = trace[Math.min(currentStepIndex, trace.length - 1)];

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'lexer':
        return { label: 'Lexical Scanner', icon: Binary, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30' };
      case 'ast':
        return { label: 'Parser & AST', icon: Network, color: 'text-purple-400 bg-purple-950/40 border-purple-500/30' };
      case 'sdt':
        return { label: 'Syntax-Directed Translation', icon: Workflow, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/30' };
      case 'backpatch':
        return { label: 'Boolean Backpatching', icon: Crosshair, color: 'text-rose-400 bg-rose-950/40 border-rose-500/30' };
      case 'tac':
        return { label: 'Three-Address Code', icon: FileCode2, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30' };
      default:
        return { label: 'Pipeline', icon: Activity, color: 'text-slate-400 bg-slate-900 border-slate-700' };
    }
  };

  const badgeInfo = getStageBadge(currentStep.stage);
  const BadgeIcon = badgeInfo.icon;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>Step-by-Step Compilation Execution Trace</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Walk step-by-step through tokenizer DFA, AST building, SDT attribute evaluation, backpatching, and instruction emission.
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex(0);
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            disabled={currentStepIndex <= 0}
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex((i) => Math.max(0, i - 1));
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
            title="Previous Step"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Play Trace'}</span>
          </button>

          <button
            disabled={currentStepIndex >= trace.length - 1}
            onClick={() => {
              setIsPlaying(false);
              setCurrentStepIndex((i) => Math.min(trace.length - 1, i + 1));
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
            title="Next Step"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseInt(e.target.value, 10))}
            className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-2 focus:outline-none cursor-pointer"
          >
            <option value={2000}>0.5x</option>
            <option value={1200}>1.0x</option>
            <option value={600}>2.0x</option>
          </select>
        </div>
      </div>

      {/* Scrubber Progress Slider */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>
            Trace Step <strong className="text-white">{currentStepIndex + 1}</strong> of{' '}
            <strong className="text-white">{trace.length}</strong>
          </span>
          <span className="text-[11px] text-slate-500">
            {Math.round(((currentStepIndex + 1) / trace.length) * 100)}% Completed
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={trace.length - 1}
          value={currentStepIndex}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentStepIndex(parseInt(e.target.value, 10));
          }}
          className="w-full accent-blue-500 cursor-pointer"
        />
      </div>

      {/* Current Step Detailed Card */}
      <div className="p-6 rounded-xl border border-blue-500/30 bg-slate-950 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono font-bold flex items-center justify-center text-xs">
              #{currentStep.stepIndex}
            </span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${badgeInfo.color}`}
                >
                  <BadgeIcon className="w-3 h-3" />
                  <span>{badgeInfo.label}</span>
                </span>
                {currentStep.statusText && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400">
                    {currentStep.statusText}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white font-mono">{currentStep.title}</h3>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">
          {currentStep.description}
        </p>

        {/* Dynamic Context Links */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
          {currentStep.activeTokenId && (
            <span className="px-2.5 py-1 rounded bg-cyan-950/50 border border-cyan-500/30 text-cyan-300">
              Active Token: #{currentStep.activeTokenId}
            </span>
          )}
          {currentStep.activeNodeId && (
            <span className="px-2.5 py-1 rounded bg-purple-950/50 border border-purple-500/30 text-purple-300">
              Active AST Node: {currentStep.activeNodeId}
            </span>
          )}
          {currentStep.activeTacId && (
            <span className="px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">
              Active TAC Quad: #{currentStep.activeTacId}
            </span>
          )}
        </div>
      </div>

      {/* History Log List */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
        <div className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span>Trace History Log</span>
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Click any step to inspect
          </span>
        </div>

        <div className="overflow-y-auto max-h-[380px] divide-y divide-slate-800/60">
          {trace.map((st, i) => {
            const isCurrent = currentStepIndex === i;
            const b = getStageBadge(st.stage);
            const Icon = b.icon;

            return (
              <div
                key={st.stepIndex}
                onClick={() => {
                  setIsPlaying(false);
                  setCurrentStepIndex(i);
                }}
                className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                  isCurrent ? 'bg-blue-950/40 border-l-2 border-blue-500' : 'hover:bg-slate-900/40 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs text-slate-500 font-bold shrink-0">
                    #{st.stepIndex}
                  </span>
                  <div className="p-1 rounded bg-slate-900 border border-slate-800 shrink-0">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-semibold text-white truncate font-mono">
                      {st.title}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate font-sans">
                      {st.description}
                    </div>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${b.color}`}
                >
                  {st.stage.toUpperCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
