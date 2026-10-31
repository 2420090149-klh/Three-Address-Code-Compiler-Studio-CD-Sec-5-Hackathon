# ThreeAddrGen Studio
### Three-Address-Code-Compiler-Studio-CD-Sec-5-Hackathon
> **Tagline:** From Source Code to Intermediate Representation.  
> Built for the Compiler Design Hackathon.

An interactive, browser-based compiler engineering workbench and visualizer demonstrating **lexical analysis**, **recursive-descent parsing**, **Abstract Syntax Trees (AST)**, **postfix notation (RPN)**, **Syntax-Directed Translation (SDT)**, **Three-Address Code (TAC)** generation in Quadruple format, and **short-circuit Boolean evaluation with backpatching**.

---

## 🌟 Key Features

1. **Deterministic Lexical Scanner (`src/compiler/lexer.ts`)**
   - Scans identifiers, integer/float literals, keywords (`int`, `float`, `if`, `else`, `while`, `print`), arithmetic operators (`+`, `-`, `*`, `/`, `%`), relational operators (`==`, `!=`, `<`, `<=`, `>`, `>=`), logical operators (`&&`, `||`, `!`), and delimiters.
   - Comprehensive token stream table with token IDs, lexemes, types, categories, and exact line/column coordinates.
   - Clear diagnostic error handling for unrecognized tokens and malformed constructs.

2. **Recursive-Descent Parser & AST Construction (`src/compiler/parser.ts`, `ast.ts`)**
   - Full grammar support for variable declarations (`int a, b = 5;`), assignments, arithmetic expressions, relational comparisons, Boolean short-circuit expressions, `if`, `if-else`, `while` loops, and compound blocks `{ ... }`.
   - Strict operator precedence and associativity hierarchy (Primary > Unary > Multiplicative > Additive > Relational > Equality > Logical AND > Logical OR > Assignment).
   - Real, genuine AST nodes with parent-child links (no regex shortcuts).

3. **Interactive SVG AST Visualizer (`src/components/ASTVisualizerView.tsx`)**
   - Hierarchical tree layout with smooth Bezier links.
   - Color-coded node categories: Statements (Purple), Operators (Cyan), Identifiers (Emerald), Literals (Amber), Program (Indigo).
   - Collapsible & expandable subtree branches.
   - Zoom in/out, pan, and reset view controls.
   - Live Node Inspector: click any node to view its grammar production, synthesized attributes, inherited attributes, and associated TAC instructions.

4. **Postfix Notation & RPN Conversion (`src/compiler/postfix.ts`, `src/components/PostfixView.tsx`)**
   - Post-order AST traversal (`Left Subtree → Right Subtree → Root Operator`).
   - Step-by-step operand stack & emission trace table.
   - Detailed pedagogical explanations of operator precedence and parenthesis elimination.

5. **Three-Address Code Generation (`src/compiler/tac.ts`, `src/components/TACView.tsx`)**
   - Linear intermediate representation using synthesized temporaries (`t1`, `t2`, ...) and unique jump labels (`L1`, `L2`, ...).
   - Dual view: Quadruple Table (`op`, `arg1`, `arg2`, `result`) and formatted 3-address assembly.
   - Basic Block and Leader analysis: automatic partitioning based on jump targets and branch boundaries.
   - Click any TAC instruction to navigate directly to its source AST node.
   - One-click copy and `.txt` file export.

6. **Syntax-Directed Translation (`src/compiler/sdt.ts`, `src/components/SDTView.tsx`)**
   - S-attributed bottom-up synthesis for arithmetic values and temporaries (`E.val = newtemp()`).
   - L-attributed top-down inherited attributes for control-flow targets (`trueTarget`, `falseTarget`, `next`).
   - Complete step-by-step derivation history table derived directly from the parsed program.

7. **Boolean Expressions & Backpatching (`src/compiler/backpatch.ts`, `src/components/BackpatchView.tsx`)**
   - Textbook implementation of the Dragon Book backpatching algorithm.
   - Short-circuit jumps generated with incomplete placeholders (`if a > b goto _`, `goto _`).
   - `makelist(i)`, `merge(p1, p2)`, and `backpatch(p, label)` operations.
   - Interactive step-by-step visualizer showing list mergers and target resolution.

8. **Step-Through Execution Trace (`src/components/ExecutionTraceView.tsx`)**
   - Pedagogical compilation playback mode: Previous, Next, Play/Pause, Speed Control, Scrubber slider.
   - Synchronous highlighting across tokens, AST nodes, and emitted TAC instructions.

9. **Export & Audit Reports (`src/components/ReportModal.tsx`)**
   - Download complete plain-text `.txt` compiler reports detailing all metrics, source code, tokens, AST, postfix, TAC quadruples, SDT rules, and backpatch events.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React icons
- **Architecture:** Zero backend dependencies — runs 100% in the browser client
- **Compiler Pipeline Modules:**
  - `src/compiler/lexer.ts`
  - `src/compiler/parser.ts`
  - `src/compiler/ast.ts`
  - `src/compiler/postfix.ts`
  - `src/compiler/tac.ts`
  - `src/compiler/sdt.ts`
  - `src/compiler/backpatch.ts`
  - `src/compiler/types.ts`
  - `src/compiler/compiler.ts`
  - `src/compiler/test_suite.ts`

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

### 3. Build for Production
```bash
npm run build
npm run preview
```

### 4. Run Automated Test Suite
```bash
npx tsx -e "import { runValidationSuite } from './src/compiler/test_suite.ts'; const r = runValidationSuite(); r.forEach(x => console.log((x.passed ? '✓' : '✗') + ' ' + x.name));"
```
*All 12 validation cases (Arithmetic, Precedence, Nested Parens, If-Else, While, Relational, AND/OR Short-circuit, Error handling) pass with 100% success.*

---

## ⌨️ Shortcuts
- `Ctrl + Enter` (or `Cmd + Enter`): Compile code and generate intermediate representation.
