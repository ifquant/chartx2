type FormatterOptions = {
  valueFormatter?: ((value: number) => string) | null;
};

type MarkerLike = {
  time: number;
  position: string;
  shape: string;
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
    markers: readonly MarkerLike[];
  },
  markers: readonly unknown[],
  deps: {
    normalizeMarkers(markers: readonly unknown[]): readonly MarkerLike[];
    render(): void;
  },
): void {
  state.markers = deps.normalizeMarkers(markers);
  deps.render();
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
