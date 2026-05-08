import type { Coordinate } from "../model";

export type AreaItem = {
  x: Coordinate;
  y: Coordinate;
};

export type AreaRendererData = {
  items: AreaItem[];
  lineColor: string;
  lineWidth: number;
  topColor: string;
  bottomColor: string;
  baseY: number;
};

export class AreaRenderer {
  public draw(context: CanvasRenderingContext2D, data: AreaRendererData): void {
    if (data.items.length < 2) {
      return;
    }

    const [first, ...rest] = data.items;
    const gradient = context.createLinearGradient(0, 0, 0, data.baseY);
    gradient.addColorStop(0, data.topColor);
    gradient.addColorStop(1, data.bottomColor);

    context.save();
    context.beginPath();
    context.moveTo(first.x, data.baseY);
    context.lineTo(first.x, first.y);

    for (const item of rest) {
      context.lineTo(item.x, item.y);
    }

    const last = data.items[data.items.length - 1];
    if (last === undefined) {
      context.restore();
      return;
    }

    context.lineTo(last.x, data.baseY);
    context.closePath();
    context.fillStyle = gradient;
    context.fill();

    context.strokeStyle = data.lineColor;
    context.lineWidth = data.lineWidth;
    context.lineJoin = "round";
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(first.x, first.y);
    for (const item of rest) {
      context.lineTo(item.x, item.y);
    }
    context.stroke();
    context.restore();
  }
}
