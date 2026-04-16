import type { OptimizationSurfaceView, ParameterSurfacePoint, ParameterValue } from "../model/types";

type HitTarget =
  | { kind: "heatmap-cell"; rect: Rect; runId: string }
  | { kind: "surface-point"; x: number; y: number; radius: number; runId: string };

type Rect = { x: number; y: number; width: number; height: number };
type Point3D = { x: number; y: number; z: number };
type ProjectedPoint = { x: number; y: number; depth: number };
type Camera = { yaw: number; pitch: number };

const THEME = {
  background: "#fffdf7",
  panel: "#fffaf0",
  frame: "rgba(16, 16, 16, 0.16)",
  grid: "rgba(16, 16, 16, 0.08)",
  axis: "rgba(24, 24, 27, 0.35)",
  text: "#18181b",
  muted: "rgba(24, 24, 27, 0.54)",
  highlight: "#c47b23",
  pointStroke: "rgba(24, 24, 27, 0.18)",
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function pointInRect(x: number, y: number, rect: Rect): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

function pointInCircle(x: number, y: number, cx: number, cy: number, radius: number): boolean {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
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

function pointColor(point: ParameterSurfacePoint, view: OptimizationSurfaceView): string {
  const range = view.dataset.colorRange ?? view.dataset.zRange;
  const value =
    typeof point.colorValue === "number"
      ? point.colorValue
      : point.zValue;
  if (range === null) {
    return "rgba(24, 24, 27, 0.18)";
  }
  return heatColor(value, range.min, range.max);
}

function rotate(point: Point3D, camera: Camera): Point3D {
  const cy = Math.cos(camera.yaw);
  const sy = Math.sin(camera.yaw);
  const cp = Math.cos(camera.pitch);
  const sp = Math.sin(camera.pitch);

  const x1 = point.x * cy - point.z * sy;
  const z1 = point.x * sy + point.z * cy;
  const y2 = point.y * cp - z1 * sp;
  const z2 = point.y * sp + z1 * cp;

  return { x: x1, y: y2, z: z2 };
}

function projectPoint(point: Point3D, camera: Camera, plot: Rect, scale: number): ProjectedPoint {
  const rotated = rotate(point, camera);
  const perspective = 1 / (1 + rotated.z * 0.72);
  return {
    x: plot.x + plot.width * 0.5 + rotated.x * scale * perspective,
    y: plot.y + plot.height * 0.68 - rotated.y * scale * perspective,
    depth: rotated.z,
  };
}

export class OptimizationCanvasHarness {
  private readonly context: CanvasRenderingContext2D;
  private readonly resizeObserver: ResizeObserver;
  private readonly hitTargets: HitTarget[] = [];
  private readonly handlePointerDown = (event: PointerEvent) => this.onPointerDown(event);
  private readonly handlePointerMove = (event: PointerEvent) => this.onPointerMove(event);
  private readonly handlePointerUp = (event: PointerEvent) => this.onPointerUp(event);
  private view: OptimizationSurfaceView;
  private destroyed = false;
  private dragStart:
    | {
        x: number;
        y: number;
        camera: Camera;
        moved: boolean;
      }
    | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    initialView: OptimizationSurfaceView,
    private readonly selectRun: (runId: string) => void,
    private readonly updateCamera?: (camera: Camera) => void,
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
    canvas.addEventListener("pointerup", this.handlePointerUp);
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
    this.canvas.removeEventListener("pointerup", this.handlePointerUp);
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
    if (this.view.renderMode === "heatmap") {
      this.drawGrid(plot);
      this.drawHeatmap(plot);
      this.drawHeatmapAxes(plot);
    } else {
      this.drawSurface3D(plot, this.view.renderMode === "surface-3d");
    }
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

  private drawHeatmap(plot: Rect): void {
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

        this.context.fillStyle =
          point === undefined
            ? "rgba(24, 24, 27, 0.04)"
            : heatColor(point.zValue, dataset.zRange.min, dataset.zRange.max);
        this.context.fillRect(rect.x, rect.y, rect.width, rect.height);

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
          this.hitTargets.push({ kind: "heatmap-cell", rect, runId: point.runId });
        }
      }
    }
  }

  private drawHeatmapAxes(plot: Rect): void {
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

  private drawSurface3D(plot: Rect, fillSurface: boolean): void {
    const ctx = this.context;
    const { dataset } = this.view;
    const xValues = dataset.xValues;
    const yValues = dataset.yValues;
    const zRange = dataset.zRange;
    if (xValues.length === 0 || yValues.length === 0 || zRange === null) {
      return;
    }

    const pointMap = new Map(
      dataset.points.map((point) => [`${String(point.xValue)}::${String(point.yValue)}`, point] as const),
    );

    const coords = new Map<string, Point3D>();
    xValues.forEach((xValue, xIndex) => {
      yValues.forEach((yValue, yIndex) => {
        const point = pointMap.get(`${String(xValue)}::${String(yValue)}`);
        if (point === undefined) {
          return;
        }
        const xNormalized = xValues.length === 1 ? 0 : (xIndex / (xValues.length - 1)) * 2 - 1;
        const yNormalized = yValues.length === 1 ? 0 : (yIndex / (yValues.length - 1)) * 2 - 1;
        const zNormalized =
          (((point.zValue - zRange.min) / Math.max(zRange.max - zRange.min, 1)) * 2 - 1) * 1.45;
        coords.set(point.runId, { x: xNormalized, y: zNormalized, z: yNormalized });
      });
    });

    const scale = Math.min(plot.width, plot.height) * 0.38;
    this.draw3DAxes(plot, scale);
    this.draw3DBaseGrid(plot, scale);

    if (fillSurface) {
      const quads: Array<{ depth: number; polygon: ProjectedPoint[]; color: string }> = [];
      for (let yIndex = 0; yIndex < yValues.length - 1; yIndex += 1) {
        for (let xIndex = 0; xIndex < xValues.length - 1; xIndex += 1) {
          const a = pointMap.get(`${String(xValues[xIndex])}::${String(yValues[yIndex])}`);
          const b = pointMap.get(`${String(xValues[xIndex + 1])}::${String(yValues[yIndex])}`);
          const c = pointMap.get(`${String(xValues[xIndex + 1])}::${String(yValues[yIndex + 1])}`);
          const d = pointMap.get(`${String(xValues[xIndex])}::${String(yValues[yIndex + 1])}`);
          if (a === undefined || b === undefined || c === undefined || d === undefined) {
            continue;
          }
          const pa = projectPoint(coords.get(a.runId)!, this.view.camera, plot, scale);
          const pb = projectPoint(coords.get(b.runId)!, this.view.camera, plot, scale);
          const pc = projectPoint(coords.get(c.runId)!, this.view.camera, plot, scale);
          const pd = projectPoint(coords.get(d.runId)!, this.view.camera, plot, scale);
          const avgZ = (a.zValue + b.zValue + c.zValue + d.zValue) / 4;
          quads.push({
            depth: (pa.depth + pb.depth + pc.depth + pd.depth) / 4,
            polygon: [pa, pb, pc, pd],
            color: heatColor(avgZ, zRange.min, zRange.max),
          });
        }
      }
      quads.sort((left, right) => left.depth - right.depth);
      quads.forEach((quad) => {
        ctx.beginPath();
        ctx.moveTo(quad.polygon[0]!.x, quad.polygon[0]!.y);
        quad.polygon.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.fillStyle = quad.color.replace("rgb", "rgba").replace(")", ", 0.22)");
        ctx.fill();
        ctx.strokeStyle = "rgba(24, 24, 27, 0.12)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    const renderedPoints = dataset.points
      .map((point) => {
        const projected = projectPoint(coords.get(point.runId)!, this.view.camera, plot, scale);
        return { point, projected };
      })
      .sort((left, right) => left.projected.depth - right.projected.depth);

    renderedPoints.forEach(({ point, projected }) => {
      const radius = point.runId === this.view.selectedRunId ? 7 : 5.2;
      const base = projectPoint(
        { ...coords.get(point.runId)!, y: -1.18 },
        this.view.camera,
        plot,
        scale,
      );
      ctx.strokeStyle = "rgba(24, 24, 27, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(projected.x, projected.y);
      ctx.stroke();

      ctx.fillStyle = pointColor(point, this.view);
      ctx.strokeStyle = point.runId === this.view.selectedRunId ? THEME.highlight : THEME.pointStroke;
      ctx.lineWidth = point.runId === this.view.selectedRunId ? 2 : 1;
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      this.hitTargets.push({
        kind: "surface-point",
        x: projected.x,
        y: projected.y,
        radius: radius + 4,
        runId: point.runId,
      });
    });

    ctx.fillStyle = THEME.text;
    ctx.font = "700 11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(`${dataset.spec.xParam} / ${dataset.spec.yParam} / ${dataset.spec.zMetric}`, plot.x, plot.y + plot.height + 20);
    ctx.fillStyle = THEME.muted;
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText("Drag to rotate", plot.x + plot.width - 88, plot.y + plot.height + 20);
  }

  private draw3DBaseGrid(plot: Rect, scale: number): void {
    const ctx = this.context;
    const gridLines = 5;
    ctx.strokeStyle = "rgba(24, 24, 27, 0.08)";
    ctx.lineWidth = 1;

    for (let index = 0; index <= gridLines; index += 1) {
      const t = (index / gridLines) * 2 - 1;
      const a = projectPoint({ x: -1, y: -1.18, z: t }, this.view.camera, plot, scale);
      const b = projectPoint({ x: 1, y: -1.18, z: t }, this.view.camera, plot, scale);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (let index = 0; index <= gridLines; index += 1) {
      const t = (index / gridLines) * 2 - 1;
      const a = projectPoint({ x: t, y: -1.18, z: -1 }, this.view.camera, plot, scale);
      const b = projectPoint({ x: t, y: -1.18, z: 1 }, this.view.camera, plot, scale);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }

  private draw3DAxes(plot: Rect, scale: number): void {
    const ctx = this.context;
    const origin = projectPoint({ x: -1.15, y: -1.18, z: -1.15 }, this.view.camera, plot, scale);
    const xAxis = projectPoint({ x: 1.28, y: -1.18, z: -1.15 }, this.view.camera, plot, scale);
    const yAxis = projectPoint({ x: -1.15, y: 1.38, z: -1.15 }, this.view.camera, plot, scale);
    const zAxis = projectPoint({ x: -1.15, y: -1.18, z: 1.28 }, this.view.camera, plot, scale);

    ctx.strokeStyle = THEME.axis;
    ctx.lineWidth = 1.2;
    [xAxis, yAxis, zAxis].forEach((target) => {
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });

    ctx.fillStyle = THEME.muted;
    ctx.font = "10px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(this.view.dataset.spec.xParam, xAxis.x + 4, xAxis.y + 2);
    ctx.fillText(this.view.dataset.spec.zMetric, yAxis.x + 4, yAxis.y - 4);
    ctx.fillText(this.view.dataset.spec.yParam, zAxis.x + 4, zAxis.y + 2);
  }

  private onPointerDown(event: PointerEvent): void {
    const point = this.toCanvasPoint(event);
    if (this.view.renderMode !== "heatmap") {
      this.dragStart = {
        x: point.x,
        y: point.y,
        camera: { ...this.view.camera },
        moved: false,
      };
      this.canvas.setPointerCapture(event.pointerId);
      return;
    }

    const hit = this.hitTargets.find(
      (entry) => entry.kind === "heatmap-cell" && pointInRect(point.x, point.y, entry.rect),
    );
    if (hit !== undefined) {
      this.selectRun(hit.runId);
    }
  }

  private onPointerMove(event: PointerEvent): void {
    const point = this.toCanvasPoint(event);
    if (this.dragStart !== null && this.view.renderMode !== "heatmap") {
      const dx = point.x - this.dragStart.x;
      const dy = point.y - this.dragStart.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.dragStart.moved = true;
      }
      const nextCamera = {
        yaw: this.dragStart.camera.yaw + dx * 0.012,
        pitch: clamp(this.dragStart.camera.pitch - dy * 0.01, 0.18, 1.25),
      };
      this.view = {
        ...this.view,
        camera: nextCamera,
      };
      this.updateCamera?.(nextCamera);
      this.render();
      this.canvas.style.cursor = "grabbing";
      return;
    }

    const hit = this.hitTargets.find((entry) =>
      entry.kind === "heatmap-cell"
        ? pointInRect(point.x, point.y, entry.rect)
        : pointInCircle(point.x, point.y, entry.x, entry.y, entry.radius),
    );
    this.canvas.style.cursor = hit === undefined ? (this.view.renderMode === "heatmap" ? "default" : "grab") : "pointer";
  }

  private onPointerUp(event: PointerEvent): void {
    const point = this.toCanvasPoint(event);
    if (this.view.renderMode !== "heatmap" && this.dragStart !== null) {
      const wasMoved = this.dragStart.moved;
      this.dragStart = null;
      this.canvas.releasePointerCapture(event.pointerId);
      if (wasMoved) {
        this.canvas.style.cursor = "grab";
        return;
      }
      const hit = this.hitTargets.find(
        (entry) => entry.kind === "surface-point" && pointInCircle(point.x, point.y, entry.x, entry.y, entry.radius),
      );
      if (hit !== undefined) {
        this.selectRun(hit.runId);
      }
      return;
    }
  }

  private toCanvasPoint(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }
}
