import type { PhaseOneCandlestickData, PhaseOneLineData } from "./market";

export type WorkbenchScriptField = "open" | "high" | "low" | "close" | "hl2" | "hlc3";
export type WorkbenchScriptPlacement = "overlay" | "separate-pane";
export type WorkbenchScriptNumericInputId = string;
export type WorkbenchScriptSource = "builtin" | "custom";

export interface WorkbenchScriptNumericInputDefinition {
  id: WorkbenchScriptNumericInputId;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
}

export type WorkbenchScriptNumericInputValueMap = Readonly<Record<WorkbenchScriptNumericInputId, number>>;

type WorkbenchScriptNumericValue =
  | number
  | {
      kind: "numeric-input";
      inputId: WorkbenchScriptNumericInputId;
    };

export type WorkbenchScriptExpression =
  | {
      kind: "input";
      field: WorkbenchScriptField;
    }
  | {
      kind: "sma";
      input: WorkbenchScriptExpression;
      length: WorkbenchScriptNumericValue;
    }
  | {
      kind: "subtract";
      left: WorkbenchScriptExpression;
      right: WorkbenchScriptExpression;
    };

export interface WorkbenchScriptDefinition {
  id: string;
  version: 1;
  source?: WorkbenchScriptSource;
  label: string;
  description: string;
  shortLabel: string;
  placement: WorkbenchScriptPlacement;
  inputs?: readonly WorkbenchScriptNumericInputDefinition[];
  expression: WorkbenchScriptExpression;
}

export interface WorkbenchCustomScriptDraft {
  label: string;
  shortLabel: string;
  description: string;
  field: WorkbenchScriptField;
  placement: WorkbenchScriptPlacement;
  defaultLength: number;
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
  numericInputs?: WorkbenchScriptNumericInputValueMap;
  maxOperations?: number;
}

const DEFAULT_MAX_OPERATIONS = 100_000;

export const WORKBENCH_SCRIPT_LIBRARY: readonly WorkbenchScriptDefinition[] = [
  {
    id: "close-sma-20-v0",
    version: 1,
    source: "builtin",
    label: "Scripted SMA 20",
    shortLabel: "Script SMA",
    description: "Close-price SMA executed through the local script runtime.",
    placement: "separate-pane",
    inputs: [
      {
        id: "length",
        label: "Length",
        min: 2,
        max: 60,
        step: 1,
        defaultValue: 20,
      },
    ],
    expression: {
      kind: "sma",
      input: {
        kind: "input",
        field: "close",
      },
      length: {
        kind: "numeric-input",
        inputId: "length",
      },
    },
  },
  {
    id: "hlc3-sma-10-v0",
    version: 1,
    source: "builtin",
    label: "Scripted HLC3 SMA 10",
    shortLabel: "HLC3 SMA",
    description: "HLC3 SMA executed through the local script runtime.",
    placement: "separate-pane",
    inputs: [
      {
        id: "length",
        label: "Length",
        min: 2,
        max: 60,
        step: 1,
        defaultValue: 10,
      },
    ],
    expression: {
      kind: "sma",
      input: {
        kind: "input",
        field: "hlc3",
      },
      length: {
        kind: "numeric-input",
        inputId: "length",
      },
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

function resolveScriptNumericInputValues(
  definition: WorkbenchScriptDefinition,
  numericInputs: WorkbenchScriptNumericInputValueMap | undefined,
): WorkbenchScriptNumericInputValueMap {
  const resolved: Record<string, number> = {};
  const definitions = definition.inputs ?? [];
  const knownIds = new Set(definitions.map((input) => input.id));

  for (const input of definitions) {
    const value = numericInputs?.[input.id] ?? input.defaultValue;
    if (!Number.isFinite(value)) {
      throw new ScriptExecutionError("invalid-config", `${input.label} must be a finite number.`);
    }
    if (value < input.min || value > input.max) {
      throw new ScriptExecutionError(
        "invalid-config",
        `${input.label} must be between ${input.min} and ${input.max}.`,
      );
    }
    resolved[input.id] = value;
  }

  if (numericInputs !== undefined) {
    for (const inputId of Object.keys(numericInputs)) {
      if (!knownIds.has(inputId)) {
        throw new ScriptExecutionError("invalid-config", `Unknown script input ${inputId}.`);
      }
    }
  }

  return resolved;
}

function resolveNumericValue(
  value: WorkbenchScriptNumericValue,
  inputValues: WorkbenchScriptNumericInputValueMap,
): number {
  if (typeof value === "number") {
    return value;
  }
  const resolved = inputValues[value.inputId];
  if (!Number.isFinite(resolved)) {
    throw new ScriptExecutionError("invalid-config", `Missing numeric script input ${value.inputId}.`);
  }
  return resolved;
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
  inputValues: WorkbenchScriptNumericInputValueMap,
): Array<number | null> {
  if (expression.kind === "input") {
    return bars.map((bar) => {
      countOperation(state);
      return resolveFieldValue(bar, expression.field);
    });
  }

  if (expression.kind === "subtract") {
    const left = evaluateExpression(expression.left, bars, state, inputValues);
    const right = evaluateExpression(expression.right, bars, state, inputValues);
    return left.map((value, index) => {
      countOperation(state);
      const counterpart = right[index];
      if (value === null || counterpart === null) {
        return null;
      }
      return value - counterpart;
    });
  }

  const length = resolveNumericValue(expression.length, inputValues);
  if (!Number.isInteger(length) || length < 1) {
    throw new ScriptExecutionError("invalid-config", "SMA length must be a positive integer.");
  }

  const input = evaluateExpression(expression.input, bars, state, inputValues);
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
    if (queue.length > length) {
      rollingSum -= queue.shift() ?? 0;
      rollingCount -= 1;
    }
    output.push(queue.length === length && rollingCount === length ? rollingSum / length : null);
  }

  return output;
}

export function getWorkbenchScriptDefinition(id: string): WorkbenchScriptDefinition | null {
  return WORKBENCH_SCRIPT_LIBRARY.find((definition) => definition.id === id) ?? null;
}

export function buildWorkbenchScriptLibrary(
  customDefinitions: readonly WorkbenchScriptDefinition[] = [],
): readonly WorkbenchScriptDefinition[] {
  return [...WORKBENCH_SCRIPT_LIBRARY, ...customDefinitions];
}

export function getWorkbenchScriptDefinitionFromLibrary(
  definitions: readonly WorkbenchScriptDefinition[],
  id: string,
): WorkbenchScriptDefinition | null {
  return definitions.find((definition) => definition.id === id) ?? null;
}

export function createWorkbenchCustomScriptDefinition(
  id: string,
  draft: WorkbenchCustomScriptDraft,
): WorkbenchScriptDefinition {
  return {
    id,
    version: 1,
    source: "custom",
    label: draft.label,
    shortLabel: draft.shortLabel,
    description: draft.description,
    placement: draft.placement,
    inputs: [
      {
        id: "length",
        label: "Length",
        min: 2,
        max: 60,
        step: 1,
        defaultValue: draft.defaultLength,
      },
    ],
    expression: {
      kind: "sma",
      input: {
        kind: "input",
        field: draft.field,
      },
      length: {
        kind: "numeric-input",
        inputId: "length",
      },
    },
  };
}

export function createWorkbenchCustomScriptDraftFromDefinition(
  definition: WorkbenchScriptDefinition,
): WorkbenchCustomScriptDraft | null {
  if (definition.expression.kind !== "sma" || definition.expression.input.kind !== "input") {
    return null;
  }
  const lengthInput = definition.inputs?.find((input) => input.id === "length");
  if (lengthInput === undefined) {
    return null;
  }
  const defaultLength = lengthInput.defaultValue;
  if (!Number.isInteger(defaultLength) || defaultLength < 2 || defaultLength > 60) {
    return null;
  }
  return {
    label: definition.label,
    shortLabel: definition.shortLabel,
    description: definition.description,
    field: definition.expression.input.field,
    placement: definition.placement,
    defaultLength,
  };
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
    const numericInputs = resolveScriptNumericInputValues(definition, input.numericInputs);
    const values = evaluateExpression(definition.expression, input.bars, state, numericInputs);
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
