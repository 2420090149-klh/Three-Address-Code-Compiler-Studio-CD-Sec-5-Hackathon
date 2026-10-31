// src/components/ReportModal.tsx
import React, { useState } from 'react';
import { X, Download, Copy, Check, FileText } from 'lucide-react';
import { CompilationResult } from '../compiler/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  compilationResult: CompilationResult | null;
  sourceCode: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  compilationResult,
  sourceCode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !compilationResult) return null;

  // Generate complete plain-text audit report
  const generateReportText = (): string => {
    const timestamp = new Date().toISOString();
    const stats = compilationResult.stats;

    let text = `================================================================================\n`;
    text += `         THREEADDRGEN STUDIO — COMPILER DESIGN AUDIT REPORT                     \n`;
    text += `         Tagline: From Source Code to Intermediate Representation               \n`;
    text += `================================================================================\n`;
    text += `Generated At: ${timestamp}\n`;
    text += `Compilation Status: ${compilationResult.success ? 'SUCCESS (0 Errors)' : 'FAILED'}\n\n`;

    text += `--------------------------------------------------------------------------------\n`;
    text += `1. PIPELINE METRICS & COMPILATION STATISTICS\n`;
    text += `--------------------------------------------------------------------------------\n`;
    text += `Total Source Lines:        ${stats.lines}\n`;
    text += `Total Lexical Tokens:      ${stats.tokens}\n`;
    text += `Total AST Nodes:           ${stats.astNodes}\n`;
    text += `Emitted TAC Instructions:  ${stats.tacInstructions}\n`;
    text += `Allocated Temporaries:     ${stats.tempVarsCount}\n`;
    text += `Generated Jump Labels:     ${stats.labelsCount}\n`;
    text += `Variable Declarations:     ${stats.declarationsCount}\n\n`;

    text += `--------------------------------------------------------------------------------\n`;
    text += `2. SOURCE PROGRAM\n`;
    text += `--------------------------------------------------------------------------------\n`;
    text += `${sourceCode}\n\n`;

    text += `--------------------------------------------------------------------------------\n`;
    text += `3. LEXICAL TOKEN STREAM (${compilationResult.tokens.length} Tokens)\n`;
    text += `--------------------------------------------------------------------------------\n`;
    text += `ID\tLEXEME\t\tTYPE\t\t\tLINE:COL\n`;
    for (const tok of compilationResult.tokens) {
      text += `${tok.id}\t${tok.lexeme.padEnd(16)}\t${tok.type.padEnd(20)}\t${tok.line}:${tok.column}\n`;
    }
    text += `\n`;

    text += `--------------------------------------------------------------------------------\n`;
    text += `4. POSTFIX NOTATION & RPN EXPRESSIONS\n`;
    text += `--------------------------------------------------------------------------------\n`;
    for (const p of compilationResult.postfixResults) {
      text += `Expression: ${p.sourceExpression}\n`;
      text += `Postfix:    ${p.postfixString}\n`;
      text += `Tokens:     [${p.tokens.join(', ')}]\n\n`;
    }

    text += `--------------------------------------------------------------------------------\n`;
    text += `5. THREE-ADDRESS CODE (TAC) INTERMEDIATE REPRESENTATION\n`;
    text += `--------------------------------------------------------------------------------\n`;
    text += `ADDR\tOP\tARG1\tARG2\tRESULT\tRAW INSTRUCTION\n`;
    for (const inst of compilationResult.tacInstructions) {
      const op = (inst.op || '-').padEnd(8);
      const a1 = (inst.arg1 || '-').padEnd(8);
      const a2 = (inst.arg2 || '-').padEnd(8);
      const res = (inst.result || '-').padEnd(8);
      text += `${inst.id}\t${op}\t${a1}\t${a2}\t${res}\t${inst.raw}\n`;
    }
    text += `\n`;

    text += `--------------------------------------------------------------------------------\n`;
    text += `6. SYNTAX-DIRECTED TRANSLATION (SDT) DERIVATION TRACE\n`;
    text += `--------------------------------------------------------------------------------\n`;
    for (const sdt of compilationResult.sdtSteps) {
      text += `Step #${sdt.order}: ${sdt.productionRule}\n`;
      text += `  Node:        ${sdt.nodeType} (${sdt.nodeLabel})\n`;
      text += `  Action:      ${sdt.semanticAction}\n`;
      text += `  Synthesized: ${JSON.stringify(sdt.synthesized)}\n`;
      text += `  Inherited:   ${JSON.stringify(sdt.inherited)}\n`;
      text += `  Explanation: ${sdt.explanation}\n\n`;
    }

    text += `--------------------------------------------------------------------------------\n`;
    text += `7. BOOLEAN SHORT-CIRCUIT & BACKPATCHING EVENT LOG\n`;
    text += `--------------------------------------------------------------------------------\n`;
    for (const bp of compilationResult.backpatchSteps) {
      text += `Event #${bp.step} [${bp.action}]: ${bp.title}\n`;
      text += `  Context:     ${bp.expression}\n`;
      text += `  Description: ${bp.description}\n`;
      if (bp.targetLabel) text += `  Resolved Target: ${bp.targetLabel}\n`;
      if (bp.patchedInstructions) text += `  Patched Jumps:   [${bp.patchedInstructions.join(', ')}]\n`;
      text += `\n`;
    }

    text += `================================================================================\n`;
    text += `                  END OF COMPILATION AUDIT REPORT                               \n`;
    text += `================================================================================\n`;

    return text;
  };

  const reportText = generateReportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `threeaddrgen_audit_report_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-950 border border-purple-500/30 text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Compilation Audit Report</h3>
              <p className="text-xs text-slate-400">Complete verification trace across all compiler stages</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Report'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .txt</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Report Text */}
        <div className="flex-1 p-6 overflow-y-auto font-mono text-xs leading-relaxed text-slate-300 bg-slate-950 select-text">
          <pre className="whitespace-pre-wrap">{reportText}</pre>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-500">
          <span>ThreeAddrGen Studio • Compiler Design Hackathon</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
