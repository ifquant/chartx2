export function createChartAdapterStateOwner<PriceRange>() {
  let canvas: HTMLCanvasElement | null = null;
  let nextDrawingOrdinal = 1;
  let barSpacing: number | null = null;
  let rightOffset = 0;
  let timeAxisFormatter: ((time: number) => string) | null = null;
  let priceAxisFormatter: ((value: number) => string) | null = null;
  let primaryScaleSeriesOnly = false;
  let primaryPriceRangeOverride: PriceRange | null = null;

  return {
    canvas: () => canvas,
    setCanvas: (nextCanvas: HTMLCanvasElement | null) => {
      canvas = nextCanvas;
    },
    allocateDrawingOrdinal: () => {
      const ordinal = nextDrawingOrdinal;
      nextDrawingOrdinal += 1;
      return ordinal;
    },
    barSpacing: () => barSpacing,
    setBarSpacing: (value: number | null) => {
      barSpacing = value;
    },
    rightOffset: () => rightOffset,
    setRightOffset: (value: number) => {
      rightOffset = value;
    },
    resetViewport: (defaultRightOffset: number) => {
      barSpacing = null;
      rightOffset = defaultRightOffset;
    },
    timeAxisFormatter: () => timeAxisFormatter,
    setTimeAxisFormatter: (formatter: ((time: number) => string) | null) => {
      timeAxisFormatter = formatter;
    },
    priceAxisFormatter: () => priceAxisFormatter,
    setPriceAxisFormatter: (formatter: ((value: number) => string) | null) => {
      priceAxisFormatter = formatter;
    },
    primaryScaleSeriesOnly: () => primaryScaleSeriesOnly,
    setPrimaryScaleSeriesOnly: (value: boolean) => {
      primaryScaleSeriesOnly = value;
    },
    primaryPriceRangeOverride: () => primaryPriceRangeOverride,
    setPrimaryPriceRangeOverride: (range: PriceRange | null) => {
      primaryPriceRangeOverride = range;
    },
  };
}
