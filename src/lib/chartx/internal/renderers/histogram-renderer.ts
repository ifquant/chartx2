import type { Coordinate } from "../model";

export type HistogramItem = {
  x: Coordinate;
  valueY: Coordinate;
  baseY: Coordinate;
  isUp: boolean;
  color?: string;
};

export type HistogramRendererData = {
  items: HistogramItem[];
  barWidth: number;
  upColor: string;
  downColor: string;
};

export class HistogramRenderer {
  public draw(context: CanvasRenderingContext2D, data: HistogramRendererData): void {
    const bodyWidth = Math.max(2, Math.floor(data.barWidth));

    for (const item of data.items) {
      const color = item.color ?? (item.isUp ? data.upColor : data.downColor);
      const top = Math.min(item.valueY, item.baseY);
      const bottom = Math.max(item.valueY, item.baseY);
      const height = Math.max(1, bottom - top);
      const x = Math.round(item.x - bodyWidth / 2);

      context.save();
      context.fillStyle = color;
      context.fillRect(x, Math.round(top), bodyWidth, Math.round(height));
      context.restore();
    }
  }
}
