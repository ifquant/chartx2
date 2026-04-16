import type { OptimizationSurfaceView, ParameterValue } from "../model/types";

type HitTarget = { rect: Rect; runId: string };
type Rect = { x: number; y: number; width: number; height: number };

const THEME = {
  background: "#fffdf7",
  panel: "#fffaf0",
  frame: "rgba(16, 16, 16, 0.16)",
  grid: "rgba(16, 16, 16, 0.08)",
  text: "#18181b",
  muted: "rgba(24, 24, 27, 0.54)",
  highlight: "#c47b23",
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function formatParam(value: ParameterValue): string {
  return typeof value === "number" ? String(value) : String(value);
}

function lerpColor(start: [number, number, number], end: [number, number, number], t: number): string {
  const r = Math.round(start[0] + (end[0] - start[0]) * t);
  const g = Math.round(start[1] + (end[1] - start[1]) * t);
  const b = Math.round(start[2] + (end[2] - start[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function heatColor(value: number, min: number, max: number): string {
  const span = Math.max(max - min, 1);
  const t = clamp((value - min) / span, 0, 1);
  if (t <= 0.5) {
    return lerpColor([197, 77, 63], [236, 187, 71], t / 0.5);
  }
  return lerpColor([236, 187, 71], [22, 132, 95], (t - 0.5) / 0.5);
}

export class OptimizationCanvasHarness {
  private readonly context: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private readonly hitTargets: HitTarget[] = [];
  private readonly handlePointerDown = (event: PointerEvent) => this.onPointerDown(event);
  private readonly handlePointerMove = (event: PointerEvent) => this.onPointerMove(event);
  private view: OptimizationSurfaceView;
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    initialView: OptimizationSurfaceView,
    private readonly selectRun: (runId: string) => void,
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

  update(view: OptimizationSurfaceView): void {
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
    const width = Math.max(540, Math.round(rect.width || this.canvas.clientWidth || 760));
    const height = Math.max(250, Math.round(rect.height || this.canvas.clientHeight || 300));
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

    const panel = { x: 0.5, y: 0.5, width: width - 1, height: height - 1 };
    ctx.fillStyle = THEME.panel;
    ctx.strokeStyle = THEME.frame;
    ctx.fillRect(panel.x, panel.y, panel.width, panel.height);
    ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);

    ctx.fillStyle = THEME.text;
    ctx.font = "700 13px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(this.view.title, 12, 22);
    ctx.fillStyle = THEME.muted;
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(this.view.summary, 12, 40);

    const plot = { x: 70, y: 60, width: width - 102, height: height - 94 };
    this.drawGrid(plot);
    this.drawCells(plot);
    this.drawAxes(plot);
  }

  private drawGrid(plot: Rect): void {
    const ctx = this.context;
    ctx.strokeStyle = THEME.grid;
    ctx.lineWidth = 1;
    for (let index = 0; index <= 4; index += 1) {
      const y = plot.y + (plot.height / 4) * index;
      ctx.beginPath();
      ctx.moveTo(plot.x, y);
      ctx.lineTo(plot.x + plot.width, y);
      ctx.stroke();
    }
    for (let index = 0; index <= 6; index += 1) {
      const x = plot.x + (plot.width / 6) * index;
      ctx.beginPath();
      ctx.moveTo(x, plot.y);
      ctx.lineTo(x, plot.y + plot.height);
      ctx.stroke();
    }
  }

  private drawCells(plot: Rect): void {
    const ctx = this.context;
    const { dataset } = this.view;
    const xValues = dataset.xValues;
    const yValues = dataset.yValues;
    if (xValues.length === 0 || yValues.length === 0 || dataset.zRange === null) {
      return;
    }

    const cellWidth = plot.width / xValues.length;
    const cellHeight = plot.height / yValues.length;
    const pointMap = new Map(
      dataset.points.map((point) => [`${String(point.xValue)}::${String(point.yValue)}`, point] as const),
    );

    for (let yIndex = 0; yIndex < yValues.length; yIndex += 1) {
      const yValue = yValues[yIndex]!;
      for (let xIndex = 0; xIndex < xValues.length; xIndex += 1) {
        const xValue = xValues[xIndex]!;
        const point = pointMap.get(`${String(xValue)}::${String(yValue)}`);
        const rect = {
          x: plot.x + xIndex * cellWidth + 2,
          y: plot.y + (yValues.length - 1 - yIndex) * cellHeight + 2,
          width: Math.max(8, cellWidth - 4),
          height: Math.max(8, cellHeight - 4),
        };

        ctx.fillStyle =
          point === undefined
            ? "rgba(24, 24, 27, 0.04)"
            : heatColor(point.zValue, dataset.zRange.min, dataset.zRange.max);
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);

        if (point !== undefined) {
          if (point.runId === this.view.selectedRunId) {
            ctx.strokeStyle = THEME.highlight;
            ctx.lineWidth = 2;
            ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
          } else {
            ctx.strokeStyle = "rgba(24, 24, 27, 0.06)";
            ctx.lineWidth = 1;
            ctx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.width - 1, rect.height - 1);
          }
          this.hitTargets.push({ rect, runId: point.runId });
        }
      }
    }
  }

  private drawAxes(plot: Rect): void {
    const ctx = this.context;
    const { dataset } = this.view;
    const xValues = dataset.xValues;
    const yValues = dataset.yValues;
    if (xValues.length === 0 || yValues.length === 0) {
      return;
    }
    const cellWidth = plot.width / xValues.length;
    const cellHeight = plot.height / yValues.length;

    ctx.fillStyle = THEME.muted;
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textAlign = "center";
    xValues.forEach((value, index) => {
      const x = plot.x + index * cellWidth + cellWidth * 0.5;
      ctx.fillText(formatParam(value), x, plot.y + plot.height + 16);
    });

    ctx.textAlign = "right";
    yValues.forEach((value, index) => {
      const y = plot.y + (yValues.length - 1 - index) * cellHeight + cellHeight * 0.58;
      ctx.fillText(formatParam(value), plot.x - 8, y);
    });

    ctx.textAlign = "left";
    ctx.fillStyle = THEME.text;
    ctx.font = "700 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(String(dataset.spec.xParam), plot.x, plot.y + plot.height + 34);
    ctx.save();
    ctx.translate(plot.x - 48, plot.y + plot.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(String(dataset.spec.yParam), 0, 0);
    ctx.restore();

    if (dataset.zRange !== null) {
      ctx.fillStyle = THEME.muted;
      ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
      ctx.fillText(`z ${dataset.spec.zMetric}: ${dataset.zRange.min} -> ${dataset.zRange.max}`, plot.x + plot.width - 180, 22);
    }
  }

  private onPointerDown(event: PointerEvent): void {
    const point = this.toCanvasPoint(event);
    const hit = this.hitTargets.find((entry) => pointInRect(point.x, point.y, entry.rect));
    if (hit !== undefined) {
      this.selectRun(hit.runId);
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
