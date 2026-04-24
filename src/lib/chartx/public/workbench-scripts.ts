import type { PhaseOneCandlestickData, PhaseOneLineData } from "./market";

export type WorkbenchScriptField = "open" | "high" | "low" | "close" | "hl2" | "hlc3";
export type WorkbenchScriptPlacement = "overlay" | "separate-pane";

export type WorkbenchScriptExpression =
  | {
      kind: "input";
      field: WorkbenchScriptField;
    }
  | {
      kind: "sma";
      input: WorkbenchScriptExpression;
      length: number;
    }
  | {
      kind: "subtract";
      left: WorkbenchScriptExpression;
      right: WorkbenchScriptExpression;
    };

export interface WorkbenchScriptDefinition {
  id: string;
  version: 1;
  label: string;
  description: string;
  shortLabel: string;
  placement: WorkbenchScriptPlacement;
  expression: WorkbenchScriptExpression;
}

export type WorkbenchScriptExecutionResult =
  | {
      ok: true;
      output: readonly PhaseOneLineData[];
      operations: number;
    }
  | {
      ok: false;
      reason: "empty-input" | "invalid-config" | "budget-exceeded";
      message: string;
      operations: number;
    };

export interface WorkbenchScriptExecutionInput {
  bars: readonly PhaseOneCandlestickData[];
  maxOperations?: number;
}

const DEFAULT_MAX_OPERATIONS = 100_000;

export const WORKBENCH_SCRIPT_LIBRARY: readonly WorkbenchScriptDefinition[] = [
  {
    id: "close-sma-20-v0",
    version: 1,
    label: "Scripted SMA 20",
    shortLabel: "Script SMA",
    description: "Close-price SMA executed through the local script runtime.",
    placement: "separate-pane",
    expression: {
      kind: "sma",
      input: {
        kind: "input",
        field: "close",
      },
      length: 20,
    },
  },
] as const;

type EvaluationState = {
  operations: number;
  maxOperations: number;
};

class ScriptExecutionError extends Error {
  public readonly reason: "invalid-config" | "budget-exceeded";

  public constructor(reason: "invalid-config" | "budget-exceeded", message: string) {
    super(message);
    this.reason = reason;
  }
}

function resolveMaxOperations(maxOperations: number | undefined): number {
  if (maxOperations === undefined) {
    return DEFAULT_MAX_OPERATIONS;
  }
  if (!Number.isInteger(maxOperations) || maxOperations < 1) {
    throw new ScriptExecutionError("invalid-config", "Script execution budget must be a positive integer.");
  }
  return maxOperations;
}

function countOperation(state: EvaluationState): void {
  state.operations += 1;
  if (state.operations > state.maxOperations) {
    throw new ScriptExecutionError("budget-exceeded", "Script execution budget exceeded.");
  }
}

function resolveFieldValue(bar: PhaseOneCandlestickData, field: WorkbenchScriptField): number {
  switch (field) {
    case "open":
      return bar.open;
    case "high":
      return bar.high;
    case "low":
      return bar.low;
    case "hl2":
      return (bar.high + bar.low) / 2;
    case "hlc3":
      return (bar.high + bar.low + bar.close) / 3;
    case "close":
    default:
      return bar.close;
  }
}

function evaluateExpression(
  expression: WorkbenchScriptExpression,
  bars: readonly PhaseOneCandlestickData[],
  state: EvaluationState,
): Array<number | null> {
  if (expression.kind === "input") {
    return bars.map((bar) => {
      countOperation(state);
      return resolveFieldValue(bar, expression.field);
    });
  }

  if (expression.kind === "subtract") {
    const left = evaluateExpression(expression.left, bars, state);
    const right = evaluateExpression(expression.right, bars, state);
    return left.map((value, index) => {
      countOperation(state);
      const counterpart = right[index];
      if (value === null || counterpart === null) {
        return null;
      }
      return value - counterpart;
    });
  }

  if (!Number.isInteger(expression.length) || expression.length < 1) {
    throw new ScriptExecutionError("invalid-config", "SMA length must be a positive integer.");
  }

  const input = evaluateExpression(expression.input, bars, state);
  const output: Array<number | null> = [];
  let rollingSum = 0;
  let rollingCount = 0;
  const queue: number[] = [];

  for (const value of input) {
    countOperation(state);
    if (value === null) {
      output.push(null);
      continue;
    }
    queue.push(value);
    rollingSum += value;
    rollingCount += 1;
    if (queue.length > expression.length) {
      rollingSum -= queue.shift() ?? 0;
      rollingCount -= 1;
    }
    output.push(queue.length === expression.length && rollingCount === expression.length ? rollingSum / expression.length : null);
  }

  return output;
}

export function getWorkbenchScriptDefinition(id: string): WorkbenchScriptDefinition | null {
  return WORKBENCH_SCRIPT_LIBRARY.find((definition) => definition.id === id) ?? null;
}

export function executeWorkbenchScript(
  definition: WorkbenchScriptDefinition,
  input: WorkbenchScriptExecutionInput,
): WorkbenchScriptExecutionResult {
  if (input.bars.length === 0) {
    return {
      ok: false,
      reason: "empty-input",
      message: "Script execution requires at least one bar.",
      operations: 0,
    };
  }

  const state: EvaluationState = {
    operations: 0,
    maxOperations: DEFAULT_MAX_OPERATIONS,
  };

  try {
    state.maxOperations = resolveMaxOperations(input.maxOperations);
    const values = evaluateExpression(definition.expression, input.bars, state);
    return {
      ok: true,
      output: values.flatMap((value, index) => {
        if (value === null || !Number.isFinite(value)) {
          return [];
        }
        return [{ time: input.bars[index]!.time, value }];
      }),
      operations: state.operations,
    };
  } catch (error) {
    if (error instanceof ScriptExecutionError) {
      return {
        ok: false,
        reason: error.reason,
        message: error.message,
        operations: state.operations,
      };
    }
    throw error;
  }
}
