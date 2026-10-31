// src/components/Sidebar.tsx
import React from 'react';
import {
  LayoutDashboard,
  Code2,
  Binary,
  Network,
  ArrowRightLeft,
  FileCode2,
  Workflow,
  Crosshair,
  Activity,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { CompilationResult } from '../compiler/types';

export type TabId =
  | 'overview'
  | 'editor'
  | 'lexer'
  | 'ast'
  | 'postfix'
  | 'tac'
  | 'sdt'
  | 'backpatch'
  | 'trace'
  | 'about';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  compilationResult: CompilationResult | null;
}

interface NavItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: (res: CompilationResult | null) => string | number | null;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  compilationResult,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      description: 'Workbench & Pipeline',
    },
    {
      id: 'editor',
      label: 'Code Editor',
      icon: Code2,
      description: 'Source input & presets',
      badge: (res) => (res ? `${res.stats.lines}L` : null),
      badgeColor: 'bg-slate-800 text-slate-300',
    },
    {
      id: 'lexer',
      label: 'Lexical Analysis',
      icon: Binary,
      description: 'Token stream & scanner',
      badge: (res) => (res && res.tokens.length > 0 ? res.tokens.length : null),
      badgeColor: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25',
    },
    {
      id: 'ast',
      label: 'Abstract Syntax Tree',
      icon: Network,
      description: 'Interactive SVG tree',
      badge: (res) => (res && res.astNodeCount > 0 ? res.astNodeCount : null),
      badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/25',
    },
    {
      id: 'postfix',
      label: 'Postfix Notation',
      icon: ArrowRightLeft,
      description: 'Post-order RPN exprs',
      badge: (res) => (res && res.postfixResults.length > 0 ? res.postfixResults.length : null),
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    },
    {
      id: 'tac',
      label: 'Three-Address Code',
      icon: FileCode2,
      description: 'Quadruples & temporaries',
      badge: (res) => (res && res.tacInstructions.length > 0 ? res.tacInstructions.length : null),
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    },
    {
      id: 'sdt',
      label: 'Syntax-Directed Trans.',
      icon: Workflow,
      description: 'S & Inherited attributes',
      badge: (res) => (res && res.sdtSteps.length > 0 ? res.sdtSteps.length : null),
      badgeColor: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25',
    },
    {
      id: 'backpatch',
      label: 'Backpatching',
      icon: Crosshair,
      description: 'Short-circuit jump lists',
      badge: (res) => (res && res.backpatchSteps.length > 0 ? res.backpatchSteps.length : null),
      badgeColor: 'bg-rose-500/15 text-rose-300 border border-rose-500/25',
    },
    {
      id: 'trace',
      label: 'Execution Trace',
      icon: Activity,
      description: 'Step-through debugger',
      badge: (res) => (res && res.executionTrace.length > 0 ? res.executionTrace.length : null),
      badgeColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/25',
    },
    {
      id: 'about',
      label: 'About & Guide',
      icon: HelpCircle,
      description: 'How it works & Advantages',
      badge: () => 'DOCS',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
  ];

  const hasError = compilationResult && !compilationResult.success;

  return (
    <aside className="w-64 shrink-0 bg-slate-950/70 border-r border-slate-800/80 flex flex-col justify-between select-none">
      <div className="py-4">
        <div className="px-5 mb-3 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Compiler Stages
          </span>
          {hasError && (
            <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono">
              <ShieldAlert className="w-3 h-3" /> Errors Detected
            </span>
          )}
        </div>

        <nav className="space-y-1 px-3">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const badgeVal = item.badge ? item.badge(compilationResult) : null;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full group flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-900/40 via-indigo-900/25 to-transparent text-white font-medium border-l-2 border-purple-500 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-purple-600/20 text-purple-400'
                        : 'bg-slate-900 text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{item.label}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">{item.description}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2 shrink-0">
                  {badgeVal !== null && (
                    <span
                      className={`text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {badgeVal}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 m-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span className="font-semibold text-slate-300">Hackathon Edition</span>
          <span className="font-mono text-purple-400">v1.0</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-normal">
          Recursive-descent AST • Postfix RPN • TAC Quadruples • Backpatching
        </p>
      </div>
    </aside>
  );
};
