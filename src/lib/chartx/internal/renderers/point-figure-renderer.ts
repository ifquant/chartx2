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
    const size = Math.max(6, Math.floor(data.barWidth));
    const half = size / 2;

    context.save();
    context.lineWidth = Math.max(1.25, Math.floor(size / 5));
    context.lineCap = "round";

    for (const item of data.items) {
      const top = Math.min(item.openY, item.closeY);
      const bottom = Math.max(item.openY, item.closeY);
      const centerY = (top + bottom) / 2;
      const x = Math.round(item.x) + 0.5;
      const y = Math.round(centerY) + 0.5;

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
