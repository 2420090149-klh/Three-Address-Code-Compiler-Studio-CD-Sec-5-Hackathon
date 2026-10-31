// src/components/TACView.tsx
import React, { useState, useMemo } from 'react';
import {
  FileCode2,
  Copy,
  Download,
  Check,
  Tag,
  Hash,
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Activity,
} from 'lucide-react';
import { CompilationResult, TACInstruction } from '../compiler/types';

interface TACViewProps {
  compilationResult: CompilationResult | null;
  onNavigateToAST?: (nodeId: string) => void;
}

export const TACView: React.FC<TACViewProps> = ({
  compilationResult,
  onNavigateToAST,
}) => {
  const [copied, setCopied] = useState(false);
  const [selectedTacId, setSelectedTacId] = useState<number | null>(null);
  const [showQuadruples, setShowQuadruples] = useState(true);
  const [showBasicBlocks, setShowBasicBlocks] = useState(false);

  const instructions = compilationResult?.tacInstructions || [];

  // Identify Leaders for Basic Block Analysis:
  // 1. The first instruction is a leader.
  // 2. Any instruction that is the target of a conditional or unconditional goto is a leader (e.g. labels).
  // 3. Any instruction that immediately follows a goto or conditional goto is a leader.
  const basicBlocks = useMemo(() => {
    if (instructions.length === 0) return [];

    const leaders = new Set<number>();
    leaders.add(1); // 1st instruction

    for (let i = 0; i < instructions.length; i++) {
      const inst = instructions[i];
      // Target of jump (Label or jump target)
      if (inst.op === 'label') {
        leaders.add(inst.id);
      }
      if (inst.op === 'goto' || inst.op === 'if_goto' || inst.op === 'if_false_goto') {
        if (i + 1 < instructions.length) {
          leaders.add(instructions[i + 1].id);
        }
      }
    }

    // Partition instructions into basic blocks
    const blocks: Array<{ blockId: number; name: string; instructions: TACInstruction[] }> = [];
    let currentBlock: TACInstruction[] = [];
    let blockCounter = 1;

    for (const inst of instructions) {
      if (leaders.has(inst.id) && currentBlock.length > 0) {
        blocks.push({
          blockId: blockCounter,
          name: `B${blockCounter}`,
          instructions: currentBlock,
        });
        blockCounter++;
        currentBlock = [];
      }
      currentBlock.push(inst);
    }

    if (currentBlock.length > 0) {
      blocks.push({
        blockId: blockCounter,
        name: `B${blockCounter}`,
        instructions: currentBlock,
      });
    }

    return blocks;
  }, [instructions]);

  if (!compilationResult || instructions.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <FileCode2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <p className="text-sm">No Three-Address Code emitted. Compile a source program to generate intermediate instructions.</p>
      </div>
    );
  }

  const rawTacText = instructions.map((i) => `${i.id}: ${i.raw}`).join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(rawTacText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([rawTacText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `three_address_code_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const selectedInst = instructions.find((i) => i.id === selectedTacId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-400" />
            <span>Three-Address Code (TAC) Intermediate Representation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Linearized intermediate instructions in Quadruple format: <code className="text-emerald-300 font-mono">op(arg1, arg2, result)</code> with synthesized temporaries and resolved labels.
          </p>
        </div>

        {/* View Switches & Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-xs font-medium">
            <button
              onClick={() => {
                setShowQuadruples(true);
                setShowBasicBlocks(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                showQuadruples && !showBasicBlocks
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Quadruples Table
            </button>
            <button
              onClick={() => {
                setShowQuadruples(false);
                setShowBasicBlocks(false);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                !showQuadruples && !showBasicBlocks
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Instructions
            </button>
            <button
              onClick={() => setShowBasicBlocks(true)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                showBasicBlocks
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Basic Blocks ({basicBlocks.length})
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Copy TAC instructions"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy TAC'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
            title="Download TAC as .txt"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .txt</span>
          </button>
        </div>
      </div>

      {/* Main TAC Content Area */}
      {showBasicBlocks ? (
        /* Basic Blocks View */
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 text-purple-200 text-xs leading-relaxed">
            <span className="font-bold text-white block mb-1">Basic Block Partitioning (Dragon Book Algorithm):</span>
            A sequence of consecutive statements in which flow of control enters at the beginning and leaves at the end without halt or possibility of branching except at the end.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {basicBlocks.map((block) => (
              <div
                key={block.blockId}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-400 font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span>Block {block.name}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {block.instructions.length} instrs
                    </span>
                  </div>

                  <div className="space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 font-mono text-xs">
                    {block.instructions.map((inst) => (
                      <div
                        key={inst.id}
                        onClick={() => setSelectedTacId(inst.id)}
                        className={`p-1 rounded cursor-pointer transition-colors flex justify-between ${
                          selectedTacId === inst.id
                            ? 'bg-purple-900/40 text-purple-300 font-bold'
                            : 'hover:bg-slate-900 text-slate-300'
                        }`}
                      >
                        <span className="text-slate-500 mr-2">#{inst.id}</span>
                        <span className="truncate">{inst.raw}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex justify-between">
                  <span>Leader: #{block.instructions[0].id}</span>
                  <span>Exit: #{block.instructions[block.instructions.length - 1].id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : showQuadruples ? (
        /* Quadruple Format Table */
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-xl">
          <div className="overflow-x-auto max-h-[520px]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-3 px-4 font-semibold w-16">
                    <div className="flex items-center gap-1">
                      <Hash className="w-3 h-3 text-slate-500" />
                      <span>Addr</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 font-semibold">Three-Address Instruction</th>
                  <th className="py-3 px-4 font-semibold text-emerald-400">Op</th>
                  <th className="py-3 px-4 font-semibold text-cyan-300">Arg1</th>
                  <th className="py-3 px-4 font-semibold text-cyan-300">Arg2</th>
                  <th className="py-3 px-4 font-semibold text-amber-300">Result</th>
                  <th className="py-3 px-4 font-semibold font-sans text-slate-400">Compiler Semantics</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {instructions.map((inst) => {
                  const isSelected = selectedTacId === inst.id;
                  const isLabel = inst.op === 'label';
                  const isJump = inst.op === 'goto' || inst.op === 'if_goto' || inst.op === 'if_false_goto';

                  return (
                    <tr
                      key={inst.id}
                      onClick={() => setSelectedTacId(inst.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-950/40 text-white font-semibold'
                          : isLabel
                          ? 'bg-slate-900/40 text-purple-300'
                          : 'hover:bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <td className="py-2.5 px-4 text-slate-500 font-bold">#{inst.id}</td>
                      <td className="py-2.5 px-4 font-semibold">
                        <span
                          className={`px-2 py-0.5 rounded ${
                            isLabel
                              ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                              : isJump
                              ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-800/60'
                              : 'bg-slate-900 border border-slate-800 text-emerald-300'
                          }`}
                        >
                          {inst.raw}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-emerald-400 font-bold">{inst.op}</td>
                      <td className="py-2.5 px-4 text-slate-300">{inst.arg1 || '—'}</td>
                      <td className="py-2.5 px-4 text-slate-300">{inst.arg2 || '—'}</td>
                      <td className="py-2.5 px-4 text-amber-300 font-bold">{inst.result || '—'}</td>
                      <td className="py-2.5 px-4 font-sans text-slate-400 text-[11px] leading-relaxed">
                        {inst.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Raw TAC Code View */
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 shadow-2xl font-mono text-sm leading-relaxed text-emerald-300/90 overflow-x-auto max-h-[500px]">
          <pre>{rawTacText}</pre>
        </div>
      )}

      {/* Selected Instruction Detail Card with AST Node Link */}
      {selectedInst && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="space-y-1 text-xs">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Instruction #{selectedInst.id} Origin & Semantics
            </span>
            <p className="font-mono text-white text-sm font-semibold">{selectedInst.raw}</p>
            <p className="text-slate-400">{selectedInst.description}</p>
          </div>

          {selectedInst.sourceNodeId && onNavigateToAST && (
            <button
              onClick={() => onNavigateToAST(selectedInst.sourceNodeId!)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 transition-colors"
            >
              <span>View Source AST Node</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
