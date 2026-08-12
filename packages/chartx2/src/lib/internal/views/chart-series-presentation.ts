type FormatterOptions = {
  valueFormatter?: ((value: number) => string) | null;
};

type MarkerPosition = "aboveBar" | "belowBar" | "inBar";
type MarkerShape = "circle" | "square" | "arrowUp" | "arrowDown";
type MarkerFill = "solid" | "hollow";

type MarkerInput = {
  markerId: string;
  time: number;
  position?: MarkerPosition;
  shape?: MarkerShape;
  fill?: MarkerFill;
  color?: string;
  text?: string;
  tooltip?: string;
};

export type SeriesMarkerState = {
  markerId: string;
  time: number;
  position: MarkerPosition;
  shape: MarkerShape;
  fill?: MarkerFill;
  color: string;
  text: string;
  tooltip?: string;
  usesDefaultColor?: boolean;
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

export function normalizeSeriesMarkers(markers: readonly MarkerInput[], defaultColor: string): readonly SeriesMarkerState[] {
  return markers.map((marker, inputIndex) => {
    const normalized = {
      markerId: marker.markerId,
      time: marker.time,
      position: marker.position ?? "aboveBar",
      shape: marker.shape ?? "circle",
      ...(marker.fill === "hollow" ? { fill: marker.fill } : {}),
      color: marker.color ?? defaultColor,
      text: marker.text ?? "",
      usesDefaultColor: marker.color === undefined,
    };
    const tooltip = marker.tooltip?.trim();
    return { marker: tooltip === undefined || tooltip === "" ? normalized : { ...normalized, tooltip }, inputIndex };
  }).sort((left, right) => left.marker.time - right.marker.time || left.inputIndex - right.inputIndex)
    .map(({ marker }) => marker);
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
