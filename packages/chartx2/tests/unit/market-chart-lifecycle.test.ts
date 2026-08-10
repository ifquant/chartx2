import { describe, expect, it, vi } from "vitest";

import {
  consumePhaseOneMarketChartTimeFocusCommand,
  mintPhaseOneMarketChartMountLifecycleReceipt,
  type PhaseOneMarketChartLifecycleState,
} from "../../src/lib/internal/views/market-chart-lifecycle";
import type { PhaseOneChartApi, PhaseOneTimeFocusResult } from "../../src/lib/public/market";
import type {
  PhaseOneMarketChartDataIdentityV1,
  PhaseOneMarketChartMountLifecycleReceiptV1,
  PhaseOneMarketChartTimeFocusCommandV1,
} from "../../src/lib/public/market-chart-lifecycle";

const identity = Object.freeze({ key: "rb2605:1m:2026-08-10:r1" }) satisfies PhaseOneMarketChartDataIdentityV1;

function chartWithFocus(result: PhaseOneTimeFocusResult = { kind: "exact", requestedTime: 20, resolvedTime: 20, distance: 0 }) {
  const focusTime = vi.fn(() => result);
  return {
    chart: { timeScale: () => ({ focusTime }) } as unknown as PhaseOneChartApi,
    focusTime,
  };
}

function command(
  receipt: PhaseOneMarketChartMountLifecycleReceiptV1,
  requestId = 1,
  expectedDataIdentity: PhaseOneMarketChartDataIdentityV1 = identity,
): PhaseOneMarketChartTimeFocusCommandV1 {
  return {
    requestId,
    mountLifecycleReceipt: receipt,
    expectedDataIdentity,
    focus: { time: 20, maxDistance: 0 },
  };
}

function state(
  receipt: PhaseOneMarketChartMountLifecycleReceiptV1 | null,
  chart: PhaseOneChartApi | null,
  overrides: Partial<{
    mounted: boolean;
    dataIdentity: PhaseOneMarketChartDataIdentityV1 | undefined;
    axisReady: boolean;
  }> = {},
): PhaseOneMarketChartLifecycleState {
  return {
    mounted: true,
    receipt,
    dataIdentity: identity,
    chart,
    axisReady: true,
    ...overrides,
  };
}

describe("market chart lifecycle receipt", () => {
  it("mints frozen reference-only receipts and rejects every lookalike", () => {
    const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    const { chart, focusTime } = chartWithFocus();
    expect(Object.isFrozen(receipt)).toBe(true);
    expect(JSON.stringify(receipt)).toBe("{}");

    for (const forged of [
      { ...receipt },
      Reflect.construct(Object, []),
      JSON.parse(JSON.stringify(receipt)),
      structuredClone(receipt),
    ]) {
      const completion = consumePhaseOneMarketChartTimeFocusCommand(
        command(forged as PhaseOneMarketChartMountLifecycleReceiptV1),
        state(receipt, chart),
      );
      expect(completion).toMatchObject({ kind: "rejected", reason: "invalidRequest" });
      if (completion?.kind === "rejected") {
        expect(completion.checkedMountLifecycleReceipt).toBeNull();
        expect(completion.currentDataIdentity).toEqual(identity);
        expect(Object.isFrozen(completion.currentDataIdentity)).toBe(true);
        expect("dataIdentity" in completion).toBe(false);
        expect("mountLifecycleReceipt" in completion).toBe(false);
      }
    }
    expect(focusTime).not.toHaveBeenCalled();
  });

  it("focuses exactly once and snapshots the non-null completed identity", () => {
    const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    const mutableIdentity: { key: string } = { key: identity.key };
    const { chart, focusTime } = chartWithFocus({ kind: "nearest", requestedTime: 20, resolvedTime: 19, distance: 1 });
    const request = command(receipt);
    const snapshot = state(receipt, chart, { dataIdentity: mutableIdentity });
    const completion = consumePhaseOneMarketChartTimeFocusCommand(request, snapshot);

    expect(completion).toEqual({
      kind: "completed",
      requestId: 1,
      mountLifecycleReceipt: receipt,
      dataIdentity: identity,
      request: request.focus,
      result: { kind: "nearest", requestedTime: 20, resolvedTime: 19, distance: 1 },
    });
    expect(completion?.kind === "completed" && completion.dataIdentity).not.toBe(mutableIdentity);
    expect(completion?.kind === "completed" && Object.isFrozen(completion.dataIdentity)).toBe(true);
    mutableIdentity.key = "mutated-after-decision";
    expect(completion?.kind === "completed" && completion.dataIdentity.key).toBe(identity.key);
    expect(Object.isFrozen(completion)).toBe(true);
    expect(focusTime).toHaveBeenCalledTimes(1);
    expect(consumePhaseOneMarketChartTimeFocusCommand(request, snapshot)).toBeNull();
  });

  it("keeps every resolver result in the completed plane", () => {
    const results: PhaseOneTimeFocusResult[] = [
      { kind: "exact", requestedTime: 20, resolvedTime: 20, distance: 0 },
      { kind: "nearest", requestedTime: 20, resolvedTime: 19, distance: 1 },
      { kind: "outOfDomain", requestedTime: 20, reason: "beforeFirst" },
      { kind: "ambiguous", requestedTime: 20, resolvedTime: 20 },
      { kind: "noData", requestedTime: 20 },
    ];
    for (const [index, result] of results.entries()) {
      const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
      const { chart, focusTime } = chartWithFocus(result);
      const completion = consumePhaseOneMarketChartTimeFocusCommand(command(receipt, index), state(receipt, chart));
      expect(completion).toMatchObject({ kind: "completed", result });
      expect(focusTime).toHaveBeenCalledOnce();
    }
  });

  it("deduplicates null and primitive receipts by exact command object only", () => {
    const { chart, focusTime } = chartWithFocus();
    for (const invalidReceipt of [null, "receipt-v1"]) {
      const malformed = {
        requestId: 7,
        mountLifecycleReceipt: invalidReceipt,
        expectedDataIdentity: identity,
        focus: { time: 20, maxDistance: 0 },
      };
      const first = consumePhaseOneMarketChartTimeFocusCommand(malformed, state(null, chart, { dataIdentity: undefined }));
      expect(first).toMatchObject({
        kind: "rejected",
        reason: "invalidRequest",
        checkedMountLifecycleReceipt: null,
        currentDataIdentity: null,
      });
      expect(consumePhaseOneMarketChartTimeFocusCommand(malformed, state(null, chart))).toBeNull();

      const distinctObject = { ...malformed };
      expect(consumePhaseOneMarketChartTimeFocusCommand(distinctObject, state(null, chart))).toMatchObject({
        kind: "rejected",
        reason: "invalidRequest",
      });
    }
    expect(consumePhaseOneMarketChartTimeFocusCommand(null, state(null, chart))).toBeNull();
    expect(consumePhaseOneMarketChartTimeFocusCommand("not-a-command", state(null, chart))).toBeNull();
    expect(focusTime).not.toHaveBeenCalled();
  });

  it("treats callable lookalikes as untrusted identity ledger keys", () => {
    const active = mintPhaseOneMarketChartMountLifecycleReceipt();
    const callable = (() => undefined) as unknown as PhaseOneMarketChartMountLifecycleReceiptV1;
    const { chart, focusTime } = chartWithFocus();
    const first = command(callable, 8);
    const equivalent = { ...first };

    expect(consumePhaseOneMarketChartTimeFocusCommand(first, state(active, chart))).toMatchObject({
      kind: "rejected",
      reason: "invalidRequest",
      checkedMountLifecycleReceipt: null,
    });
    expect(consumePhaseOneMarketChartTimeFocusCommand(equivalent, state(active, chart))).toBeNull();
    expect(focusTime).not.toHaveBeenCalled();
  });

  it("deduplicates forged object receipt/id pairs across command objects", () => {
    const active = mintPhaseOneMarketChartMountLifecycleReceipt();
    const forged = {} as PhaseOneMarketChartMountLifecycleReceiptV1;
    const { chart, focusTime } = chartWithFocus();
    const first = command(forged, 9);
    const equivalent = { ...first };

    expect(consumePhaseOneMarketChartTimeFocusCommand(first, state(active, chart))).toMatchObject({
      kind: "rejected",
      reason: "invalidRequest",
    });
    expect(consumePhaseOneMarketChartTimeFocusCommand(equivalent, state(active, chart))).toBeNull();
    expect(focusTime).not.toHaveBeenCalled();
  });

  it("reserves the exact command before reading its receipt field", () => {
    const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    const { chart, focusTime } = chartWithFocus();
    let nested: ReturnType<typeof consumePhaseOneMarketChartTimeFocusCommand> | undefined;
    let hostileCommand: Record<string, unknown>;
    let receiptReads = 0;
    const hostileState = state(receipt, chart);
    hostileCommand = {
      requestId: 10,
      get mountLifecycleReceipt() {
        receiptReads += 1;
        nested = consumePhaseOneMarketChartTimeFocusCommand(hostileCommand, hostileState);
        return receipt;
      },
      expectedDataIdentity: identity,
      focus: { time: 20, maxDistance: 0 },
    };

    expect(consumePhaseOneMarketChartTimeFocusCommand(hostileCommand, hostileState)).toMatchObject({ kind: "completed" });
    expect(nested).toBeNull();
    expect(receiptReads).toBe(1);
    expect(focusTime).toHaveBeenCalledOnce();
  });

  it("terminalizes a throwing receipt accessor without reading later fields", () => {
    const { chart, focusTime } = chartWithFocus();
    let receiptReads = 0;
    let expectedReads = 0;
    let focusReads = 0;
    const malformed = {
      requestId: 11,
      get mountLifecycleReceipt() {
        receiptReads += 1;
        throw new Error("receipt getter");
      },
      get expectedDataIdentity() {
        expectedReads += 1;
        return identity;
      },
      get focus() {
        focusReads += 1;
        return { time: 20, maxDistance: 0 };
      },
    };

    expect(consumePhaseOneMarketChartTimeFocusCommand(malformed, state(null, chart))).toMatchObject({
      kind: "rejected",
      reason: "invalidRequest",
      checkedMountLifecycleReceipt: null,
      currentDataIdentity: identity,
    });
    expect(consumePhaseOneMarketChartTimeFocusCommand(malformed, state(null, chart))).toBeNull();
    expect({ receiptReads, expectedReads, focusReads }).toEqual({ receiptReads: 1, expectedReads: 0, focusReads: 0 });
    expect(focusTime).not.toHaveBeenCalled();
  });

  it("emits nothing for malformed request ids", () => {
    const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    const { chart, focusTime } = chartWithFocus();
    for (const requestId of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1, "1", undefined]) {
      const malformed = { ...command(receipt), requestId };
      expect(consumePhaseOneMarketChartTimeFocusCommand(malformed, state(receipt, chart))).toBeNull();
      expect(consumePhaseOneMarketChartTimeFocusCommand(malformed, state(receipt, chart))).toBeNull();
    }
    let receiptReads = 0;
    const throwingId = {
      get requestId() { throw new Error("request id getter"); },
      get mountLifecycleReceipt() { receiptReads += 1; return receipt; },
    };
    expect(consumePhaseOneMarketChartTimeFocusCommand(throwingId, state(receipt, chart))).toBeNull();
    expect(receiptReads).toBe(0);
    expect(focusTime).not.toHaveBeenCalled();
  });

  it("snapshots a valid request id getter exactly once", () => {
    const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    const { chart, focusTime } = chartWithFocus();
    let requestIdReads = 0;
    const accessorCommand = {
      get requestId() { requestIdReads += 1; return 14; },
      mountLifecycleReceipt: receipt,
      expectedDataIdentity: identity,
      focus: { time: 20, maxDistance: 0 },
    };

    expect(consumePhaseOneMarketChartTimeFocusCommand(accessorCommand, state(receipt, chart))).toMatchObject({
      kind: "completed",
      requestId: 14,
    });
    expect(requestIdReads).toBe(1);
    expect(focusTime).toHaveBeenCalledOnce();
  });

  it("reads expected identity and focus command accessors once and types their throws", () => {
    const { chart, focusTime } = chartWithFocus();
    for (const throwingField of ["expectedDataIdentity", "focus"] as const) {
      const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
      let expectedReads = 0;
      let focusReads = 0;
      const hostile = {
        requestId: throwingField === "expectedDataIdentity" ? 12 : 13,
        mountLifecycleReceipt: receipt,
        get expectedDataIdentity() {
          expectedReads += 1;
          if (throwingField === "expectedDataIdentity") throw new Error("expected getter");
          return identity;
        },
        get focus() {
          focusReads += 1;
          if (throwingField === "focus") throw new Error("focus getter");
          return { time: 20, maxDistance: 0 };
        },
      };
      expect(consumePhaseOneMarketChartTimeFocusCommand(hostile, state(receipt, chart))).toMatchObject({
        kind: "rejected",
        reason: "invalidRequest",
        checkedMountLifecycleReceipt: receipt,
      });
      expect(expectedReads).toBe(1);
      expect(focusReads).toBe(throwingField === "focus" ? 1 : 0);
      expect(consumePhaseOneMarketChartTimeFocusCommand(hostile, state(receipt, chart))).toBeNull();
    }
    expect(focusTime).not.toHaveBeenCalled();
  });

  it("applies lifecycle/data/payload rejection priority with truthful identity snapshots", () => {
    const { chart, focusTime } = chartWithFocus();

    const noDataReceipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    expect(consumePhaseOneMarketChartTimeFocusCommand(
      { ...command(noDataReceipt, 1), focus: { time: Number.NaN, maxDistance: 0 } },
      state(noDataReceipt, chart, { dataIdentity: undefined }),
    )).toMatchObject({
      kind: "rejected",
      reason: "dataNotReady",
      checkedMountLifecycleReceipt: noDataReceipt,
      currentDataIdentity: null,
    });

    const mismatchReceipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    expect(consumePhaseOneMarketChartTimeFocusCommand(
      command(mismatchReceipt, 1, { key: "other" }),
      state(mismatchReceipt, chart),
    )).toMatchObject({ kind: "rejected", reason: "dataIdentityMismatch", currentDataIdentity: identity });

    const invalidFocusReceipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    expect(consumePhaseOneMarketChartTimeFocusCommand(
      { ...command(invalidFocusReceipt, 1), focus: { time: Number.NaN, maxDistance: 0 } },
      state(invalidFocusReceipt, chart),
    )).toMatchObject({ kind: "rejected", reason: "invalidRequest", currentDataIdentity: identity });

    const ownerReceipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    expect(consumePhaseOneMarketChartTimeFocusCommand(
      command(ownerReceipt, 1),
      state(ownerReceipt, chart, { mounted: false, dataIdentity: undefined }),
    )).toMatchObject({
      kind: "rejected",
      reason: "disposed",
      checkedMountLifecycleReceipt: ownerReceipt,
      currentDataIdentity: null,
    });

    const foreignReceipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    expect(consumePhaseOneMarketChartTimeFocusCommand(
      command(foreignReceipt, 1),
      state(ownerReceipt, chart, { mounted: false, dataIdentity: undefined }),
    )).toMatchObject({
      kind: "rejected",
      reason: "superseded",
      checkedMountLifecycleReceipt: foreignReceipt,
      currentDataIdentity: null,
    });

    expect(focusTime).not.toHaveBeenCalled();
  });

  it("records stale and old receipt terminals across component states", () => {
    const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    const current = mintPhaseOneMarketChartMountLifecycleReceipt();
    const { chart, focusTime } = chartWithFocus();

    expect(consumePhaseOneMarketChartTimeFocusCommand(command(receipt, 8), state(current, chart))).toMatchObject({
      kind: "rejected",
      reason: "superseded",
    });
    expect(consumePhaseOneMarketChartTimeFocusCommand(command(receipt, 8), state(receipt, chart))).toBeNull();

    const latest = mintPhaseOneMarketChartMountLifecycleReceipt();
    expect(consumePhaseOneMarketChartTimeFocusCommand(command(latest, 4), state(latest, null))).toMatchObject({
      kind: "rejected",
      reason: "dataNotReady",
    });
    expect(consumePhaseOneMarketChartTimeFocusCommand(command(latest, 3), state(latest, chart))).toMatchObject({
      kind: "rejected",
      reason: "staleRequest",
    });
    expect(focusTime).not.toHaveBeenCalled();
  });

  it("reserves before resolver re-entry and rethrows resolver invariants after terminalizing", () => {
    const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    let nested: ReturnType<typeof consumePhaseOneMarketChartTimeFocusCommand> | undefined;
    let recursiveCommand: PhaseOneMarketChartTimeFocusCommandV1;
    let recursiveState: PhaseOneMarketChartLifecycleState;
    const focusTime = vi.fn(() => {
      nested = consumePhaseOneMarketChartTimeFocusCommand(recursiveCommand, recursiveState);
      return { kind: "exact" as const, requestedTime: 20, resolvedTime: 20, distance: 0 as const };
    });
    recursiveCommand = command(receipt, 20);
    recursiveState = state(receipt, { timeScale: () => ({ focusTime }) } as unknown as PhaseOneChartApi);

    expect(consumePhaseOneMarketChartTimeFocusCommand(recursiveCommand, recursiveState)).toMatchObject({ kind: "completed" });
    expect(nested).toBeNull();
    expect(focusTime).toHaveBeenCalledOnce();

    const throwingReceipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    const throwingFocus = vi.fn(() => { throw new Error("resolver invariant"); });
    const throwingChart = { timeScale: () => ({ focusTime: throwingFocus }) } as unknown as PhaseOneChartApi;
    const throwingCommand = command(throwingReceipt, 21);
    expect(() => consumePhaseOneMarketChartTimeFocusCommand(
      throwingCommand,
      state(throwingReceipt, throwingChart),
    )).toThrowError("resolver invariant");
    expect(consumePhaseOneMarketChartTimeFocusCommand(throwingCommand, state(throwingReceipt, throwingChart))).toBeNull();
    expect(throwingFocus).toHaveBeenCalledOnce();
  });

  it("freezes rejection identity independently from later host mutation", () => {
    const receipt = mintPhaseOneMarketChartMountLifecycleReceipt();
    const mutableIdentity: { key: string } = { key: identity.key };
    const { chart } = chartWithFocus();
    const completion = consumePhaseOneMarketChartTimeFocusCommand(
      command(receipt, 30, { key: "different" }),
      state(receipt, chart, { dataIdentity: mutableIdentity }),
    );
    expect(completion).toMatchObject({ kind: "rejected", currentDataIdentity: identity });
    if (completion?.kind !== "rejected" || completion.currentDataIdentity === null) {
      throw new Error("expected a rejection with current identity snapshot");
    }
    expect(completion.currentDataIdentity).not.toBe(mutableIdentity);
    expect(Object.isFrozen(completion.currentDataIdentity)).toBe(true);
    mutableIdentity.key = "mutated-after-rejection";
    expect(completion.currentDataIdentity.key).toBe(identity.key);
  });
});
