// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Compiler } from './compiler/compiler';
import { CompilationResult } from './compiler/types';
import { SAMPLE_PROGRAMS } from './compiler/test_suite';
import { Header } from './components/Header';
import { Sidebar, TabId } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { CodeEditorView } from './components/CodeEditorView';
import { LexerTokensView } from './components/LexerTokensView';
import { ASTVisualizerView } from './components/ASTVisualizerView';
import { PostfixView } from './components/PostfixView';
import { TACView } from './components/TACView';
import { SDTView } from './components/SDTView';
import { BackpatchView } from './components/BackpatchView';
import { ExecutionTraceView } from './components/ExecutionTraceView';
import { AboutView } from './components/AboutView';
import { ReportModal } from './components/ReportModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [code, setCode] = useState<string>(SAMPLE_PROGRAMS[0].code);
  const [compilationResult, setCompilationResult] = useState<CompilationResult | null>(null);
  const [isCompiling, setIsCompiling] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [selectedAstNodeId, setSelectedAstNodeId] = useState<string | undefined>(undefined);

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCompile = useCallback(
    (sourceToCompile?: string) => {
      const src = sourceToCompile !== undefined ? sourceToCompile : code;
      setIsCompiling(true);

      // Perform genuine compilation in browser
      setTimeout(() => {
        try {
          const result = Compiler.compile(src);
          setCompilationResult(result);

          if (result.success) {
            addToast(
              'success',
              'Compilation Successful',
              `Emitted ${result.stats.tacInstructions} TAC instructions from ${result.stats.astNodes} AST nodes.`
            );
          } else {
            const firstError = result.errors[0];
            addToast(
              'error',
              'Syntax Error Detected',
              firstError ? `Line ${firstError.line}:${firstError.column} — ${firstError.message}` : 'Parser encountered syntax violation'
            );
          }
        } catch (err: any) {
          addToast('error', 'Compiler Crash', err?.message || 'Unknown compiler error');
        } finally {
          setIsCompiling(false);
        }
      }, 50);
    },
    [code]
  );

  // Initial compile on startup
  useEffect(() => {
    handleCompile(SAMPLE_PROGRAMS[0].code);
  }, []);

  // Global keyboard shortcut: Ctrl+Enter or Cmd+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCompile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCompile]);

  const handleLoadSample = (sampleCode: string) => {
    setCode(sampleCode);
    handleCompile(sampleCode);
    addToast('info', 'Loaded Sample Program', 'Compiled sample into AST and Three-Address Code.');
  };

  const handleNavigateToAST = (nodeId: string) => {
    setSelectedAstNodeId(nodeId);
    setActiveTab('ast');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col font-sans selection:bg-purple-600/40 selection:text-white">
      {/* Top Application Header */}
      <Header
        compilationResult={compilationResult}
        onRunCompile={() => handleCompile()}
        onOpenReport={() => setIsReportOpen(true)}
        onNavigateToAbout={() => setActiveTab('about')}
        isCompiling={isCompiling}
      />

      {/* Main Workbench Body: Sidebar + Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          compilationResult={compilationResult}
        />

        {/* Center Workspace Panel */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950/60 to-[#07090e]">
          {activeTab === 'overview' && (
            <OverviewView
              compilationResult={compilationResult}
              onSelectTab={setActiveTab}
              onLoadSample={handleLoadSample}
            />
          )}

          {activeTab === 'editor' && (
            <CodeEditorView
              code={code}
              onChangeCode={setCode}
              onRunCompile={() => handleCompile()}
              compilationResult={compilationResult}
              isCompiling={isCompiling}
              onSelectSample={handleLoadSample}
            />
          )}

          {activeTab === 'lexer' && (
            <LexerTokensView compilationResult={compilationResult} />
          )}

          {activeTab === 'ast' && (
            <ASTVisualizerView
              compilationResult={compilationResult}
              selectedNodeId={selectedAstNodeId}
              onSelectNode={setSelectedAstNodeId}
            />
          )}

          {activeTab === 'postfix' && (
            <PostfixView compilationResult={compilationResult} />
          )}

          {activeTab === 'tac' && (
            <TACView
              compilationResult={compilationResult}
              onNavigateToAST={handleNavigateToAST}
            />
          )}

          {activeTab === 'sdt' && (
            <SDTView compilationResult={compilationResult} />
          )}

          {activeTab === 'backpatch' && (
            <BackpatchView compilationResult={compilationResult} />
          )}

          {activeTab === 'trace' && (
            <ExecutionTraceView
              compilationResult={compilationResult}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'about' && (
            <AboutView onNavigateToTab={setActiveTab} />
          )}
        </main>
      </div>

      {/* Audit Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        compilationResult={compilationResult}
        sourceCode={code}
      />

      {/* Notification Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
