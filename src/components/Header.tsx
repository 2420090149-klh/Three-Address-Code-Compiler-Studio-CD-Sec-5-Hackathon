// src/components/Header.tsx
import React from 'react';
import { Play, Download, CheckCircle2, AlertTriangle, Cpu, Layers, HelpCircle } from 'lucide-react';
import { CompilationResult } from '../compiler/types';

interface HeaderProps {
  compilationResult: CompilationResult | null;
  onRunCompile: () => void;
  onOpenReport: () => void;
  onNavigateToAbout?: () => void;
  isCompiling: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  compilationResult,
  onRunCompile,
  onOpenReport,
  onNavigateToAbout,
  isCompiling,
}) => {
  const isSuccess = compilationResult?.success;
  const hasErrors = compilationResult && !compilationResult.success;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 select-none">
      {/* Brand & Tagline */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                <span>ThreeAddrGen</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  STUDIO
                </span>
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 font-normal">From Source Code to Intermediate Representation</p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-7 w-px bg-slate-800 mx-2 hidden md:block" />

        {/* Status Badge */}
        <div className="hidden lg:flex items-center gap-2">
          {isSuccess && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pipeline Verified</span>
              <span className="text-slate-500 text-[10px]">•</span>
              <span className="text-emerald-300 font-mono text-[11px]">
                {compilationResult.stats.tacInstructions} TAC emitted
              </span>
            </div>
          )}
          {hasErrors && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/50 border border-rose-500/30 text-rose-400 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>Compilation Error</span>
              <span className="text-rose-300 font-mono text-[11px]">
                ({compilationResult.errors.length} issue{compilationResult.errors.length > 1 ? 's' : ''})
              </span>
            </div>
          )}
          {!compilationResult && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/50 text-slate-400 text-xs">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Compiler Standby</span>
            </div>
          )}
        </div>
      </div>

      {/* Metrics & Actions */}
      <div className="flex items-center gap-3">
        {compilationResult && isSuccess && (
          <div className="hidden xl:flex items-center gap-4 text-xs font-mono text-slate-400 bg-slate-900/60 border border-slate-800/80 px-3.5 py-1.5 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">TOKENS:</span>
              <span className="text-cyan-400 font-semibold">{compilationResult.stats.tokens}</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">AST NODES:</span>
              <span className="text-purple-400 font-semibold">{compilationResult.stats.astNodes}</span>
            </div>
            <div className="w-px h-3 bg-slate-800" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">TAC QUADS:</span>
              <span className="text-emerald-400 font-semibold">{compilationResult.stats.tacInstructions}</span>
            </div>
          </div>
        )}

        {/* About & Guide CTA */}
        {onNavigateToAbout && (
          <button
            onClick={onNavigateToAbout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-500/30 bg-purple-950/40 text-purple-200 hover:text-white hover:bg-purple-900/50 transition-colors shadow-sm"
            title="Read how the compiler workbench works & why it's better"
          >
            <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">How It Works</span>
          </button>
        )}

        {/* Export Report Button */}
        <button
          onClick={onOpenReport}
          disabled={!compilationResult}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          title="Download full compilation audit report"
        >
          <Download className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Export Report</span>
        </button>

        {/* Run Compiler Main CTA */}
        <button
          onClick={onRunCompile}
          disabled={isCompiling}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:via-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all active:scale-95 disabled:opacity-50"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
          <span>Run Compiler</span>
          <span className="text-[10px] bg-black/25 px-1.5 py-0.5 rounded font-mono text-purple-200 hidden md:inline">
            Ctrl+↵
          </span>
        </button>
      </div>
    </header>
  );
};
