export type TradingLedgerTabTone = "red" | "green" | "neutral";

export interface TradingLedgerDetailFieldModel {
  label: string;
  valueLabel: string;
  tone?: TradingLedgerTabTone;
}

/**
 * A host-provided column for ledgers whose facts do not fit the historical
 * symbol/direction/quantity/average/status projection.  This remains a text
 * presentation contract: the host keeps ownership of every fact and command.
 */
export interface TradingLedgerColumnModel {
  id: string;
  label: string;
}

/** A single host-provided value rendered in a generic ledger column. */
export interface TradingLedgerCellModel {
  valueLabel: string;
  tone?: TradingLedgerTabTone;
}

export interface TradingLedgerRowModel {
  id: string;
  symbol: string;
  direction: string;
  quantity: string;
  average: string;
  statusLabel: string;
  tone?: TradingLedgerTabTone;
  detailFields?: TradingLedgerDetailFieldModel[];
  /**
   * Values for `TradingLedgerPanelModel.columns`, in that exact order.  The
   * fields above remain required so existing five-column consumers stay
   * source- and runtime-compatible when `columns` is omitted.
   */
  cells?: readonly TradingLedgerCellModel[];
}

export interface TradingLedgerTabModel {
  id: string;
  label: string;
  badgeLabel?: string;
}

export interface TradingLedgerPanelModel {
  title?: string;
  tabs: readonly TradingLedgerTabModel[];
  activeTabId: string;
  rows: readonly TradingLedgerRowModel[];
  /**
   * Optional heterogeneous presentation columns.  If supplied, each row
   * should supply one `cells` entry per column.  The panel intentionally does
   * not interpret these cells as orders, fills, positions, or account facts.
   */
  columns?: readonly TradingLedgerColumnModel[];
  selectedRowId?: string | null;
  emptyLabel?: string;
  detailTitle?: string;
  detailEmptyLabel?: string;
}

/** The stable presentation used by all callers that omit `columns`. */
export const LEGACY_TRADING_LEDGER_COLUMNS: readonly TradingLedgerColumnModel[] = [
  { id: "symbol", label: "合约" },
  { id: "direction", label: "方向" },
  { id: "quantity", label: "数量" },
  { id: "average", label: "均价" },
  { id: "status", label: "浮盈/状态" },
];

/**
 * Resolve the column shape without making the legacy fixed table disappear.
 * A host that opts into generic columns owns its labels and values; an invalid
 * partial row is visibly incomplete instead of being silently reinterpreted.
 */
export function resolveTradingLedgerColumns(
  model: TradingLedgerPanelModel,
): readonly TradingLedgerColumnModel[] {
  return model.columns ?? LEGACY_TRADING_LEDGER_COLUMNS;
}

/** Resolve either a generic cell vector or the historical fixed row fields. */
export function resolveTradingLedgerRowCells(
  row: TradingLedgerRowModel,
  columns: readonly TradingLedgerColumnModel[],
): readonly TradingLedgerCellModel[] {
  if (row.cells) {
    return row.cells;
  }

  if (columns === LEGACY_TRADING_LEDGER_COLUMNS) {
    return [
      { valueLabel: row.symbol },
      { valueLabel: row.direction },
      { valueLabel: row.quantity },
      { valueLabel: row.average },
      { valueLabel: row.statusLabel, tone: row.tone },
    ];
  }

  return columns.map(() => ({ valueLabel: "—" }));
}
