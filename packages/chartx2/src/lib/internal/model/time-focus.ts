import type {
  PhaseOneTimeFocusRequest,
  PhaseOneTimeFocusResult,
} from "../views/chart-api-types";

export type TimeAxisRow = Readonly<{ time: number; index: number }>;

export type TimeFocusResolution =
  | { result: PhaseOneTimeFocusResult; logicalRange: null }
  | {
      result: Extract<PhaseOneTimeFocusResult, { kind: "exact" | "nearest" }>;
      logicalRange: { from: number; to: number };
    };

const DEFAULT_PADDING_BEFORE_BARS = 8;
const DEFAULT_PADDING_AFTER_BARS = 8;

/**
 * Resolve a requested axis time without touching chart state.  Commands call this
 * before applying a viewport so every rejected result is naturally side-effect free.
 */
export function resolveTimeFocus(
  rows: readonly TimeAxisRow[],
  request: PhaseOneTimeFocusRequest,
): TimeFocusResolution {
  validateRequest(request);
  validateAxis(rows);

  if (rows.length === 0) {
    return { result: { kind: "noData", requestedTime: request.time }, logicalRange: null };
  }

  const first = rows[0]!;
  const last = rows[rows.length - 1]!;
  if (request.time < first.time) {
    return {
      result: { kind: "outOfDomain", requestedTime: request.time, reason: "beforeFirst" },
      logicalRange: null,
    };
  }
  if (request.time > last.time) {
    return {
      result: { kind: "outOfDomain", requestedTime: request.time, reason: "afterLast" },
      logicalRange: null,
    };
  }

  const insertion = lowerBound(rows, request.time);
  const exact = rows[insertion];
  const candidate = exact?.time === request.time
    ? exact
    : nearestEarlierOnTie(rows[insertion - 1]!, exact!, request.time);
  const distance = Math.abs(candidate.time - request.time);

  if (candidate.time !== request.time && distance > request.maxDistance) {
    return {
      result: { kind: "outOfDomain", requestedTime: request.time, reason: "maxDistanceExceeded" },
      logicalRange: null,
    };
  }

  if (equalTimeRunLength(rows, candidate.time) > 1) {
    return {
      result: { kind: "ambiguous", requestedTime: request.time, resolvedTime: candidate.time },
      logicalRange: null,
    };
  }

  const paddingBeforeBars = request.paddingBeforeBars ?? DEFAULT_PADDING_BEFORE_BARS;
  const paddingAfterBars = request.paddingAfterBars ?? DEFAULT_PADDING_AFTER_BARS;
  const logicalRange = {
    from: Math.max(first.index - 0.5, candidate.index - paddingBeforeBars - 0.5),
    to: Math.min(last.index + 0.5, candidate.index + paddingAfterBars + 0.5),
  };
  const result = candidate.time === request.time
    ? { kind: "exact" as const, requestedTime: request.time, resolvedTime: candidate.time, distance: 0 as const }
    : { kind: "nearest" as const, requestedTime: request.time, resolvedTime: candidate.time, distance };

  return { result, logicalRange };
}

function validateRequest(request: PhaseOneTimeFocusRequest): void {
  if (!Number.isFinite(request.time)) {
    throw new TypeError("chartx time focus requires a finite time");
  }
  if (!Number.isFinite(request.maxDistance)) {
    throw new TypeError("chartx time focus requires a finite maxDistance");
  }
  if (request.maxDistance < 0) {
    throw new RangeError("chartx time focus maxDistance must be non-negative");
  }
  for (const [name, value] of [
    ["paddingBeforeBars", request.paddingBeforeBars],
    ["paddingAfterBars", request.paddingAfterBars],
  ] as const) {
    if (value !== undefined && (!Number.isSafeInteger(value) || value < 0)) {
      throw new RangeError(`chartx time focus ${name} must be a non-negative safe integer`);
    }
  }
}

function validateAxis(rows: readonly TimeAxisRow[]): void {
  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]!;
    if (!Number.isFinite(row.time) || !Number.isFinite(row.index)) {
      throw new Error("chartx time focus invariant: axis rows require finite time and logical index");
    }
    const previous = rows[index - 1];
    if (previous !== undefined && row.index <= previous.index) {
      throw new Error("chartx time focus invariant: axis logical indices must strictly increase");
    }
    if (previous !== undefined && row.time < previous.time) {
      throw new Error("chartx time focus invariant: axis times must not decrease");
    }
  }
}

function lowerBound(rows: readonly TimeAxisRow[], time: number): number {
  let low = 0;
  let high = rows.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (rows[middle]!.time < time) low = middle + 1;
    else high = middle;
  }
  return low;
}

function nearestEarlierOnTie(lower: TimeAxisRow, upper: TimeAxisRow, requestedTime: number): TimeAxisRow {
  return upper.time - requestedTime < requestedTime - lower.time ? upper : lower;
}

function equalTimeRunLength(rows: readonly TimeAxisRow[], time: number): number {
  const start = lowerBound(rows, time);
  let end = start;
  while (end < rows.length && rows[end]!.time === time) end += 1;
  return end - start;
}
