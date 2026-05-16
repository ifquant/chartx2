export type OrderBookLadderDepthMode = "level-1" | "level-5" | "full";
export type OrderBookLadderRowSide = "ask" | "bid" | "spread";

export interface OrderBookLadderLevelModel {
  price: number;
  bidSize?: number;
  askSize?: number;
}

export interface OrderBookLadderModel {
  symbol: string;
  depthMode: OrderBookLadderDepthMode;
  lastPrice?: number;
  priceTick?: number;
  levels: readonly OrderBookLadderLevelModel[];
  emptyLabel?: string;
}

export interface OrderBookLadderResolvedRow {
  price: number;
  priceLabel: string;
  bidSizeLabel: string;
  askSizeLabel: string;
  bidPercent: number;
  askPercent: number;
  side: OrderBookLadderRowSide;
  isBestBid: boolean;
  isBestAsk: boolean;
  isLastPrice: boolean;
}

export interface OrderBookLadderResolvedModel {
  symbol: string;
  depthMode: OrderBookLadderDepthMode;
  depthLabel: string;
  lastPriceLabel: string;
  emptyLabel: string;
  rows: readonly OrderBookLadderResolvedRow[];
}

function formatPrice(value: number | undefined, priceTick: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return "--";
  }
  if (priceTick !== undefined && priceTick > 0 && priceTick < 1) {
    const decimals = Math.max(0, Math.ceil(Math.abs(Math.log10(priceTick))));
    return value.toFixed(decimals);
  }
  return value.toFixed(0);
}

function formatSize(value: number | undefined): string {
  return value === undefined || value <= 0 ? "" : value.toLocaleString("en-US");
}

function depthLabel(depthMode: OrderBookLadderDepthMode): string {
  if (depthMode === "level-1") {
    return "1档";
  }
  if (depthMode === "level-5") {
    return "5档";
  }
  return "多档";
}

function bestBid(levels: readonly OrderBookLadderLevelModel[]): number | undefined {
  return levels
    .filter((level) => (level.bidSize ?? 0) > 0)
    .reduce<number | undefined>(
      (bestPrice, level) => (bestPrice === undefined ? level.price : Math.max(bestPrice, level.price)),
      undefined,
    );
}

function bestAsk(levels: readonly OrderBookLadderLevelModel[]): number | undefined {
  return levels
    .filter((level) => (level.askSize ?? 0) > 0)
    .reduce<number | undefined>(
      (bestPrice, level) => (bestPrice === undefined ? level.price : Math.min(bestPrice, level.price)),
      undefined,
    );
}

function rowSide(
  level: OrderBookLadderLevelModel,
  resolvedBestBid: number | undefined,
  resolvedBestAsk: number | undefined,
): OrderBookLadderRowSide {
  if (resolvedBestAsk !== undefined && level.price >= resolvedBestAsk) {
    return "ask";
  }
  if (resolvedBestBid !== undefined && level.price <= resolvedBestBid) {
    return "bid";
  }
  return "spread";
}

export function resolveOrderBookLadderModel(model: OrderBookLadderModel): OrderBookLadderResolvedModel {
  // Hosts provide raw price/size rows; the reusable library owns display-only facts so
  // alpha2 and future shells do not drift on best-price, labels, or depth-bar scaling.
  const maxSize = Math.max(
    1,
    ...model.levels.flatMap((level) => [level.bidSize ?? 0, level.askSize ?? 0]),
  );
  const resolvedBestBid = bestBid(model.levels);
  const resolvedBestAsk = bestAsk(model.levels);

  return {
    symbol: model.symbol,
    depthMode: model.depthMode,
    depthLabel: depthLabel(model.depthMode),
    lastPriceLabel: formatPrice(model.lastPrice, model.priceTick),
    emptyLabel: model.emptyLabel ?? "Waiting for market depth.",
    rows: model.levels.map((level) => ({
      price: level.price,
      priceLabel: formatPrice(level.price, model.priceTick),
      bidSizeLabel: formatSize(level.bidSize),
      askSizeLabel: formatSize(level.askSize),
      bidPercent: Math.round(((level.bidSize ?? 0) / maxSize) * 100),
      askPercent: Math.round(((level.askSize ?? 0) / maxSize) * 100),
      side: rowSide(level, resolvedBestBid, resolvedBestAsk),
      isBestBid: resolvedBestBid === level.price,
      isBestAsk: resolvedBestAsk === level.price,
      isLastPrice: model.lastPrice === level.price,
    })),
  };
}
