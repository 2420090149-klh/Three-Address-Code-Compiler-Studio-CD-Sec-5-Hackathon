// src/components/AboutView.tsx
import React from 'react';
import {
  Sparkles,
  Cpu,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code2,
  Binary,
  Network,
  Workflow,
  Crosshair,
  FileCode2,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  Terminal,
} from 'lucide-react';

interface AboutViewProps {
  onNavigateToTab: (tab: any) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigateToTab }) => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-300">
      {/* Hero Section: Plain English Summary */}
      <div className="relative rounded-2xl overflow-hidden p-8 border border-purple-500/20 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-900 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-4 max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Plain-English Guide & Architecture</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            What is ThreeAddrGen Studio & How Does It Work?
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            Computers cannot understand human code like <code className="text-cyan-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">x = (a + b) * c;</code> directly.
            A compiler must break this code down into tiny, step-by-step instructions that a processor can run.
            <strong> ThreeAddrGen Studio</strong> is an interactive visual workbench that reveals this hidden conversion process,
            turning your source code into an <strong>Abstract Syntax Tree (AST)</strong> and <strong>Three-Address Code (TAC)</strong> with live step-by-step demonstrations.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigateToTab('editor')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5"
            >
              <span>Try Code in Editor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateToTab('trace')}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all border border-slate-700"
            >
              <span>Watch Compilation Trace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Step-by-Step Walkthrough with a Simple Example */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <span>The 6 Steps of Compilation (Explained with a Simple Example)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Let's trace what happens when you feed this simple code snippet into the studio:
          </p>
        </div>

        {/* Example Code Callout */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-purple-300">
          <span className="text-slate-500 text-[11px] block font-sans mb-1 uppercase tracking-wider font-semibold">
            Input Code Example:
          </span>
          <code>
            int x;<br />
            x = (a + b) * 5;<br />
            if (x &gt; 10) &#123; status = 1; &#125; else &#123; status = 0; &#125;
          </code>
        </div>

        {/* 6 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="p-5 rounded-xl border border-cyan-500/30 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-white">Lexical Analysis (Scanner)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Like reading a book letter-by-letter to find words, the scanner groups raw text into recognizable <strong>Tokens</strong>.
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-cyan-300 space-y-1">
                <div>[KEYWORD: int] [ID: x] [SEMICOLON: ;]</div>
                <div>[ID: x] [ASSIGN: =] [LPAREN: (]</div>
                <div>[ID: a] [PLUS: +] [ID: b] [RPAREN: )]</div>
                <div>[MUL: *] [NUMBER: 5] [SEMICOLON: ;]</div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-3 block font-mono">Output: Stream of verified tokens with line/col</span>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-xl border border-purple-500/30 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-purple-950 border border-purple-500/40 text-purple-300 font-mono font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-white">Parser & Syntax Tree (AST)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Checks grammatical rules (e.g. matching parentheses, semicolons) and builds a <strong>family tree of operations</strong>.
                It knows multiplication happens <em>after</em> parentheses because of operator precedence.
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-purple-300">
                <div>Assign (=)</div>
                <div>├── Id (x)</div>
                <div>└── Binary (*)</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;├── Binary (+) [a, b]</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;└── Literal (5)</div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-3 block font-mono">Output: Hierarchical Abstract Syntax Tree</span>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-xl border border-amber-500/30 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-amber-950 border border-amber-500/40 text-amber-300 font-mono font-bold text-xs flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-white">Postfix (Reverse Polish)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                By visiting the tree in <strong>post-order</strong> (Left child → Right child → Operator), parentheses disappear completely because operands always come before their operators!
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-amber-300">
                <span className="text-slate-500 block text-[10px]">RPN Output:</span>
                a b + 5 *
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-3 block font-mono">Output: Parenthesis-free stack expression</span>
          </div>

          {/* Step 4 */}
          <div className="p-5 rounded-xl border border-indigo-500/30 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-mono font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <h3 className="text-sm font-bold text-white">Syntax-Directed Translation</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Attaches compiler rules to each branch:
                <br />• <strong>Synthesized attributes:</strong> Children pass calculated values up to parents (<code className="text-indigo-300 font-mono">E.val = newtemp()</code>).
                <br />• <strong>Inherited attributes:</strong> Parents pass jump targets downward (<code className="text-indigo-300 font-mono">trueTarget = L1</code>).
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-indigo-300">
                <div>E1.val = "t1" (a + b)</div>
                <div>E.val = "t2" (t1 * 5)</div>
                <div>S.target = "x"</div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-3 block font-mono">Output: Computed compiler semantic attributes</span>
          </div>

          {/* Step 5 */}
          <div className="p-5 rounded-xl border border-emerald-500/30 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <h3 className="text-sm font-bold text-white">Three-Address Code (TAC)</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Flattens the nested tree into simple, assembly-like instructions where every line has at most <strong>one operator and three addresses</strong>.
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 space-y-0.5">
                <div>t1 = a + b</div>
                <div>t2 = t1 * 5</div>
                <div>x = t2</div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-3 block font-mono">Output: Linearized quadruples ready for execution</span>
          </div>

          {/* Step 6 */}
          <div className="p-5 rounded-xl border border-rose-500/30 bg-slate-900/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="w-6 h-6 rounded-lg bg-rose-950 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs flex items-center justify-center">
                  6
                </span>
                <h3 className="text-sm font-bold text-white">Boolean Backpatching</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                When compiling an <code className="text-rose-300 font-mono">if-else</code>, the compiler doesn't know where the "else" branch will be located yet. It emits placeholder jumps (<code className="text-rose-300 font-mono">goto _</code>) and "backpatches" them once the target labels exist!
              </p>
              <div className="mt-3 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-rose-300 space-y-0.5">
                <div>if x &gt; 10 goto L1</div>
                <div>goto L2</div>
                <div>L1: status = 1; goto L3</div>
                <div>L2: status = 0</div>
                <div>L3: (convergence)</div>
              </div>
            </div>
            <span className="text-[10px] text-slate-500 mt-3 block font-mono">Output: Correct short-circuit control flow jumps</span>
          </div>
        </div>
      </div>

      {/* Technologies Used Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            <span>Technologies Used</span>
          </h2>
          <p className="text-xs text-slate-400">
            Engineered with modern, high-performance web and compiler technologies:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4" /> React 19 & TypeScript
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Strictly typed compilation data models for tokens, AST nodes, quadruples, and backpatching steps with reactive state.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-1.5">
              <Zap className="w-4 h-4" /> Vite 8 & Tailwind CSS v4
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lightning-fast bundling, ultra-responsive layout, and custom dark IDE theme styling with smooth animations.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <Terminal className="w-4 h-4" /> Custom Compiler Core
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hand-coded tokenizer DFA, recursive-descent grammar parser, and Dragon Book backpatching engine without heavy third-party parsers.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
              <Network className="w-4 h-4" /> Custom SVG Tree Visualizer
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Interactive vector graphics canvas with dynamic node coordinates, smooth Bezier connectors, zoom, pan, and collapsible subtrees.
            </p>
          </div>
        </div>
      </div>

      {/* How We Are Better from Existing Projects */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>How We Are Better Than Existing Projects</span>
          </h2>
          <p className="text-xs text-slate-400">
            Most compiler design demonstrations are either static academic assignments, CLI scripts, or fake regex mockups. Here is why ThreeAddrGen Studio stands apart:
          </p>
        </div>

        {/* Feature Comparison Table */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Feature / Capability</th>
                  <th className="py-3.5 px-4 font-semibold text-rose-400/90">Traditional / Existing Academic Tools</th>
                  <th className="py-3.5 px-4 font-semibold text-emerald-400">ThreeAddrGen Studio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-semibold text-white">Compiler Engine</td>
                  <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Often fake regex or hardcoded outputs for pre-selected examples.</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Real recursive-descent parser & lexer that parses arbitrary user code in real time.</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-semibold text-white">Backpatching Simulation</td>
                  <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Usually skipped or explained only in theoretical text diagrams.</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Living Dragon Book backpatcher showing <code className="font-mono text-[11px]">makelist</code>, <code className="font-mono text-[11px]">merge</code>, and label patching step by step.</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-semibold text-white">AST Visualizer</td>
                  <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Static PNG images or simple ASCII tree dumps in a terminal.</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Interactive SVG canvas with collapsible branches, node category colors, zoom, pan, and inspector panel.</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-semibold text-white">TAC & AST Cross-Linking</td>
                  <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Outputs are completely isolated; you can't tell where an instruction came from.</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Click any TAC instruction to navigate directly to its originating AST node and vice versa.</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-semibold text-white">Execution Debugging</td>
                  <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Batch execution only; no step-through playback.</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Interactive step-by-step trace mode with play/pause, scrubber slider, and simultaneous highlighting.</span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-semibold text-white">Setup & Installation</td>
                  <td className="py-3 px-4 text-slate-400 flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>Requires installing Flex, Bison, GCC, Python, or Java environments.</span>
                  </td>
                  <td className="py-3 px-4 text-emerald-300 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Runs 100% in the web browser with zero server latency and zero local installations needed.</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
