// src/components/CodeEditorView.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Code2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { CompilationResult } from '../compiler/types';
import { SAMPLE_PROGRAMS } from '../compiler/test_suite';

interface CodeEditorViewProps {
  code: string;
  onChangeCode: (code: string) => void;
  onRunCompile: () => void;
  compilationResult: CompilationResult | null;
  isCompiling: boolean;
  onSelectSample: (code: string) => void;
}

export const CodeEditorView: React.FC<CodeEditorViewProps> = ({
  code,
  onChangeCode,
  onRunCompile,
  compilationResult,
  isCompiling,
  onSelectSample,
}) => {
  const [copied, setCopied] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = code.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter or Cmd+Enter to compile
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onRunCompile();
      return;
    }

    // Support Tab key indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      onChangeCode(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const text = textareaRef.current.value;
    const selStart = textareaRef.current.selectionStart;
    const linesBefore = text.substring(0, selStart).split('\n');
    setCursorPos({
      line: linesBefore.length,
      col: linesBefore[linesBefore.length - 1].length + 1,
    });
  };

  const errors = compilationResult?.errors || [];
  const hasErrors = errors.length > 0;

  return (
    <div className="h-full flex flex-col p-6 space-y-4 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-slate-200">Source Program</span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Preset Selector */}
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            <select
              onChange={(e) => {
                const sample = SAMPLE_PROGRAMS.find((s) => s.id === e.target.value);
                if (sample) onSelectSample(sample.code);
              }}
              defaultValue=""
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 font-sans cursor-pointer hover:border-slate-700 transition-colors"
            >
              <option value="" disabled>
                Select Sample Program...
              </option>
              {SAMPLE_PROGRAMS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            title="Copy source code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={() => onSelectSample(SAMPLE_PROGRAMS[0].code)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
            title="Reset to sample"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={() => onChangeCode('')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 transition-colors border border-slate-700/60"
            title="Clear editor"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={onRunCompile}
            disabled={isCompiling}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isCompiling ? 'animate-spin' : ''}`} />
            <span>Compile & Generate TAC</span>
          </button>
        </div>
      </div>

      {/* Editor Main Canvas */}
      <div className="flex-1 min-h-[460px] rounded-xl border border-slate-800 bg-slate-950 flex flex-col overflow-hidden shadow-2xl relative">
        <div className="flex-1 flex overflow-hidden">
          {/* Gutter / Line Numbers */}
          <div className="w-14 bg-slate-900/60 border-r border-slate-800/80 py-4 select-none flex flex-col text-right pr-3 font-mono text-xs text-slate-600">
            {lines.map((_, i) => {
              const lineNum = i + 1;
              const hasLineError = errors.some((err) => err.line === lineNum);
              return (
                <div
                  key={i}
                  className={`leading-6 h-6 flex items-center justify-end gap-1 ${
                    hasLineError ? 'text-rose-400 font-bold bg-rose-500/10' : ''
                  }`}
                >
                  {hasLineError && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                  <span>{lineNum}</span>
                </div>
              );
            })}
          </div>

          {/* Text Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => {
                onChangeCode(e.target.value);
                updateCursorPosition();
              }}
              onKeyUp={updateCursorPosition}
              onClick={updateCursorPosition}
              onKeyDown={handleKeyDown}
              spellCheck={false}
              className="w-full h-full p-4 bg-transparent text-slate-100 font-mono text-xs leading-6 resize-none focus:outline-none focus:ring-0 selection:bg-purple-600/40 tab-4"
              placeholder="// Write or paste your C-subset source program here..."
            />
          </div>
        </div>

        {/* Editor Status Bar */}
        <div className="h-8 bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>C-Subset Compiler</span>
            </span>
            <span>UTF-8</span>
            <span>Tab Size: 4</span>
          </div>

          <div className="flex items-center gap-4">
            <span>
              Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
            <span>{code.length} chars</span>
            <span>{lines.length} lines</span>
          </div>
        </div>
      </div>

      {/* Compiler Diagnostic Panel */}
      {hasErrors && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-200 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 mb-2 font-semibold text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <span>Compilation Errors ({errors.length})</span>
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            {errors.map((err, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-rose-500/20">
                <span className="text-rose-400 font-bold shrink-0">
                  [{err.stage.toUpperCase()}] Line {err.line}:{err.column}
                </span>
                <span className="text-slate-300">{err.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar Quick Reference */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/40 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Supported Grammar Features
          </span>
          <span className="text-[10px] text-slate-500">Recursive-Descent Parser Engine</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono text-slate-400">
          <div>• Declarations: <span className="text-purple-300">int x, y = 5;</span></div>
          <div>• Arithmetic: <span className="text-cyan-300">+ - * / %</span></div>
          <div>• Relational: <span className="text-emerald-300">&gt; &lt; &gt;= &lt;= == !=</span></div>
          <div>• Control Flow: <span className="text-amber-300">if-else, while</span></div>
          <div>• Boolean: <span className="text-blue-300">&&, ||, !</span></div>
          <div>• Assignment: <span className="text-rose-300">x = (a + b) * c;</span></div>
          <div>• Compound: <span className="text-indigo-300">&#123; stmt; stmt; &#125;</span></div>
          <div>• Precedence: <span className="text-emerald-400">Parentheses ()</span></div>
        </div>
      </div>
    </div>
  );
};
