import type { PerformanceReportView } from "../model/types";

type HitTarget =
  | { kind: "equity-point"; tradeId: string }
  | { kind: "trade-row"; tradeId: string };

type Rect = { x: number; y: number; width: number; height: number };

const THEME = {
  background: "#fffdf7",
  panel: "#fffaf0",
  grid: "rgba(16, 16, 16, 0.08)",
  frame: "rgba(16, 16, 16, 0.18)",
  text: "#18181b",
  muted: "rgba(24, 24, 27, 0.54)",
  green: "#16845f",
  red: "#c54d3f",
  blue: "#365cb7",
  amber: "#c47b23",
} as const;

function formatCurrency(value: number | string): string {
  if (typeof value === "string") {
    return value;
  }
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function formatMetricValue(label: string, value: number | string): string {
  if (typeof value === "string") {
    return value;
  }
  if (label.toLowerCase().includes("rate")) {
    return `${value.toFixed(1)}%`;
  }
  if (label.toLowerCase().includes("trades")) {
    return String(Math.round(value));
  }
  return formatCurrency(value);
}

function formatTime(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

export class PerformanceCanvasHarness {
  private readonly context: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private readonly hitTargets: Array<{ rect: Rect; target: HitTarget }> = [];
  private readonly handlePointerDown = (event: PointerEvent) => this.onPointerDown(event);
  private readonly handlePointerMove = (event: PointerEvent) => this.onPointerMove(event);
  private view: PerformanceReportView;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    initialView: PerformanceReportView,
    private readonly selectTrade: (tradeId: string) => void,
  ) {
    const context = canvas.getContext("2d");
    if (context === null) {
      throw new Error("Canvas 2D context is unavailable");
    }
    this.context = context;
    this.view = initialView;
    this.resizeObserver = new ResizeObserver(() => this.render());
    this.resizeObserver.observe(canvas);
    canvas.addEventListener("pointerdown", this.handlePointerDown);
    canvas.addEventListener("pointermove", this.handlePointerMove);
    this.render();
  }

  update(view: PerformanceReportView): void {
    this.view = view;
    this.render();
  }

  destroy(): void {
    this.destroyed = true;
    this.resizeObserver.disconnect();
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.removeEventListener("pointermove", this.handlePointerMove);
  }

  private syncSize(): { width: number; height: number } {
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(720, Math.round(rect.width || this.canvas.clientWidth || 960));
    const height = Math.max(520, Math.round(rect.height || this.canvas.clientHeight || 680));
    const pixelWidth = Math.round(width * ratio);
    const pixelHeight = Math.round(height * ratio);
    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
    }
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { width, height };
  }

  private render(): void {
    if (this.destroyed) {
      return;
    }
    const { width, height } = this.syncSize();
    const ctx = this.context;
    this.hitTargets.length = 0;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = THEME.background;
    ctx.fillRect(0, 0, width, height);

    const margin = 18;
    const cardsRect = { x: margin, y: margin, width: width - margin * 2, height: 72 };
    const summaryRect = { x: margin, y: cardsRect.y + cardsRect.height + 14, width: width - margin * 2, height: 98 };
    const tableWidth = clamp(width * 0.32, 280, 390);
    const equityRect = {
      x: margin,
      y: summaryRect.y + summaryRect.height + 14,
      width: width - tableWidth - margin * 3,
      height: Math.max(220, height * 0.31),
    };
    const bottomTop = equityRect.y + equityRect.height + 14;
    const bottomHeight = height - bottomTop - margin;
    const panelGap = 14;
    const underwaterWidth = Math.max(230, equityRect.width * 0.34);
    const histogramWidth = Math.max(230, equityRect.width * 0.35);
    const donutWidth = Math.max(190, equityRect.width - underwaterWidth - histogramWidth - panelGap * 2);
    const underwaterRect = {
      x: margin,
      y: bottomTop,
      width: underwaterWidth,
      height: bottomHeight,
    };
    const histogramRect = {
      x: underwaterRect.x + underwaterRect.width + panelGap,
      y: bottomTop,
      width: histogramWidth,
      height: bottomHeight,
    };
    const donutRect = {
      x: histogramRect.x + histogramRect.width + 14,
      y: bottomTop,
      width: donutWidth,
      height: bottomHeight,
    };
    const tableRect = {
      x: equityRect.x + equityRect.width + 18,
      y: equityRect.y,
      width: tableWidth,
      height: height - equityRect.y - margin,
    };

    this.drawCards(cardsRect);
    this.drawSummaryRow(summaryRect);
    this.drawEquity(equityRect);
    this.drawUnderwater(underwaterRect);
    this.drawHistogram(histogramRect);
    this.drawDonut(donutRect);
    this.drawTradeTable(tableRect);
  }

  private drawSummaryRow(rect: Rect): void {
    const gap = 14;
    const panelWidth = (rect.width - gap) / 2;
    this.drawProfitStructure({
      x: rect.x,
      y: rect.y,
      width: panelWidth,
      height: rect.height,
    });
    this.drawBenchmarking({
      x: rect.x + panelWidth + gap,
      y: rect.y,
      width: panelWidth,
      height: rect.height,
    });
  }

  private drawPanel(rect: Rect, title: string): void {
    const ctx = this.context;
    ctx.fillStyle = THEME.panel;
    ctx.strokeStyle = THEME.frame;
    ctx.lineWidth = 1;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.fillStyle = THEME.text;
    ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(title, rect.x + 12, rect.y + 22);
  }

  private drawCards(rect: Rect): void {
    const ctx = this.context;
    const metrics = this.view.metrics;
    const gap = 10;
    const cardWidth = (rect.width - gap * Math.max(metrics.length - 1, 0)) / Math.max(metrics.length, 1);
    metrics.forEach((metric, index) => {
      const x = rect.x + index * (cardWidth + gap);
      ctx.fillStyle = THEME.panel;
      ctx.strokeStyle = THEME.frame;
      ctx.fillRect(x, rect.y, cardWidth, rect.height);
      ctx.strokeRect(x, rect.y, cardWidth, rect.height);
      ctx.fillStyle = THEME.muted;
      ctx.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(metric.label, x + 10, rect.y + 22);
      ctx.fillStyle = metric.metricKey === "maxDrawdown" ? THEME.red : THEME.text;
      ctx.font = "800 18px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(formatMetricValue(metric.label, metric.value), x + 10, rect.y + 50);
    });
  }

  private drawEquity(rect: Rect): void {
    this.drawPanel(rect, "Closed-trade equity");
    const ctx = this.context;
    const points = this.view.equity.points;
    const benchmark = this.view.benchmark?.points ?? [];
    const excursions = this.view.excursions.points;
    const selectedId = this.view.selectedTrade?.id ?? null;
    const plot = { x: rect.x + 48, y: rect.y + 42, width: rect.width - 68, height: rect.height - 70 };
    this.drawGrid(plot);
    if (points.length === 0) {
      return;
    }

    const equities = points.map((point) => point.equity).concat(benchmark.map((point) => point.value));
    const min = Math.min(...equities);
    const max = Math.max(...equities);
    const span = Math.max(max - min, 1);
    const xFor = (index: number) => plot.x + (index / Math.max(points.length - 1, 1)) * plot.width;
    const yFor = (value: number) => plot.y + plot.height - ((value - min) / span) * plot.height;

    if (benchmark.length > 0) {
      ctx.strokeStyle = "rgba(196, 123, 35, 0.9)";
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      benchmark.forEach((point, index) => {
        const x = xFor(index);
        const y = yFor(point.value);
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.strokeStyle = THEME.blue;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.equity);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.equity);
      const selected = point.tradeId === selectedId;

       if (selected) {
        const excursion = excursions.find((entry) => entry.tradeId === point.tradeId);
        if (excursion !== undefined) {
          const topY = yFor(point.equity - point.netPnl + excursion.mfe);
          const bottomY = yFor(point.equity - point.netPnl + excursion.mae);
          ctx.strokeStyle = "rgba(196, 123, 35, 0.72)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x, topY);
          ctx.lineTo(x, bottomY);
          ctx.stroke();
          ctx.fillStyle = "rgba(196, 123, 35, 0.9)";
          ctx.fillRect(x - 3, topY - 1, 6, 2);
          ctx.fillRect(x - 3, bottomY - 1, 6, 2);
        }
      }

      ctx.fillStyle = selected ? THEME.amber : point.netPnl >= 0 ? THEME.green : THEME.red;
      ctx.beginPath();
      ctx.arc(x, y, selected ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fill();
      this.hitTargets.push({
        rect: { x: x - 14, y: y - 14, width: 28, height: 28 },
        target: { kind: "equity-point", tradeId: point.tradeId },
      });
    });

    ctx.fillStyle = THEME.muted;
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(formatCurrency(max), plot.x, plot.y - 10);
    ctx.fillText(formatCurrency(min), plot.x, plot.y + plot.height + 18);
    if (benchmark.length > 0) {
      ctx.fillStyle = THEME.amber;
      ctx.fillText("Buy & hold", plot.x + 110, plot.y - 10);
    }
    ctx.fillStyle = THEME.blue;
    ctx.fillText("Strategy", plot.x + 42, plot.y - 10);
  }

  private drawUnderwater(rect: Rect): void {
    this.drawPanel(rect, "Drawdown / underwater");
    const ctx = this.context;
    const points = this.view.underwater.points;
    const plot = { x: rect.x + 40, y: rect.y + 42, width: rect.width - 56, height: rect.height - 68 };
    this.drawGrid(plot);
    if (points.length === 0) {
      return;
    }

    const min = Math.min(...points.map((point) => point.value), 0);
    const max = 0;
    const span = Math.max(max - min, 1);
    const xFor = (index: number) => plot.x + (index / Math.max(points.length - 1, 1)) * plot.width;
    const yFor = (value: number) => plot.y + plot.height - ((value - min) / span) * plot.height;
    const zeroY = yFor(0);

    ctx.fillStyle = "rgba(197, 77, 63, 0.14)";
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.value);
      if (index === 0) {
        ctx.moveTo(x, zeroY);
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(plot.x + plot.width, zeroY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = THEME.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.value);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.strokeStyle = "rgba(24, 24, 27, 0.3)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(plot.x, zeroY);
    ctx.lineTo(plot.x + plot.width, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = THEME.muted;
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(formatCurrency(0), plot.x, plot.y - 10);
    ctx.fillText(formatCurrency(min), plot.x, plot.y + plot.height + 18);
  }

  private drawProfitStructure(rect: Rect): void {
    this.drawPanel(rect, "Profit structure");
    const ctx = this.context;
    const slices = this.view.profitStructure.slices;
    if (slices.length === 0) {
      return;
    }
    const plot = { x: rect.x + 18, y: rect.y + 38, width: rect.width - 36, height: rect.height - 54 };
    const total = Math.max(slices.reduce((sum, slice) => sum + Math.abs(slice.value), 0), 1);
    let cursorX = plot.x;
    slices.forEach((slice) => {
      const width = (Math.abs(slice.value) / total) * plot.width;
      ctx.fillStyle = slice.color;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(cursorX, plot.y + 8, width, 24);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(16, 16, 16, 0.08)";
      ctx.strokeRect(cursorX, plot.y + 8, width, 24);
      cursorX += width;
    });

    const startY = plot.y + 46;
    slices.forEach((slice, index) => {
      const y = startY + index * 16;
      ctx.fillStyle = slice.color;
      ctx.fillRect(plot.x, y - 8, 10, 10);
      ctx.fillStyle = THEME.muted;
      ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(slice.label, plot.x + 16, y);
      ctx.fillStyle = THEME.text;
      ctx.textAlign = "right";
      ctx.fillText(formatCurrency(slice.value), plot.x + plot.width, y);
      ctx.textAlign = "left";
    });
  }

  private drawBenchmarking(rect: Rect): void {
    this.drawPanel(rect, "Benchmarking");
    const ctx = this.context;
    const data = this.view.benchmarking;
    const plot = { x: rect.x + 28, y: rect.y + 38, width: rect.width - 52, height: rect.height - 56 };
    const min = data.range.min;
    const max = data.range.max;
    const span = Math.max(max - min, 1);
    const zeroY = plot.y + plot.height - ((0 - min) / span) * plot.height;

    ctx.strokeStyle = "rgba(24, 24, 27, 0.22)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(plot.x, zeroY);
    ctx.lineTo(plot.x + plot.width, zeroY);
    ctx.stroke();
    ctx.setLineDash([]);

    const gap = 18;
    const barWidth = (plot.width - gap * (data.points.length - 1)) / Math.max(data.points.length, 1);
    data.points.forEach((point, index) => {
      const x = plot.x + index * (barWidth + gap);
      const valueY = plot.y + plot.height - ((point.value - min) / span) * plot.height;
      const top = Math.min(valueY, zeroY);
      const height = Math.max(Math.abs(zeroY - valueY), 2);
      ctx.fillStyle = point.color;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(x, top, barWidth, height);
      ctx.globalAlpha = 1;
      ctx.fillStyle = THEME.muted;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(point.label, x + barWidth / 2, plot.y + plot.height + 14);
      ctx.fillStyle = THEME.text;
      ctx.fillText(formatCurrency(point.value), x + barWidth / 2, top - 6);
      ctx.textAlign = "left";
    });
  }

  private drawHistogram(rect: Rect): void {
    this.drawPanel(rect, "P&L distribution");
    const ctx = this.context;
    const bins = this.view.pnlDistribution.bins;
    const plot = { x: rect.x + 34, y: rect.y + 42, width: rect.width - 54, height: rect.height - 68 };
    this.drawGrid(plot);
    if (bins.length === 0) {
      return;
    }
    const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
    const gap = 5;
    const barWidth = (plot.width - gap * Math.max(bins.length - 1, 0)) / bins.length;
    bins.forEach((bin, index) => {
      const height = (bin.count / maxCount) * plot.height;
      const x = plot.x + index * (barWidth + gap);
      const y = plot.y + plot.height - height;
      ctx.fillStyle = bin.to <= 0 ? THEME.red : bin.from >= 0 ? THEME.green : THEME.amber;
      ctx.fillRect(x, y, barWidth, height);
    });
  }

  private drawDonut(rect: Rect): void {
    this.drawPanel(rect, "Win / Loss");
    const ctx = this.context;
    const slices = this.view.winLossBreakdown.slices;
    const total = slices.reduce((count, slice) => count + slice.count, 0);
    const cx = rect.x + rect.width * 0.36;
    const cy = rect.y + rect.height * 0.56;
    const radius = Math.max(34, Math.min(rect.width, rect.height) * 0.22);
    let start = -Math.PI / 2;
    for (const slice of slices) {
      const angle = total === 0 ? 0 : (slice.count / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.fillStyle = slice.color;
      ctx.arc(cx, cy, radius, start, start + angle);
      ctx.closePath();
      ctx.fill();
      start += angle;
    }
    ctx.fillStyle = THEME.panel;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = THEME.text;
    ctx.font = "800 17px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(String(total), cx, cy + 5);
    ctx.textAlign = "left";
    slices.forEach((slice, index) => {
      const y = rect.y + 52 + index * 22;
      ctx.fillStyle = slice.color;
      ctx.fillRect(rect.x + rect.width * 0.62, y - 9, 9, 9);
      ctx.fillStyle = THEME.text;
      ctx.font = "600 12px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(`${slice.label} ${slice.count}`, rect.x + rect.width * 0.62 + 16, y);
    });
  }

  private drawTradeTable(rect: Rect): void {
    this.drawPanel(rect, "Trades");
    const ctx = this.context;
    const selectedId = this.view.selectedTrade?.id ?? null;
    const rows = this.view.tradeRows;
    const rowHeight = 28;
    const headerY = rect.y + 44;
    ctx.fillStyle = THEME.muted;
    ctx.font = "700 10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("#", rect.x + 12, headerY);
    ctx.fillText("SIDE", rect.x + 48, headerY);
    ctx.fillText("P&L", rect.x + 108, headerY);
    ctx.fillText("EXIT", rect.x + 178, headerY);

    rows.forEach((row, index) => {
      const y = rect.y + 58 + index * rowHeight;
      if (y + rowHeight > rect.y + rect.height - 8) {
        return;
      }
      const selected = row.tradeId === selectedId;
      if (selected) {
        ctx.fillStyle = "rgba(196, 123, 35, 0.16)";
        ctx.fillRect(rect.x + 6, y - 16, rect.width - 12, rowHeight);
      }
      ctx.fillStyle = selected ? THEME.text : "rgba(24, 24, 27, 0.78)";
      ctx.font = "600 11px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(String(row.tradeIndex), rect.x + 12, y);
      ctx.fillText(row.side.toUpperCase(), rect.x + 48, y);
      ctx.fillStyle = row.netPnl >= 0 ? THEME.green : THEME.red;
      ctx.fillText(formatCurrency(row.netPnl), rect.x + 108, y);
      ctx.fillStyle = THEME.muted;
      ctx.fillText(formatTime(row.exitTime), rect.x + 178, y);
      this.hitTargets.push({
        rect: { x: rect.x + 6, y: y - 18, width: rect.width - 12, height: rowHeight },
        target: { kind: "trade-row", tradeId: row.tradeId },
      });
    });
  }

  private drawGrid(rect: Rect): void {
    const ctx = this.context;
    ctx.strokeStyle = THEME.grid;
    ctx.lineWidth = 1;
    for (let index = 0; index <= 4; index += 1) {
      const y = rect.y + (rect.height / 4) * index;
      ctx.beginPath();
      ctx.moveTo(rect.x, y);
      ctx.lineTo(rect.x + rect.width, y);
      ctx.stroke();
    }
    for (let index = 0; index <= 6; index += 1) {
      const x = rect.x + (rect.width / 6) * index;
      ctx.beginPath();
      ctx.moveTo(x, rect.y);
      ctx.lineTo(x, rect.y + rect.height);
      ctx.stroke();
    }
  }

  private onPointerDown(event: PointerEvent): void {
    const point = this.toCanvasPoint(event);
    const hit = this.hitTargets.find((entry) => pointInRect(point.x, point.y, entry.rect));
    if (hit !== undefined) {
      this.selectTrade(hit.target.tradeId);
    }
  }

  private onPointerMove(event: PointerEvent): void {
    const point = this.toCanvasPoint(event);
    const hit = this.hitTargets.find((entry) => pointInRect(point.x, point.y, entry.rect));
    this.canvas.style.cursor = hit === undefined ? "default" : "pointer";
  }

  private toCanvasPoint(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
