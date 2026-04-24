import { describe, expect, it } from "vitest";

import {
  buildWorkbenchScriptLibrary,
  createWorkbenchCustomScriptDefinition,
  executeWorkbenchScript,
  getWorkbenchScriptDefinition,
  getWorkbenchScriptDefinitionFromLibrary,
  WORKBENCH_SCRIPT_LIBRARY,
} from "../../src/lib/chartx/public/workbench-scripts";

const bars = [
  { time: 1, open: 10, high: 12, low: 9, close: 11 },
  { time: 2, open: 11, high: 13, low: 10, close: 12 },
  { time: 3, open: 12, high: 14, low: 11, close: 13 },
  { time: 4, open: 13, high: 15, low: 12, close: 14 },
] as const;

describe("workbench script runtime", () => {
  it("publishes the deterministic V0 script library", () => {
    expect(WORKBENCH_SCRIPT_LIBRARY.map((definition) => definition.id)).toEqual([
      "close-sma-20-v0",
      "hlc3-sma-10-v0",
    ]);
    expect(getWorkbenchScriptDefinition("close-sma-20-v0")?.label).toBe("Scripted SMA 20");
    expect(getWorkbenchScriptDefinition("hlc3-sma-10-v0")?.label).toBe("Scripted HLC3 SMA 10");
  });

  it("builds custom script definitions into the runtime library", () => {
    const custom = createWorkbenchCustomScriptDefinition("custom-script-1", {
      label: "My Close SMA",
      shortLabel: "My SMA",
      description: "Saved close-price SMA.",
      field: "close",
      placement: "separate-pane",
      defaultLength: 9,
    });
    const library = buildWorkbenchScriptLibrary([custom]);

    expect(library.map((definition) => definition.id)).toEqual([
      "close-sma-20-v0",
      "hlc3-sma-10-v0",
      "custom-script-1",
    ]);
    expect(getWorkbenchScriptDefinitionFromLibrary(library, "custom-script-1")).toEqual(custom);
  });

  it("executes bounded arithmetic expressions over bar inputs", () => {
    const result = executeWorkbenchScript(
      {
        id: "spread",
        version: 1,
        label: "Spread",
        shortLabel: "Spread",
        description: "Close minus open.",
        placement: "overlay",
        expression: {
          kind: "subtract",
          left: { kind: "input", field: "close" },
          right: { kind: "input", field: "open" },
        },
      },
      { bars },
    );

    expect(result).toEqual({
      ok: true,
      output: [
        { time: 1, value: 1 },
        { time: 2, value: 1 },
        { time: 3, value: 1 },
        { time: 4, value: 1 },
      ],
      operations: 12,
    });
  });

  it("executes SMA expressions and skips warmup bars", () => {
    const result = executeWorkbenchScript(
      {
        id: "sma-3",
        version: 1,
        label: "SMA 3",
        shortLabel: "SMA 3",
        description: "Three-period close SMA.",
        placement: "separate-pane",
        expression: {
          kind: "sma",
          input: { kind: "input", field: "close" },
          length: 3,
        },
      },
      { bars },
    );

    expect(result).toEqual({
      ok: true,
      output: [
        { time: 3, value: 12 },
        { time: 4, value: 13 },
      ],
      operations: 8,
    });
  });

  it("returns an isolated failure for invalid configs", () => {
    const result = executeWorkbenchScript(
      {
        id: "bad-sma",
        version: 1,
        label: "Bad SMA",
        shortLabel: "Bad",
        description: "Invalid length.",
        placement: "overlay",
        expression: {
          kind: "sma",
          input: { kind: "input", field: "close" },
          length: 0,
        },
      },
      { bars },
    );

    expect(result).toEqual({
      ok: false,
      reason: "invalid-config",
      message: "SMA length must be a positive integer.",
      operations: 0,
    });
  });

  it("returns an isolated failure when the execution budget is exceeded", () => {
    const result = executeWorkbenchScript(
      {
        id: "budget",
        version: 1,
        label: "Budget",
        shortLabel: "Budget",
        description: "Budget capped input.",
        placement: "overlay",
        expression: {
          kind: "subtract",
          left: { kind: "input", field: "close" },
          right: { kind: "input", field: "open" },
        },
      },
      { bars, maxOperations: 3 },
    );

    expect(result).toEqual({
      ok: false,
      reason: "budget-exceeded",
      message: "Script execution budget exceeded.",
      operations: 4,
    });
  });

  it("rejects invalid execution budgets instead of disabling the sandbox", () => {
    const result = executeWorkbenchScript(
      {
        id: "bad-budget",
        version: 1,
        label: "Bad budget",
        shortLabel: "Budget",
        description: "Invalid budget input.",
        placement: "overlay",
        expression: {
          kind: "input",
          field: "close",
        },
      },
      { bars, maxOperations: Number.NaN },
    );

    expect(result).toEqual({
      ok: false,
      reason: "invalid-config",
      message: "Script execution budget must be a positive integer.",
      operations: 0,
    });
  });

  it("uses default numeric input values published by the script definition", () => {
    const definition = getWorkbenchScriptDefinition("hlc3-sma-10-v0");
    expect(definition).not.toBeNull();
    const result = executeWorkbenchScript(
      {
        ...definition!,
        inputs: [
          {
            id: "length",
            label: "Length",
            min: 2,
            max: 60,
            step: 1,
            defaultValue: 3,
          },
        ],
      },
      { bars },
    );

    expect(result).toEqual({
      ok: true,
      output: [
        { time: 3, value: 11.666666666666666 },
        { time: 4, value: 12.666666666666666 },
      ],
      operations: 8,
    });
  });

  it("accepts numeric input overrides for scripted parameters", () => {
    const definition = getWorkbenchScriptDefinition("close-sma-20-v0");
    expect(definition).not.toBeNull();
    const result = executeWorkbenchScript(definition!, {
      bars,
      numericInputs: {
        length: 2,
      },
    });

    expect(result).toEqual({
      ok: true,
      output: [
        { time: 2, value: 11.5 },
        { time: 3, value: 12.5 },
        { time: 4, value: 13.5 },
      ],
      operations: 8,
    });
  });

  it("rejects invalid numeric input overrides", () => {
    const definition = getWorkbenchScriptDefinition("close-sma-20-v0");
    expect(definition).not.toBeNull();
    const result = executeWorkbenchScript(definition!, {
      bars,
      numericInputs: {
        length: 100,
      },
    });

    expect(result).toEqual({
      ok: false,
      reason: "invalid-config",
      message: "Length must be between 2 and 60.",
      operations: 0,
    });
  });
});
