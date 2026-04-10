import type { Coordinate } from "../model";

export type CandlestickItem = {
  x: Coordinate;
  openY: Coordinate;
  highY: Coordinate;
  lowY: Coordinate;
  closeY: Coordinate;
  isUp: boolean;
};

export type CandlesticksRendererData = {
  items: CandlestickItem[];
  barWidth: number;
  upColor: string;
  downColor: string;
  wickColor: string;
  bodyMode?: "filled" | "hollow";
};

export class CandlesticksRenderer {
  public draw(
    context: CanvasRenderingContext2D,
    data: CandlesticksRendererData,
  ): void {
    const bodyWidth = Math.max(3, Math.floor(data.barWidth));
    const bodyMode = data.bodyMode ?? "filled";

    for (const item of data.items) {
      const color = item.isUp ? data.upColor : data.downColor;
      const bodyTop = Math.min(item.openY, item.closeY);
      const bodyBottom = Math.max(item.openY, item.closeY);
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);
      const x = Math.round(item.x);

      context.strokeStyle = data.wickColor;
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x + 0.5, Math.round(item.highY) + 0.5);
      context.lineTo(x + 0.5, Math.round(item.lowY) + 0.5);
      context.stroke();

      if (bodyMode === "hollow" && item.isUp) {
        context.strokeStyle = color;
        context.lineWidth = 1;
        context.strokeRect(
          Math.round(x - bodyWidth / 2) + 0.5,
          Math.round(bodyTop) + 0.5,
          Math.max(1, bodyWidth - 1),
          Math.max(1, Math.round(bodyHeight) - 1),
        );
      } else {
        context.fillStyle = color;
        context.fillRect(
          Math.round(x - bodyWidth / 2),
          Math.round(bodyTop),
          bodyWidth,
          Math.round(bodyHeight),
        );
      }
    }
  }
}
