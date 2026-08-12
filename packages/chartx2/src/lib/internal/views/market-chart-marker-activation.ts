import type { PhaseOneSeriesMarker } from "../../public/market";

export type MarkerActivationTarget = Readonly<{
  marker: PhaseOneSeriesMarker;
  inputIndex: number;
  centerX: number;
  centerY: number;
}>;

export type MarkerPointerCycle = Readonly<{
  signature: string;
  nextIndex: number;
}>;

/** Pointer candidates are deterministic: nearest target, later draw order,
 * then stable marker identity. The returned cycle is reusable only while the
 * caller's pointer/model/data/generation signature remains unchanged. */
export function resolvePointerMarkerActivation(
  targets: readonly MarkerActivationTarget[],
  pointer: Readonly<{ x: number; y: number }>,
  signature: string,
  previous: MarkerPointerCycle | null,
): Readonly<{ target: MarkerActivationTarget | null; cycle: MarkerPointerCycle | null }> {
  const candidates = targets
    .map((target) => ({ target, distance: Math.hypot(target.centerX - pointer.x, target.centerY - pointer.y) }))
    .filter(({ distance }) => distance <= 12)
    .sort((left, right) => left.distance - right.distance || right.target.inputIndex - left.target.inputIndex || left.target.marker.markerId.localeCompare(right.target.marker.markerId));
  if (candidates.length === 0) return { target: null, cycle: null };
  const index = previous?.signature === signature ? previous.nextIndex % candidates.length : 0;
  return { target: candidates[index]!.target, cycle: { signature, nextIndex: index + 1 } };
}

/** Keyboard order is chronological first and original model input order second. */
export function orderedKeyboardMarkerTargets(markers: readonly PhaseOneSeriesMarker[]): readonly PhaseOneSeriesMarker[] {
  return markers.map((marker, inputIndex) => ({ marker, inputIndex }))
    .sort((left, right) => left.marker.time - right.marker.time || left.inputIndex - right.inputIndex)
    .map(({ marker }) => marker);
}

export function moveKeyboardMarker(
  ordered: readonly PhaseOneSeriesMarker[],
  currentMarkerId: string | null,
  key: "ArrowLeft" | "ArrowRight" | "ArrowUp" | "ArrowDown" | "Home" | "End",
): PhaseOneSeriesMarker | null {
  if (ordered.length === 0) return null;
  const currentIndex = Math.max(0, ordered.findIndex((marker) => marker.markerId === currentMarkerId));
  if (key === "Home") return ordered[0]!;
  if (key === "End") return ordered.at(-1)!;
  if (key === "ArrowLeft") return ordered[Math.max(0, currentIndex - 1)]!;
  if (key === "ArrowRight") return ordered[Math.min(ordered.length - 1, currentIndex + 1)]!;
  const current = ordered[currentIndex]!;
  const overlap = ordered.filter((marker) => marker.time === current.time);
  const overlapIndex = overlap.findIndex((marker) => marker.markerId === current.markerId);
  return key === "ArrowUp"
    ? overlap[Math.max(0, overlapIndex - 1)]!
    : overlap[Math.min(overlap.length - 1, overlapIndex + 1)]!;
}
