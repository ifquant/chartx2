import { describe, expect, it } from "vitest";

import {
  applyCompareStudyOptions,
  applyMovingAverageStudyOptions,
  getCompareStudyOptions,
  getMovingAverageStudyOptions,
} from "../../src/lib/chartx/internal/views/chart-study-options";

describe("chart study options use-case", () => {
  it("applies compare-study options through default merge and display rebuild", () => {
    const calls: string[] = [];
    const state = {
      compareOptions: undefined as
        | {
            affectMainScale: boolean;
            inputContextMode: "chart-context" | "requested-context";
            requestedSymbol: string | null;
            requestedResolution: string | null;
            requestedSession: string | null;
            requestedTimezone: string | null;
            mergePolicy: "carry-forward" | "gaps" | "exact";
          }
        | undefined,
      inputContext: {
        mode: "chart-context" as const,
        symbol: null,
        resolution: null,
        session: null,
        timezone: null,
        mergePolicy: "carry-forward" as const,
      },
      data: [] as readonly unknown[],
    };

    applyCompareStudyOptions(state, {
      affectMainScale: false,
      inputContextMode: "requested-context",
      requestedSymbol: "ES1!",
      requestedResolution: "5",
      requestedSession: "regular",
      requestedTimezone: "America/New_York",
      mergePolicy: "exact",
    }, {
      defaultCompareOptions: {
        affectMainScale: true,
        inputContextMode: "chart-context",
        requestedSymbol: null,
        requestedResolution: null,
        requestedSession: null,
        requestedTimezone: null,
        mergePolicy: "carry-forward",
      },
      resolveDisplayData: (nextState) => {
        calls.push(`resolve:${nextState.inputContext.mode}:${nextState.inputContext.symbol}`);
        return ["rebuilt"];
      },
      render: () => calls.push("render"),
    });

    expect(state.compareOptions?.affectMainScale).toBe(false);
    expect(state.inputContext).toEqual({
      mode: "requested-context",
      symbol: "ES1!",
      resolution: "5",
      session: "regular",
      timezone: "America/New_York",
      mergePolicy: "exact",
    });
    expect(state.data).toEqual(["rebuilt"]);
    expect(getCompareStudyOptions(state, {
      affectMainScale: true,
      inputContextMode: "chart-context",
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward",
    })).toEqual({
      affectMainScale: false,
      inputContextMode: "requested-context",
      requestedSymbol: "ES1!",
      requestedResolution: "5",
      requestedSession: "regular",
      requestedTimezone: "America/New_York",
      mergePolicy: "exact",
    });
    expect(calls).toEqual(["resolve:requested-context:ES1!", "render"]);
  });

  it("applies moving-average options with clamped length and readback", () => {
    const calls: string[] = [];
    const state = {
      indicator: undefined as { kind: "moving-average"; length: number } | undefined,
      inputContext: {
        mode: "chart-context" as const,
        symbol: null,
        resolution: null,
        session: null,
        timezone: null,
        mergePolicy: "carry-forward" as const,
      },
      data: [] as readonly unknown[],
    };

    applyMovingAverageStudyOptions(state, {
      length: 0,
      inputContextMode: "requested-context",
      requestedSymbol: "NQ1!",
      requestedResolution: "15",
      requestedSession: "extended",
      requestedTimezone: "UTC",
      mergePolicy: "gaps",
    }, {
      defaultMovingAverageOptions: {
        length: 3,
        inputContextMode: "chart-context",
        requestedSymbol: null,
        requestedResolution: null,
        requestedSession: null,
        requestedTimezone: null,
        mergePolicy: "carry-forward",
      },
      resolveDisplayData: (nextState) => {
        calls.push(
          `resolve:${nextState.indicator?.kind === "moving-average" ? nextState.indicator.length : "na"}:${nextState.inputContext.symbol}`,
        );
        return ["ma"];
      },
      render: () => calls.push("render"),
    });

    expect(state.indicator).toEqual({ kind: "moving-average", length: 1 });
    expect(state.inputContext).toEqual({
      mode: "requested-context",
      symbol: "NQ1!",
      resolution: "15",
      session: "extended",
      timezone: "UTC",
      mergePolicy: "gaps",
    });
    expect(state.data).toEqual(["ma"]);
    expect(getMovingAverageStudyOptions(state, {
      length: 3,
      inputContextMode: "chart-context",
      requestedSymbol: null,
      requestedResolution: null,
      requestedSession: null,
      requestedTimezone: null,
      mergePolicy: "carry-forward",
    })).toEqual({
      length: 1,
      inputContextMode: "requested-context",
      requestedSymbol: "NQ1!",
      requestedResolution: "15",
      requestedSession: "extended",
      requestedTimezone: "UTC",
      mergePolicy: "gaps",
    });
    expect(calls).toEqual(["resolve:1:NQ1!", "render"]);
  });
});
