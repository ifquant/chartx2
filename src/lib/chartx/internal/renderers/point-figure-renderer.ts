import type { Coordinate } from "../model";

export type PointFigureItem = {
  x: Coordinate;
  openY: Coordinate;
  closeY: Coordinate;
  isUp: boolean;
};

export type PointFigureRendererData = {
  items: PointFigureItem[];
  barWidth: number;
  upColor: string;
  downColor: string;
};

export class PointFigureRenderer {
  public draw(
    context: CanvasRenderingContext2D,
    data: PointFigureRendererData,
  ): void {
    context.save();
    context.lineCap = "round";

    for (const item of data.items) {
      const top = Math.min(item.openY, item.closeY);
      const bottom = Math.max(item.openY, item.closeY);
      const centerY = (top + bottom) / 2;
      const cellHeight = Math.max(6, Math.abs(bottom - top));
      const size = Math.max(4, Math.min(10, Math.floor(Math.min(data.barWidth * 0.28, cellHeight * 0.42))));
      const half = size / 2;
      const x = Math.round(item.x) + 0.5;
      const y = Math.round(centerY) + 0.5;
      context.lineWidth = Math.max(1, Math.min(1.8, size / 7));

      if (item.isUp) {
        context.strokeStyle = data.upColor;
        context.beginPath();
        context.moveTo(x - half, y - half);
        context.lineTo(x + half, y + half);
        context.moveTo(x + half, y - half);
        context.lineTo(x - half, y + half);
        context.stroke();
        continue;
      }

      context.strokeStyle = data.downColor;
      context.beginPath();
      context.arc(x, y, half, 0, Math.PI * 2);
      context.stroke();
    }

    context.restore();
  }
}
