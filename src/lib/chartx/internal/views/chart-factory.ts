import type { PhaseOneChartApi } from "./chart-harness";
import { createChartPublicApi } from "./chart-public-api";
import { assertCanvasElement } from "./chart-dom-guards";

export function createAttachedChart<Harness extends {
  attach(canvas: HTMLCanvasElement): void;
}>(
  canvas: HTMLCanvasElement,
  createHarness: () => Harness,
): PhaseOneChartApi {
  assertCanvasElement(canvas);

  const harness = createHarness();
  harness.attach(canvas);

  return createChartPublicApi(harness as never);
}
