import type { Coordinate } from "../model";

export type KagiRendererItem = {
  x: Coordinate;
  openY: Coordinate;
  closeY: Coordinate;
  isYang: boolean;
};

export type KagiRendererData = {
  items: KagiRendererItem[];
  yangColor: string;
  yinColor: string;
  yangLineWidth: number;
  yinLineWidth: number;
};

export class KagiRenderer {
  public draw(context: CanvasRenderingContext2D, data: KagiRendererData): void {
    if (data.items.length === 0) {
      return;
    }

    context.save();
    context.lineCap = "round";
    context.lineJoin = "round";

    for (let index = 0; index < data.items.length; index += 1) {
      const item = data.items[index]!;
      const next = data.items[index + 1] ?? null;
      const x = Math.round(item.x) + 0.5;
      const openY = Math.round(item.openY) + 0.5;
      const closeY = Math.round(item.closeY) + 0.5;
      const segmentWidth = item.isYang ? data.yangLineWidth : data.yinLineWidth;

      context.strokeStyle = item.isYang ? data.yangColor : data.yinColor;
      context.globalAlpha = item.isYang ? 1 : 0.78;
      context.lineWidth = segmentWidth;
      context.beginPath();
      context.moveTo(x, openY);
      context.lineTo(x, closeY);
      context.stroke();

      if (next === null) {
        continue;
      }

      const nextX = Math.round(next.x) + 0.5;
      context.strokeStyle = next.isYang ? data.yangColor : data.yinColor;
      context.globalAlpha = next.isYang ? 1 : 0.78;
      context.lineWidth = next.isYang ? data.yangLineWidth : data.yinLineWidth;
      context.beginPath();
      context.moveTo(x, closeY);
      context.lineTo(nextX, closeY);
      context.stroke();
    }

    context.restore();
  }
}
