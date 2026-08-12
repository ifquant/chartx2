import type {
  PhaseOneMarkerGeometrySnapshot,
  PhaseOneSeriesMarkerGeometry,
} from "./chart-api-types";

function sameMarkerGeometry(
  left: readonly PhaseOneSeriesMarkerGeometry[],
  right: readonly PhaseOneSeriesMarkerGeometry[],
): boolean {
  return left.length === right.length && left.every((marker, index) => {
    const candidate = right[index];
    return candidate !== undefined
      && marker.markerId === candidate.markerId
      && marker.time === candidate.time
      && marker.paneId === candidate.paneId
      && marker.x === candidate.x
      && marker.y === candidate.y
      && marker.position === candidate.position;
  });
}

/** Owns the semantic render snapshot. Incidental renders such as crosshair
 * movement do not rotate revision when ordered marker geometry is unchanged. */
export function createChartMarkerGeometryOwner(deps: {
  emit(snapshot: PhaseOneMarkerGeometrySnapshot): void;
}) {
  let revision = 0;
  let current: readonly PhaseOneSeriesMarkerGeometry[] = [];

  return {
    publish(markers: readonly PhaseOneSeriesMarkerGeometry[]): void {
      if (sameMarkerGeometry(current, markers)) return;
      current = Object.freeze(markers.map((marker) => Object.freeze({ ...marker })));
      revision += 1;
      deps.emit(Object.freeze({ revision, markers: current }));
    },
  };
}
