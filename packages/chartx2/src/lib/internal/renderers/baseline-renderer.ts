import type { Coordinate } from "../model";

export type BaselineItem = {
  x: Coordinate;
  y: Coordinate;
};

export type BaselineRendererData = {
  items: BaselineItem[];
  baseY: number;
  height: number;
  lineWidth: number;
  topLineColor: string;
  topFillTopColor: string;
  topFillBottomColor: string;
  bottomLineColor: string;
  bottomFillTopColor: string;
  bottomFillBottomColor: string;
};

export class BaselineRenderer {
  public draw(context: CanvasRenderingContext2D, data: BaselineRendererData): void {
    if (data.items.length < 2) {
      return;
    }

    const [first, ...rest] = data.items;
    const last = data.items[data.items.length - 1];
    if (last === undefined) {
      return;
    }

    const topGradient = context.createLinearGradient(0, 0, 0, data.baseY);
    topGradient.addColorStop(0, data.topFillTopColor);
    topGradient.addColorStop(1, data.topFillBottomColor);

    const bottomGradient = context.createLinearGradient(0, data.baseY, 0, data.height);
    bottomGradient.addColorStop(0, data.bottomFillTopColor);
    bottomGradient.addColorStop(1, data.bottomFillBottomColor);

    context.save();
    context.beginPath();
    context.moveTo(first.x, data.baseY);
    context.lineTo(first.x, first.y);
    for (const item of rest) {
      context.lineTo(item.x, item.y);
    }
    context.lineTo(last.x, data.baseY);
    context.closePath();
    context.clip();

    context.fillStyle = topGradient;
    context.fillRect(0, 0, Number.MAX_SAFE_INTEGER, data.baseY);

    context.fillStyle = bottomGradient;
    context.fillRect(0, data.baseY, Number.MAX_SAFE_INTEGER, data.height - data.baseY);
    context.restore();

    context.save();
    context.beginPath();
    context.rect(0, 0, Number.MAX_SAFE_INTEGER, data.baseY);
    context.clip();
    context.strokeStyle = data.topLineColor;
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

    context.save();
    context.beginPath();
    context.rect(0, data.baseY, Number.MAX_SAFE_INTEGER, Math.max(0, data.height - data.baseY));
    context.clip();
    context.strokeStyle = data.bottomLineColor;
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
