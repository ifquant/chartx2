import { createChartPublicSurfaceOwner } from "./chart-public-surface-owner";
import type { ChartHarnessPublicLike } from "./chart-public-api";

export function createChartPublicShellOwner(
  deps: Parameters<typeof createChartPublicSurfaceOwner>[0],
): {
  publicApiSurface(): ChartHarnessPublicLike;
} {
  const publicSurfaceOwner = createChartPublicSurfaceOwner(deps);

  return {
    publicApiSurface: () => publicSurfaceOwner.publicApiSurface(),
  };
}
