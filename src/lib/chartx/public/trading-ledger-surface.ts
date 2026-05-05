export type TradingLedgerTabTone = "red" | "green" | "neutral";

export interface TradingLedgerDetailFieldModel {
  label: string;
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
  selectedRowId?: string | null;
  emptyLabel?: string;
  detailTitle?: string;
  detailEmptyLabel?: string;
}
