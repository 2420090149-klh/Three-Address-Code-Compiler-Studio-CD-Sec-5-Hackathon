// src/compiler/test_suite.ts
import { Compiler } from './compiler';

export interface TestCaseResult {
  name: string;
  code: string;
  passed: boolean;
  notes: string;
  tacSnippet?: string[];
  postfixSnippet?: string[];
}

export const SAMPLE_PROGRAMS = [
  {
    id: 'sample1',
    name: '1. Basic & Nested Arithmetic',
    description: 'Demonstrates operator precedence (*, /, +, -) and temporary variable generation.',
    code: `// Sample 1: Arithmetic Precedence & Evaluation
int a, b, c, x;
a = 10;
b = 20;
c = 5;
x = (a + b) * c;
`
  },
  {
    id: 'sample2',
    name: '2. Complex Arithmetic with Unary & Modulo',
    description: 'Nested parentheses, unary negation, modulo arithmetic.',
    code: `// Sample 2: Complex Expression with Unary & Modulo
int p, q, r, res;
p = 15;
q = 4;
r = 2;
res = (p % q) + -(r * 3) / 2;
`
  },
  {
    id: 'sample3',
    name: '3. If-Else Control Flow',
    description: 'Relational jump conditions, true/false targets, and branch convergence.',
    code: `// Sample 3: If-Else Control Flow
int x, y, max;
x = 42;
y = 19;
if (x > y) {
    max = x;
} else {
    max = y;
}
`
  },
  {
    id: 'sample4',
    name: '4. While Loop with Backpatching',
    description: 'Loop header label, body backpatching, backward jump, and loop exit.',
    code: `// Sample 4: While Loop with Accumulator
int i, sum, limit;
i = 1;
sum = 0;
limit = 10;
while (i <= limit) {
    sum = sum + i;
    i = i + 1;
}
`
  },
  {
    id: 'sample5',
    name: '5. Short-Circuit Boolean Evaluation (AND & OR)',
    description: 'Backpatching truelists and falselists with && and || logic.',
    code: `// Sample 5: Short-Circuit Boolean Logic
int a, b, c, d, flag;
a = 10;
b = 5;
c = 3;
d = 8;
if (a > b && c < d) {
    flag = 1;
} else {
    flag = 0;
}
`
  },
  {
    id: 'sample6',
    name: '6. Nested Conditions & Complex Logic',
    description: 'Nested conditionals, compound boolean operators, and merged fallthroughs.',
    code: `// Sample 6: Nested Conditionals
int temp, pressure, status;
temp = 95;
pressure = 120;
if (temp >= 100 || pressure > 110) {
    if (temp > 90 && pressure > 100) {
        status = 2; // Critical Warning
    } else {
        status = 1; // Caution
    }
} else {
    status = 0; // Nominal
}
`
  }
];

export function runValidationSuite(): TestCaseResult[] {
  const tests: Array<{ name: string; code: string; expectSuccess: boolean }> = [
    {
      name: '1. Simple Assignment',
      code: 'int a; a = 5;',
      expectSuccess: true,
    },
    {
      name: '2. Arithmetic Precedence',
      code: 'int a, b, c, x; x = a + b * c;',
      expectSuccess: true,
    },
    {
      name: '3. Nested Parentheses',
      code: 'int x, a, b, c; x = ((a + b) * (c - 2)) / 3;',
      expectSuccess: true,
    },
    {
      name: '4. Multiple Assignments & Decls',
      code: 'int a = 1, b = 2, c; c = a + b;',
      expectSuccess: true,
    },
    {
      name: '5. If Statement (No Else)',
      code: 'int a, b, x; if (a > b) { x = a; }',
      expectSuccess: true,
    },
    {
      name: '6. If-Else Statement',
      code: 'int a, b, max; if (a > b) { max = a; } else { max = b; }',
      expectSuccess: true,
    },
    {
      name: '7. While Loop',
      code: 'int i, n; while (i < n) { i = i + 1; }',
      expectSuccess: true,
    },
    {
      name: '8. Relational Condition',
      code: 'int a, b, r; if (a <= b) { r = 1; }',
      expectSuccess: true,
    },
    {
      name: '9. Boolean AND with Short-Circuit',
      code: 'int a, b, c, d, flag; if (a > b && c < d) { flag = 1; }',
      expectSuccess: true,
    },
    {
      name: '10. Boolean OR with Short-Circuit',
      code: 'int x, y, res; if (x == 0 || y != 1) { res = 99; }',
      expectSuccess: true,
    },
    {
      name: '11. Nested Conditions',
      code: 'int x, y; if (x > 0) { if (y > 0) { x = x + y; } }',
      expectSuccess: true,
    },
    {
      name: '12. Invalid Syntax (Missing Semicolon Error Handling)',
      code: 'int a = 5 a = 10;',
      expectSuccess: false,
    },
  ];

  return tests.map((t) => {
    const res = Compiler.compile(t.code);
    const passed = t.expectSuccess ? res.success : !res.success;
    return {
      name: t.name,
      code: t.code,
      passed,
      notes: passed
        ? t.expectSuccess
          ? `Parsed successfully: ${res.tacInstructions.length} TAC instructions, ${res.astNodeCount} AST nodes.`
          : `Correctly caught error: ${res.errors[0]?.message || 'Syntax error'}`
        : `Failed expectation (expected ${t.expectSuccess ? 'success' : 'failure'})`,
      tacSnippet: res.tacInstructions.slice(0, 5).map((i) => i.raw),
      postfixSnippet: res.postfixResults.slice(0, 2).map((p) => p.postfixString),
    };
  });
}
