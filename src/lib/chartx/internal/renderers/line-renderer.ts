import type { Coordinate } from "../model";

export type LineItem = {
  x: Coordinate;
  y: Coordinate;
};

export type LineRendererData = {
  items: LineItem[];
  lineColor: string;
  lineWidth: number;
};

export class LineRenderer {
  public draw(context: CanvasRenderingContext2D, data: LineRendererData): void {
    if (data.items.length < 2) {
      return;
    }

    context.save();
    context.strokeStyle = data.lineColor;
    context.lineWidth = data.lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.beginPath();

    const [first, ...rest] = data.items;
    context.moveTo(first.x, first.y);

    for (const item of rest) {
      context.lineTo(item.x, item.y);
    }

    context.stroke();
    context.restore();
  }
}
