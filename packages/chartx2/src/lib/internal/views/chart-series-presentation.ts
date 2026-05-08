type FormatterOptions = {
  valueFormatter?: ((value: number) => string) | null;
};

type MarkerPosition = "aboveBar" | "belowBar" | "inBar";
type MarkerShape = "circle" | "square" | "arrowUp" | "arrowDown";

type MarkerInput = {
  time: number;
  position?: MarkerPosition;
  shape?: MarkerShape;
  color?: string;
  text?: string;
};

export type SeriesMarkerState = {
  time: number;
  position: MarkerPosition;
  shape: MarkerShape;
  color: string;
  text: string;
};

type ReadoutState = {
  kind: string;
  options: FormatterOptions;
};

export function applySeriesFormatterOptions(
  seriesOptions: FormatterOptions,
  options: Partial<FormatterOptions>,
): void {
  if (options.valueFormatter !== undefined) {
    seriesOptions.valueFormatter = options.valueFormatter;
  }
}

export function setSeriesMarkers<State>(
  state: State & {
    markers: readonly SeriesMarkerState[];
  },
  markers: readonly MarkerInput[],
  deps: {
    normalizeMarkers(markers: readonly MarkerInput[]): readonly SeriesMarkerState[];
    render(): void;
  },
): void {
  state.markers = deps.normalizeMarkers(markers);
  deps.render();
}

export function normalizeSeriesMarkers(markers: readonly MarkerInput[]): readonly SeriesMarkerState[] {
  return markers.map((marker) => ({
    time: marker.time,
    position: marker.position ?? "aboveBar",
    shape: marker.shape ?? "circle",
    color: marker.color ?? "#2563eb",
    text: marker.text ?? "",
  })).sort((left, right) => left.time - right.time || left.text.localeCompare(right.text) || 0);
}

export function formatSeriesReadoutValue(
  state: ReadoutState,
  value: number | null,
  deps: {
    formatPrice(value: number): string;
    formatVolume(value: number): string;
  },
): string {
  if (value === null) {
    return "--";
  }
  const formatter = state.options.valueFormatter;
  if (formatter != null) {
    return formatter(value);
  }
  return state.kind === "volume"
    ? deps.formatVolume(value)
    : deps.formatPrice(value);
}
