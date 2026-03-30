import type { Coordinate } from "../model";

export type BarItem = {
  x: Coordinate;
  openY: Coordinate;
  highY: Coordinate;
  lowY: Coordinate;
  closeY: Coordinate;
  isUp: boolean;
};

export type BarRendererData = {
  items: BarItem[];
  barWidth: number;
  upColor: string;
  downColor: string;
};

export class BarRenderer {
  public draw(context: CanvasRenderingContext2D, data: BarRendererData): void {
    const tickWidth = Math.max(3, Math.floor(data.barWidth / 2));

    for (const item of data.items) {
      const color = item.isUp ? data.upColor : data.downColor;
      const x = Math.round(item.x) + 0.5;
      const openX = x - tickWidth;
      const closeX = x + tickWidth;

      context.save();
      context.strokeStyle = color;
      context.lineWidth = 1;

      context.beginPath();
      context.moveTo(x, Math.round(item.highY) + 0.5);
      context.lineTo(x, Math.round(item.lowY) + 0.5);
      context.moveTo(openX, Math.round(item.openY) + 0.5);
      context.lineTo(x, Math.round(item.openY) + 0.5);
      context.moveTo(x, Math.round(item.closeY) + 0.5);
      context.lineTo(closeX, Math.round(item.closeY) + 0.5);
      context.stroke();
      context.restore();
    }
  }
}
