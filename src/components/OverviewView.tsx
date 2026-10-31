// src/components/OverviewView.tsx
import React from 'react';
import {
  FileText,
  Binary,
  Network,
  FileCode2,
  Cpu,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Workflow,
  Crosshair,
  Activity,
  Code2,
  Zap,
} from 'lucide-react';
import { CompilationResult } from '../compiler/types';
import { SAMPLE_PROGRAMS } from '../compiler/test_suite';
import { TabId } from './Sidebar';

interface OverviewViewProps {
  compilationResult: CompilationResult | null;
  onSelectTab: (tab: TabId) => void;
  onLoadSample: (code: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  compilationResult,
  onSelectTab,
  onLoadSample,
}) => {
  const stats = compilationResult?.stats || {
    lines: 0,
    tokens: 0,
    astNodes: 0,
    tacInstructions: 0,
    tempVarsCount: 0,
    labelsCount: 0,
  };

  const pipelineStages: Array<{
    id: TabId;
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    status: string;
    color: string;
    badge: string;
  }> = [
    {
      id: 'editor',
      title: '1. Source Code',
      icon: Code2,
      desc: 'Input program with declarations, assignments, arithmetic, and control flow.',
      status: stats.lines ? `${stats.lines} Lines` : 'Ready',
      color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
      badge: 'Input',
    },
    {
      id: 'lexer',
      title: '2. Lexical Analyzer',
      icon: Binary,
      desc: 'Tokenizes stream into keywords, identifiers, constants, and operators.',
      status: stats.tokens ? `${stats.tokens} Tokens` : 'Ready',
      color: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/30',
      badge: 'Scanning',
    },
    {
      id: 'ast',
      title: '3. Parser & AST',
      icon: Network,
      desc: 'Recursive-descent grammar verification and hierarchical tree construction.',
      status: stats.astNodes ? `${stats.astNodes} Nodes` : 'Ready',
      color: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30',
      badge: 'Syntactic',
    },
    {
      id: 'sdt',
      title: '4. SDT Analyzer',
      icon: Workflow,
      desc: 'S-attributed synthesized arithmetic and inherited control flow attributes.',
      status: compilationResult?.sdtSteps.length ? `${compilationResult.sdtSteps.length} Rules` : 'Ready',
      color: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30',
      badge: 'Semantic',
    },
    {
      id: 'tac',
      title: '5. TAC Generator',
      icon: FileCode2,
      desc: 'Linear intermediate representation using temporaries and quadruple format.',
      status: stats.tacInstructions ? `${stats.tacInstructions} Quads` : 'Ready',
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
      badge: 'IR Emitted',
    },
    {
      id: 'backpatch',
      title: '6. Backpatching',
      icon: Crosshair,
      desc: 'Short-circuit evaluation with truelist, falselist, merge, and target resolution.',
      status: compilationResult?.backpatchSteps.length ? `${compilationResult.backpatchSteps.length} Ops` : 'Ready',
      color: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30',
      badge: 'Control Flow',
    },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8 border border-purple-500/20 bg-gradient-to-br from-slate-900 via-purple-950/20 to-slate-900 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Compiler Design Hackathon Workbench</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl font-sans">
              ThreeAddrGen <span className="bg-gradient-to-r from-purple-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">Studio</span>
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              An interactive compiler engineering laboratory demonstrating the full translation pipeline:
              from lexical scanning and recursive-descent parsing to Abstract Syntax Trees, post-order RPN,
              Syntax-Directed Translation, and short-circuit Three-Address Code with backpatching.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onSelectTab('about')}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 transition-all"
            >
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>How It Works</span>
            </button>
            <button
              onClick={() => onSelectTab('editor')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.02]"
            >
              <Code2 className="w-4 h-4" />
              <span>Open Code Editor</span>
            </button>
            <button
              onClick={() => onSelectTab('trace')}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-200 transition-all"
            >
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Step-Through Trace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Compiler Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Source Lines', value: stats.lines, icon: FileText, color: 'text-blue-400' },
          { label: 'Token Count', value: stats.tokens, icon: Binary, color: 'text-cyan-400' },
          { label: 'AST Nodes', value: stats.astNodes, icon: Network, color: 'text-purple-400' },
          { label: 'TAC Quads', value: stats.tacInstructions, icon: FileCode2, color: 'text-emerald-400' },
          { label: 'Temp Variables', value: stats.tempVarsCount, icon: Cpu, color: 'text-amber-400' },
          { label: 'Jump Labels', value: stats.labelsCount, icon: Crosshair, color: 'text-rose-400' },
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400">{card.label}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="text-2xl font-bold font-mono text-white tracking-tight">
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Compiler Pipeline */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Compiler Pipeline Architecture</span>
            </h2>
            <p className="text-xs text-slate-400">
              Click any stage to inspect intermediate representations and translation semantics.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                onClick={() => onSelectTab(stage.id)}
                className={`group cursor-pointer p-5 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:scale-[1.01] hover:shadow-lg ${stage.color}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      <Icon className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                      {stage.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/70 border border-slate-800 text-slate-300">
                    {stage.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">{stage.desc}</p>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/60 group-hover:text-white transition-colors">
                  <span className="text-[11px] font-medium">{stage.badge}</span>
                  <div className="flex items-center gap-1 font-semibold text-[11px]">
                    <span>Inspect</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preset Hackathon Sample Programs */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>Preset Hackathon Demonstrations</span>
          </h2>
          <p className="text-xs text-slate-400">
            Load ready-to-compile sample programs to test individual compiler stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_PROGRAMS.map((sample) => (
            <div
              key={sample.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">{sample.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{sample.description}</p>
                <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-purple-300/90 overflow-x-auto max-h-24">
                  {sample.code.trim()}
                </pre>
              </div>
              <button
                onClick={() => {
                  onLoadSample(sample.code);
                  onSelectTab('editor');
                }}
                className="mt-4 w-full py-2 px-3 rounded-lg text-xs font-medium bg-slate-800 hover:bg-purple-600 text-slate-200 hover:text-white transition-all flex items-center justify-center gap-1.5"
              >
                <span>Load in Editor</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
