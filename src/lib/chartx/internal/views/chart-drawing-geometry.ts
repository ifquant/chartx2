import { TimeScale, type Logical } from "../model";

type AxisBar = {
  time: number;
  index: number;
};

export function resolveDrawingTimeCoordinate(
  time: number,
  axisBars: readonly AxisBar[],
  timeScale: TimeScale,
): number {
  if (axisBars.length === 0) {
    return 0;
  }
  if (time <= axisBars[0]!.time) {
    return timeScale.indexToCoordinate(axisBars[0]!.index as never);
  }
  if (time >= axisBars[axisBars.length - 1]!.time) {
    return timeScale.indexToCoordinate(axisBars[axisBars.length - 1]!.index as never);
  }

  for (let index = 1; index < axisBars.length; index += 1) {
    const previous = axisBars[index - 1]!;
    const next = axisBars[index]!;
    if (time <= next.time) {
      if (next.time === previous.time) {
        return timeScale.indexToCoordinate(previous.index as never);
      }
      const ratio = (time - previous.time) / (next.time - previous.time);
      const logical = previous.index + (next.index - previous.index) * ratio;
      return timeScale.logicalToCoordinate(logical as Logical);
    }
  }

  return timeScale.indexToCoordinate(axisBars[axisBars.length - 1]!.index as never);
}

export function distanceToLineSegment(
  pointX: number,
  pointY: number,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): number {
  const dx = endX - startX;
  const dy = endY - startY;
  if (dx === 0 && dy === 0) {
    return Math.hypot(pointX - startX, pointY - startY);
  }

  const t = clamp(((pointX - startX) * dx + (pointY - startY) * dy) / (dx * dx + dy * dy), 0, 1);
  const projectionX = startX + dx * t;
  const projectionY = startY + dy * t;
  return Math.hypot(pointX - projectionX, pointY - projectionY);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
