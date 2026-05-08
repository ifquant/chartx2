import { describe, expect, it, vi } from "vitest";

import { createWorkbenchTradeIntentBridge } from "@chartx2/library";

const TRADE_INTENT = {
  kind: "locate-trade",
  tradeId: "T-002",
  symbol: "NDX",
  entryTime: 1,
  exitTime: 2,
  entryPrice: 10,
  exitPrice: 11,
  side: "long",
  quantity: 1,
  realizedPnl: 1,
  sourceChartId: "performance-report-demo",
} as const;

describe("workbench trade intent bridge", () => {
  it("keeps the pending intent until a connected locator confirms success", () => {
    const bridge = createWorkbenchTradeIntentBridge();
    const locateTrade = vi.fn(() => true);

    bridge.queue(TRADE_INTENT);
    expect(bridge.pendingIntent()).toEqual(TRADE_INTENT);

    bridge.connect({ locateTrade });

    expect(locateTrade).toHaveBeenCalledWith(TRADE_INTENT);
    expect(bridge.pendingIntent()).toBeNull();
  });

  it("schedules one retry when the first locate attempt fails", () => {
    const scheduled: Array<() => void> = [];
    const bridge = createWorkbenchTradeIntentBridge((flush) => {
      scheduled.push(flush);
    });
    const locateTrade = vi
      .fn<() => boolean>()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    bridge.queue(TRADE_INTENT);
    bridge.connect({ locateTrade });

    expect(locateTrade).toHaveBeenCalledTimes(1);
    expect(bridge.pendingIntent()).toEqual(TRADE_INTENT);
    expect(scheduled).toHaveLength(1);

    scheduled[0]!();

    expect(locateTrade).toHaveBeenCalledTimes(2);
    expect(bridge.pendingIntent()).toBeNull();
  });

  it("retries on later snapshots after an unsuccessful locate", () => {
    const bridge = createWorkbenchTradeIntentBridge(() => {});
    const locateTrade = vi
      .fn<() => boolean>()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    bridge.queue(TRADE_INTENT);
    bridge.connect({ locateTrade });
    expect(bridge.pendingIntent()).toEqual(TRADE_INTENT);

    bridge.publishSnapshot();

    expect(locateTrade).toHaveBeenCalledTimes(2);
    expect(bridge.pendingIntent()).toBeNull();
  });

  it("does not reenter locate while a snapshot-triggered flush happens during an active locate", () => {
    const bridge = createWorkbenchTradeIntentBridge(() => {});
    const calls: string[] = [];
    const locateTrade = vi.fn(() => {
      calls.push("locate:start");
      bridge.publishSnapshot();
      calls.push("locate:end");
      return true;
    });

    bridge.queue(TRADE_INTENT);
    bridge.connect({ locateTrade });

    expect(locateTrade).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["locate:start", "locate:end"]);
    expect(bridge.pendingIntent()).toBeNull();
  });
});
