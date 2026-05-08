import type { PhaseOneChartApi } from "./chart-api-types";
import {
  createChartPublicApi,
  type ChartHarnessPublicLike,
} from "./chart-public-api";
import { assertCanvasElement } from "./chart-dom-guards";

export function createAttachedChart<Harness extends {
  attach(canvas: HTMLCanvasElement): void;
  publicApiSurface(): ChartHarnessPublicLike;
}>(
  canvas: HTMLCanvasElement,
  createHarness: () => Harness,
): PhaseOneChartApi {
  assertCanvasElement(canvas);

  const harness = createHarness();
  harness.attach(canvas);

  return createChartPublicApi(harness.publicApiSurface());
}
