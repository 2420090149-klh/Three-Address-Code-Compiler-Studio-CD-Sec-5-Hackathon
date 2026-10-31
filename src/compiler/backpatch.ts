// src/compiler/backpatch.ts
import { BackpatchStep, TACInstruction } from './types';

export class BackpatchManager {
  private steps: BackpatchStep[] = [];
  private stepCounter: number = 1;

  public getSteps(): BackpatchStep[] {
    return this.steps;
  }

  public reset(): void {
    this.steps = [];
    this.stepCounter = 1;
  }

  // makelist(i): create a new list containing only index i
  public makelist(instructionId: number, listType: 'truelist' | 'falselist' | 'nextlist', exprStr: string): number[] {
    const list = [instructionId];
    this.steps.push({
      step: this.stepCounter++,
      action: 'CREATE_LIST',
      title: `Create ${listType}: [${instructionId}]`,
      description: `Initialized ${listType} for expression '${exprStr}' with pending jump instruction #${instructionId}`,
      expression: exprStr,
      instructionId,
      listType,
      listValues: [...list],
      currentTacSnapshot: [],
    });
    return list;
  }

  // merge(p1, p2): concatenate two lists of jump instructions
  public merge(
    list1: number[],
    list2: number[],
    listType: 'truelist' | 'falselist' | 'nextlist',
    exprStr: string,
    reason: string
  ): number[] {
    const merged = Array.from(new Set([...list1, ...list2]));
    this.steps.push({
      step: this.stepCounter++,
      action: 'MERGE_LIST',
      title: `Merge ${listType}: [${list1.join(', ')}] ∪ [${list2.join(', ')}] → [${merged.join(', ')}]`,
      description: `${reason}. Resulting list: [${merged.join(', ')}]`,
      expression: exprStr,
      listType,
      listValues: [...merged],
      mergedFrom: { list1: [...list1], list2: [...list2] },
      currentTacSnapshot: [],
    });
    return merged;
  }

  // backpatch(p, label): inserts target label as the jump destination for each instruction on list p
  public backpatch(
    instructions: TACInstruction[],
    list: number[],
    targetLabel: string,
    exprStr: string,
    reason: string
  ): void {
    if (!list || list.length === 0) return;

    const patched: number[] = [];

    for (const instId of list) {
      // Find instruction with id == instId
      const inst = instructions.find((i) => i.id === instId);
      if (inst) {
        patched.push(instId);
        if (inst.op === 'goto') {
          inst.arg1 = targetLabel;
          inst.raw = `goto ${targetLabel}`;
        } else if (inst.op === 'if_goto') {
          // e.g., if a > b goto _
          inst.result = targetLabel;
          inst.raw = `if ${inst.arg1} ${inst.arg2} goto ${targetLabel}`;
        } else if (inst.op === 'if_false_goto') {
          inst.result = targetLabel;
          inst.raw = `ifFalse ${inst.arg1} ${inst.arg2} goto ${targetLabel}`;
        }
        inst.description += ` [Backpatched to ${targetLabel}]`;
      }
    }

    const snapshot = instructions.map((i) => `${i.id}: ${i.raw}`);

    this.steps.push({
      step: this.stepCounter++,
      action: 'BACKPATCH',
      title: `Backpatch [${patched.join(', ')}] → ${targetLabel}`,
      description: `${reason}. Resolved incomplete jump targets for instruction(s) ${patched.join(', ')} to label '${targetLabel}'.`,
      expression: exprStr,
      targetLabel,
      patchedInstructions: [...patched],
      currentTacSnapshot: snapshot,
    });
  }

  public recordJumpGen(
    instId: number,
    type: 'conditional' | 'unconditional',
    raw: string,
    exprStr: string
  ): void {
    this.steps.push({
      step: this.stepCounter++,
      action: 'GENERATE_JUMP',
      title: `Emit Pending ${type === 'conditional' ? 'Conditional' : 'Unconditional'} Jump #${instId}`,
      description: `Generated '${raw}' with placeholder destination. Target will be resolved via backpatching.`,
      expression: exprStr,
      instructionId: instId,
      currentTacSnapshot: [],
    });
  }
}
