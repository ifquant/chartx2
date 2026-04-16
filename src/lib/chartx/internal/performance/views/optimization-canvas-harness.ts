import type { OptimizationSurfaceView, ParameterSurfacePoint, ParameterValue } from "../model/types";

type HitTarget =
  | { kind: "heatmap-cell"; rect: Rect; runId: string }
  | { kind: "surface-point"; x: number; y: number; radius: number; runId: string };

type Rect = { x: number; y: number; width: number; height: number };
type Point3D = { x: number; y: number; z: number };
type ProjectedPoint = { x: number; y: number; depth: number };
type SurfaceVertex = { world: Point3D; rotated: Point3D; projected: ProjectedPoint };
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

function colorString(color: [number, number, number]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

function rgbaString(color: [number, number, number], alpha: number): string {
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function normalizeRange(value: number, min: number, max: number): number {
  const span = Math.max(max - min, 1);
  return clamp((value - min) / span, 0, 1);
}

function performanceColorTriplet(value: number, min: number, max: number): [number, number, number] {
  const low = Math.min(min, 0);
  const high = Math.max(max, 0);
  const green: [number, number, number] = [62, 140, 88];
  const yellow: [number, number, number] = [214, 178, 71];
  const red: [number, number, number] = [191, 68, 51];

  if (value <= 0) {
    const t = normalizeRange(value, low, 0);
    return [
      Math.round(green[0] + (yellow[0] - green[0]) * t),
      Math.round(green[1] + (yellow[1] - green[1]) * t),
      Math.round(green[2] + (yellow[2] - green[2]) * t),
    ];
  }

  const t = normalizeRange(value, 0, high);
  return [
    Math.round(yellow[0] + (red[0] - yellow[0]) * t),
    Math.round(yellow[1] + (red[1] - yellow[1]) * t),
    Math.round(yellow[2] + (red[2] - yellow[2]) * t),
  ];
}

function averageColors(colors: Array<[number, number, number]>): [number, number, number] {
  const sum = colors.reduce(
    (acc, color) => [acc[0] + color[0], acc[1] + color[1], acc[2] + color[2]] as [number, number, number],
    [0, 0, 0],
  );
  return [
    Math.round(sum[0] / colors.length),
    Math.round(sum[1] / colors.length),
    Math.round(sum[2] / colors.length),
  ];
}

function darkenColor(color: [number, number, number], factor: number): [number, number, number] {
  return [
    Math.round(color[0] * factor),
    Math.round(color[1] * factor),
    Math.round(color[2] * factor),
  ];
}

function heatColor(value: number, min: number, max: number): string {
  return colorString(performanceColorTriplet(value, min, max));
}

function pointFillColor(value: number, min: number, max: number): string {
  return colorString(darkenColor(performanceColorTriplet(value, min, max), 0.84));
}

function surfaceFillColorFromVertices(values: [number, number, number], min: number, max: number): string {
  const color = averageColors(values.map((value) => performanceColorTriplet(value, min, max)));
  return rgbaString(color, 0.18);
}

function surfaceStrokeColorFromVertices(values: [number, number, number], min: number, max: number): string {
  const color = averageColors(values.map((value) => performanceColorTriplet(value, min, max)));
  return rgbaString(color, 0.1);
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
  return pointFillColor(value, range.min, range.max);
}

function formatAxisNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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

function projectRotatedPoint(rotated: Point3D, plot: Rect, scale: number): ProjectedPoint {
  const cameraDistance = 5.2;
  const perspective = cameraDistance / (cameraDistance - rotated.z);
  return {
    x: plot.x + plot.width * 0.5 + rotated.x * scale * perspective,
    y: plot.y + plot.height * 0.68 - rotated.y * scale * perspective,
    depth: rotated.z,
  };
}

function projectPoint(point: Point3D, camera: Camera, plot: Rect, scale: number): ProjectedPoint {
  return projectRotatedPoint(rotate(point, camera), plot, scale);
}

function createSurfaceVertex(point: Point3D, camera: Camera, plot: Rect, scale: number): SurfaceVertex {
  const rotated = rotate(point, camera);
  return {
    world: point,
    rotated,
    projected: projectRotatedPoint(rotated, plot, scale),
  };
}

function triangleArea2(a: ProjectedPoint, b: ProjectedPoint, c: ProjectedPoint): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function surfaceTriangleFacesCamera(a: SurfaceVertex, b: SurfaceVertex, c: SurfaceVertex): boolean {
  const ab = {
    x: b.rotated.x - a.rotated.x,
    y: b.rotated.y - a.rotated.y,
    z: b.rotated.z - a.rotated.z,
  };
  const ac = {
    x: c.rotated.x - a.rotated.x,
    y: c.rotated.y - a.rotated.y,
    z: c.rotated.z - a.rotated.z,
  };
  const normal = {
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  };
  return normal.z < 0;
}

function projectedTriangleIsReasonable(a: ProjectedPoint, b: ProjectedPoint, c: ProjectedPoint, plot: Rect): boolean {
  const area = Math.abs(triangleArea2(a, b, c));
  const maxArea = plot.width * plot.height * 0.42;
  return Number.isFinite(area) && area > 4 && area < maxArea;
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

    const scale = Math.min(plot.width, plot.height) * 0.41;
    this.draw3DAxes(plot, scale);
    this.draw3DBaseGrid(plot, scale);

    if (fillSurface) {
      const triangles: Array<{ depth: number; polygon: ProjectedPoint[]; values: [number, number, number] }> = [];
      const pushTriangle = (
        first: ParameterSurfacePoint,
        second: ParameterSurfacePoint,
        third: ParameterSurfacePoint,
      ): void => {
        const va = createSurfaceVertex(coords.get(first.runId)!, this.view.camera, plot, scale);
        const vb = createSurfaceVertex(coords.get(second.runId)!, this.view.camera, plot, scale);
        const vc = createSurfaceVertex(coords.get(third.runId)!, this.view.camera, plot, scale);
        if (!surfaceTriangleFacesCamera(va, vb, vc)) {
          return;
        }
        if (!projectedTriangleIsReasonable(va.projected, vb.projected, vc.projected, plot)) {
          return;
        }
        triangles.push({
          depth: (va.projected.depth + vb.projected.depth + vc.projected.depth) / 3,
          polygon: [va.projected, vb.projected, vc.projected],
          values: [first.zValue, second.zValue, third.zValue],
        });
      };
      for (let yIndex = 0; yIndex < yValues.length - 1; yIndex += 1) {
        for (let xIndex = 0; xIndex < xValues.length - 1; xIndex += 1) {
          const a = pointMap.get(`${String(xValues[xIndex])}::${String(yValues[yIndex])}`);
          const b = pointMap.get(`${String(xValues[xIndex + 1])}::${String(yValues[yIndex])}`);
          const c = pointMap.get(`${String(xValues[xIndex + 1])}::${String(yValues[yIndex + 1])}`);
          const d = pointMap.get(`${String(xValues[xIndex])}::${String(yValues[yIndex + 1])}`);
          if (a === undefined || b === undefined || c === undefined || d === undefined) {
            continue;
          }
          pushTriangle(a, b, c);
          pushTriangle(a, c, d);
        }
      }
      triangles.sort((left, right) => left.depth - right.depth);
      triangles.forEach((triangle) => {
        ctx.beginPath();
        ctx.moveTo(triangle.polygon[0]!.x, triangle.polygon[0]!.y);
        triangle.polygon.slice(1).forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.closePath();
        ctx.fillStyle = surfaceFillColorFromVertices(triangle.values, zRange.min, zRange.max);
        ctx.fill();
        ctx.strokeStyle = surfaceStrokeColorFromVertices(triangle.values, zRange.min, zRange.max);
        ctx.lineWidth = 0.35;
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
      const radius = point.runId === this.view.selectedRunId ? 3.2 : 1.9;
      const base = projectPoint(
        { ...coords.get(point.runId)!, y: -1.18 },
        this.view.camera,
        plot,
        scale,
      );
      ctx.strokeStyle = "rgba(24, 24, 27, 0.08)";
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(projected.x, projected.y);
      ctx.stroke();

      ctx.fillStyle = pointColor(point, this.view);
      ctx.strokeStyle = point.runId === this.view.selectedRunId ? THEME.highlight : "rgba(24, 24, 27, 0.12)";
      ctx.lineWidth = point.runId === this.view.selectedRunId ? 1.4 : 0.6;
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
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.fillText(`X ${this.view.dataset.spec.xParam}`, xAxis.x + 6, xAxis.y + 2);
    ctx.fillText(`Z ${this.view.dataset.spec.zMetric}`, yAxis.x + 6, yAxis.y - 4);
    ctx.fillText(`Y ${this.view.dataset.spec.yParam}`, zAxis.x + 6, zAxis.y + 2);

    this.draw3DAxisTicks(plot, scale);
  }

  private draw3DAxisTicks(plot: Rect, scale: number): void {
    const ctx = this.context;
    const { dataset } = this.view;
    const xValues = dataset.xValues;
    const yValues = dataset.yValues;
    const zRange = dataset.zRange;
    if (xValues.length < 2 || yValues.length < 2 || zRange === null) {
      return;
    }

    ctx.strokeStyle = "rgba(24, 24, 27, 0.22)";
    ctx.fillStyle = THEME.muted;
    ctx.font = "9px ui-monospace, SFMono-Regular, Menlo, monospace";

    const xTickValues = [xValues[0]!, xValues[Math.floor(xValues.length / 2)]!, xValues[xValues.length - 1]!];
    xTickValues.forEach((value, index) => {
      const t = index / Math.max(xTickValues.length - 1, 1);
      const anchor = projectPoint({ x: -1 + t * 2, y: -1.18, z: -1.15 }, this.view.camera, plot, scale);
      const normal = projectPoint({ x: -1 + t * 2, y: -1.1, z: -1.15 }, this.view.camera, plot, scale);
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.lineTo(normal.x, normal.y);
      ctx.stroke();
      ctx.fillText(formatParam(value), normal.x + 4, normal.y + 8);
    });

    const yTickValues = [yValues[0]!, yValues[Math.floor(yValues.length / 2)]!, yValues[yValues.length - 1]!];
    yTickValues.forEach((value, index) => {
      const t = index / Math.max(yTickValues.length - 1, 1);
      const anchor = projectPoint({ x: -1.15, y: -1.18, z: -1 + t * 2 }, this.view.camera, plot, scale);
      const normal = projectPoint({ x: -1.07, y: -1.18, z: -1 + t * 2 }, this.view.camera, plot, scale);
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.lineTo(normal.x, normal.y);
      ctx.stroke();
      ctx.fillText(formatParam(value), normal.x + 4, normal.y + 8);
    });

    const zTickValues = [zRange.min, (zRange.min + zRange.max) / 2, zRange.max];
    zTickValues.forEach((value, index) => {
      const t = index / Math.max(zTickValues.length - 1, 1);
      const anchor = projectPoint({ x: -1.15, y: -1 + t * 2.3, z: -1.15 }, this.view.camera, plot, scale);
      const normal = projectPoint({ x: -1.05, y: -1 + t * 2.3, z: -1.15 }, this.view.camera, plot, scale);
      ctx.beginPath();
      ctx.moveTo(anchor.x, anchor.y);
      ctx.lineTo(normal.x, normal.y);
      ctx.stroke();
      ctx.fillText(formatAxisNumber(value), normal.x + 4, normal.y + 4);
    });
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
