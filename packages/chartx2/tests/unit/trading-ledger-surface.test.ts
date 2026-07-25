import { describe, expect, it } from "vitest";

import * as publicPackage from "../../src/lib/public";
import {
  LEGACY_TRADING_LEDGER_COLUMNS,
  resolveTradingLedgerColumns,
  resolveTradingLedgerRowCells,
  type TradingLedgerPanelModel,
  type TradingLedgerRowModel,
} from "../../src/lib/public/trading-ledger-surface";

function legacyRow(overrides: Partial<TradingLedgerRowModel> = {}): TradingLedgerRowModel {
  return {
    id: "order-1",
    symbol: "rb2605",
    direction: "buy",
    quantity: "2",
    average: "3718",
    statusLabel: "Accepted",
    ...overrides,
  };
}

function ledgerModel(overrides: Partial<TradingLedgerPanelModel> = {}): TradingLedgerPanelModel {
  return {
    tabs: [{ id: "orders", label: "Orders" }],
    activeTabId: "orders",
    rows: [legacyRow()],
    ...overrides,
  };
}

describe("trading ledger presentation contract", () => {
  it("keeps the exact five legacy columns and cells when a host does not opt in", () => {
    const model = ledgerModel();
    const columns = resolveTradingLedgerColumns(model);

    expect(columns).toBe(LEGACY_TRADING_LEDGER_COLUMNS);
    expect(columns.map((column) => column.label)).toEqual(["合约", "方向", "数量", "均价", "浮盈/状态"]);
    expect(resolveTradingLedgerRowCells(model.rows[0], columns)).toEqual([
      { valueLabel: "rb2605" },
      { valueLabel: "buy" },
      { valueLabel: "2" },
      { valueLabel: "3718" },
      { valueLabel: "Accepted", tone: undefined },
    ]);
  });

  it("accepts heterogeneous order, fill, position, and account cell projections without domain interpretation", () => {
    const views = [
      ["订单号", "状态", "方向", "数量", "成交", "价格"],
      ["成交号", "时间", "方向", "数量", "价格"],
      ["方向", "数量", "均价", "浮盈"],
      ["账户", "时间", "权益", "可用", "保证金", "已实现净盈亏"],
    ];

    for (const labels of views) {
      const model = ledgerModel({
        columns: labels.map((label, index) => ({ id: `column-${index}`, label })),
        rows: [legacyRow({ cells: labels.map((label) => ({ valueLabel: `${label}-value` })) })],
      });
      const columns = resolveTradingLedgerColumns(model);

      expect(columns.map((column) => column.label)).toEqual(labels);
      expect(resolveTradingLedgerRowCells(model.rows[0], columns).map((cell) => cell.valueLabel)).toEqual(
        labels.map((label) => `${label}-value`),
      );
    }
  });

  it("leaves a visibly empty generic row when a host violates the cell-vector contract", () => {
    const columns = resolveTradingLedgerColumns(ledgerModel({
      columns: [{ id: "account", label: "账户" }, { id: "balance", label: "权益" }],
    }));

    expect(resolveTradingLedgerRowCells(legacyRow(), columns)).toEqual([
      { valueLabel: "—" },
      { valueLabel: "—" },
    ]);
  });

  it("keeps both ticket and ledger shells available from the package-root public barrel", () => {
    expect(publicPackage).toHaveProperty("TradingTicketPanel");
    expect(publicPackage).toHaveProperty("TradingLedgerPanel");
  });
});
