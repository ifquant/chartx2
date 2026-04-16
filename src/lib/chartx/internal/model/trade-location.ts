import {
  createCompressedPriceBasedChartBarSequence,
  createDirectionColumnPriceBasedChartBarSequence,
  createTimeBasedChartBarSequence,
} from "./chart-bar-sequence";
import { createPlotRows, type OhlcDataPoint } from "./series-data";
import {
  buildKagiData,
  buildLineBreakData,
  buildPointFigureData,
  buildRenkoData,
} from "./main-series-builders";
import type { PhaseOneMainChartType } from "./main-series-chart-types";
import type {
  KagiStyleOptionsState,
  PointFigureStyleOptionsState,
  RenkoStyleOptionsState,
} from "./main-series-style-options";

export type PhaseOneTradeSide = "long" | "short";

export type PhaseOneTradeLocationRequest = {
  kind: "locate-trade";
  tradeId: string;
  symbol: string;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  side: PhaseOneTradeSide;
  quantity: number;
  realizedPnl: number;
};

export type PhaseOneTradeOverlayOptions = {
  fitRange?: boolean;
  showMarkers?: boolean;
  showSpan?: boolean;
  showConnector?: boolean;
  entryLabel?: string;
  exitLabel?: string;
  longColor?: string;
  shortColor?: string;
  spanOpacity?: number;
  connectorLineWidth?: number;
};

export type PhaseOneResolvedTradeOverlayOptions = Required<PhaseOneTradeOverlayOptions>;

export type PhaseOneTradeLocationState = {
  request: PhaseOneTradeLocationRequest;
  resolvedEntryTime: number;
  resolvedExitTime: number;
  resolvedEntryLogical: number;
  resolvedExitLogical: number;
  resolvedEntryPrice: number;
  resolvedExitPrice: number;
  logicalRange: { from: number; to: number };
  priceRange: { minValue: number; maxValue: number };
  overlay: PhaseOneResolvedTradeOverlayOptions;
};

export type PhaseOneTradeLocationContext = {
  chartType: PhaseOneMainChartType;
  inputData: readonly OhlcDataPoint<number>[];
  lineBreakOptions: { lineCount: number };
  renkoOptions: Required<RenkoStyleOptionsState>;
  pointFigureOptions: Required<PointFigureStyleOptionsState>;
  kagiOptions: Required<KagiStyleOptionsState>;
};

type PhaseOneTradeLocationRow = OhlcDataPoint<number> & {
  logicalIndex: number;
};

const DEFAULT_TRADE_OVERLAY_OPTIONS: PhaseOneResolvedTradeOverlayOptions = {
  fitRange: true,
  showMarkers: true,
  showSpan: true,
  showConnector: true,
  entryLabel: "Entry",
  exitLabel: "Exit",
  longColor: "#059669",
  shortColor: "#dc2626",
  spanOpacity: 0.12,
  connectorLineWidth: 2,
};

export function resolveTradeOverlayOptions(
  options: PhaseOneTradeOverlayOptions = {},
): PhaseOneResolvedTradeOverlayOptions {
  return {
    ...DEFAULT_TRADE_OVERLAY_OPTIONS,
    ...options,
  };
}

export function resolveTradeLocationState(
  request: PhaseOneTradeLocationRequest,
  context: PhaseOneTradeLocationContext,
  options: PhaseOneTradeOverlayOptions = {},
): PhaseOneTradeLocationState | null {
  const rows = resolveTradeLocationRows(context);
  if (rows.length === 0) {
    return null;
  }

  const entryRow = findNearestTradeLocationRow(rows, request.entryTime);
  const exitRow = findNearestTradeLocationRow(rows, request.exitTime);
  if (entryRow === null || exitRow === null) {
    return null;
  }

  const minLogical = Math.min(entryRow.logicalIndex, exitRow.logicalIndex);
  const maxLogical = Math.max(entryRow.logicalIndex, exitRow.logicalIndex);
  const logicalPadding = Math.max(4, Math.ceil((maxLogical - minLogical + 1) * 0.45));
  const minPrice = Math.min(entryRow.low, exitRow.low, request.entryPrice, request.exitPrice);
  const maxPrice = Math.max(entryRow.high, exitRow.high, request.entryPrice, request.exitPrice);
  const pricePadding = Math.max((maxPrice - minPrice) * 0.12, 24);

  return {
    request,
    resolvedEntryTime: entryRow.time,
    resolvedExitTime: exitRow.time,
    resolvedEntryLogical: entryRow.logicalIndex,
    resolvedExitLogical: exitRow.logicalIndex,
    resolvedEntryPrice: request.entryPrice,
    resolvedExitPrice: request.exitPrice,
    logicalRange: {
      from: minLogical - logicalPadding - 0.5,
      to: maxLogical + logicalPadding + 0.5,
    },
    priceRange: {
      minValue: minPrice - pricePadding,
      maxValue: maxPrice + pricePadding,
    },
    overlay: resolveTradeOverlayOptions(options),
  };
}

function resolveTradeLocationRows(
  context: PhaseOneTradeLocationContext,
): readonly PhaseOneTradeLocationRow[] {
  if (context.chartType === "line-break") {
    const rows = buildLineBreakData(context.inputData, context.lineBreakOptions.lineCount);
    const sequence = createCompressedPriceBasedChartBarSequence(createPlotRows(rows));
    return toTradeLocationRows(rows, sequence.bars);
  }

  if (context.chartType === "point-figure") {
    const rows = buildPointFigureData(context.inputData, context.pointFigureOptions);
    const sequence = createDirectionColumnPriceBasedChartBarSequence(createPlotRows(rows));
    return toTradeLocationRows(rows, sequence.bars);
  }

  if (context.chartType === "renko") {
    const rows = buildRenkoData(context.inputData, context.renkoOptions);
    const sequence = createCompressedPriceBasedChartBarSequence(createPlotRows(rows));
    return toTradeLocationRows(rows, sequence.bars);
  }

  if (context.chartType === "kagi") {
    const rows = buildKagiData(context.inputData, context.kagiOptions);
    const sequence = createCompressedPriceBasedChartBarSequence(createPlotRows(rows));
    return toTradeLocationRows(rows, sequence.bars);
  }

  const sequence = createTimeBasedChartBarSequence(createPlotRows(context.inputData));
  return toTradeLocationRows(context.inputData, sequence.bars);
}

function toTradeLocationRows(
  rows: readonly OhlcDataPoint<number>[],
  sequenceRows: readonly { index: number }[],
): readonly PhaseOneTradeLocationRow[] {
  return rows.map((row, index) => ({
    ...row,
    logicalIndex: sequenceRows[index]?.index ?? index,
  }));
}

function findNearestTradeLocationRow(
  rows: readonly PhaseOneTradeLocationRow[],
  targetTime: number,
): PhaseOneTradeLocationRow | null {
  if (rows.length === 0) {
    return null;
  }

  let left = 0;
  let right = rows.length - 1;

  while (left <= right) {
    const middle = Math.floor((left + right) / 2);
    const candidate = rows[middle];
    if (candidate.time === targetTime) {
      return candidate;
    }
    if (candidate.time < targetTime) {
      left = middle + 1;
    } else {
      right = middle - 1;
    }
  }

  const lower = rows[Math.max(0, right)];
  const upper = rows[Math.min(rows.length - 1, left)];
  if (lower === undefined) {
    return upper ?? null;
  }
  if (upper === undefined) {
    return lower;
  }

  return Math.abs(lower.time - targetTime) <= Math.abs(upper.time - targetTime) ? lower : upper;
}
