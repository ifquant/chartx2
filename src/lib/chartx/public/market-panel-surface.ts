export type MarketPanelTone = "red" | "green" | "neutral";

export interface MarketPanelTabModel {
  id: string;
  label: string;
}

export interface MarketDepthRowModel {
  price: string;
  bidSize?: string;
  askSize?: string;
  bidTone?: MarketPanelTone;
  askTone?: MarketPanelTone;
}

export interface MarketProfileRowModel {
  label: string;
  valueLabel: string;
  tone?: MarketPanelTone;
}

export interface MarketPanelModel {
  title?: string;
  tabs: readonly MarketPanelTabModel[];
  activeTabId: string;
  depthRows: readonly MarketDepthRowModel[];
  profileRows: readonly MarketProfileRowModel[];
}
