import type { Coordinate } from "../model";

export type LineItem = {
  x: Coordinate;
  y: Coordinate;
};

export type LineRendererData = {
  items: LineItem[];
  lineColor: string;
  lineWidth: number;
  mode?: "line" | "stepline";
  showMarkers?: boolean;
  markerRadius?: number;
};

export class LineRenderer {
  public draw(context: CanvasRenderingContext2D, data: LineRendererData): void {
    if (data.items.length === 0) {
      return;
    }

    context.save();
    const mode = data.mode ?? "line";
    if (data.items.length >= 2) {
      context.strokeStyle = data.lineColor;
      context.lineWidth = data.lineWidth;
      context.lineJoin = "round";
      context.lineCap = "round";
      context.beginPath();

      const [first, ...rest] = data.items;
      context.moveTo(first.x, first.y);

      if (mode === "stepline") {
        let previous = first;
        for (const item of rest) {
          context.lineTo(item.x, previous.y);
          context.lineTo(item.x, item.y);
          previous = item;
        }
      } else {
        for (const item of rest) {
          context.lineTo(item.x, item.y);
        }
      }

      context.stroke();
    }

    if (data.showMarkers) {
      const radius = data.markerRadius ?? Math.max(2, data.lineWidth + 1);
      context.fillStyle = data.lineColor;
      for (const item of data.items) {
        context.beginPath();
        context.arc(item.x, item.y, radius, 0, Math.PI * 2);
        context.fill();
      }
    }

    context.restore();
  }
}
