import type {
  PhaseOnePriceLineApi,
  PhaseOnePriceLineOptions,
} from "./chart-harness";

export type PriceLineState = {
  id: string;
  price: number;
  color: string;
  lineWidth: number;
  title: string;
};

type RequiredPriceLineOptions = {
  price: number;
  color: string;
  lineWidth: number;
  title: string;
};

type SharedPriceLineDeps = {
  getLineId(line: PhaseOnePriceLineApi): string | undefined;
  render(): void;
};

export function createPriceLineState(
  ordinal: number,
  options: PhaseOnePriceLineOptions | undefined,
  deps: {
    defaultOptions: RequiredPriceLineOptions;
  },
): PriceLineState {
  return {
    id: `price-line-${ordinal}`,
    price: options?.price ?? deps.defaultOptions.price,
    color: options?.color ?? deps.defaultOptions.color,
    lineWidth: Math.max(1, options?.lineWidth ?? deps.defaultOptions.lineWidth),
    title: options?.title ?? `Line ${ordinal}`,
  };
}

export function createPriceLineApi(
  lines: Map<string, PriceLineState>,
  lineState: PriceLineState,
  deps: SharedPriceLineDeps & {
    setLineId(line: PhaseOnePriceLineApi, lineId: string): void;
  },
): PhaseOnePriceLineApi {
  const api: PhaseOnePriceLineApi = {
    applyOptions: (options) => {
      assertPriceLineActive(lines, api, deps);
      const line = lines.get(lineState.id);
      if (line === undefined) {
        throw new Error("chartx phase-one price line has been removed");
      }
      if (options.price !== undefined) {
        line.price = options.price;
      }
      if (options.color !== undefined) {
        line.color = options.color;
      }
      if (options.lineWidth !== undefined) {
        line.lineWidth = Math.max(1, options.lineWidth);
      }
      if (options.title !== undefined) {
        line.title = options.title;
      }
      deps.render();
    },
    remove: () => {
      removePriceLineFromMap(lines, api, deps);
    },
  };

  deps.setLineId(api, lineState.id);
  lines.set(lineState.id, lineState);
  return api;
}

export function removePriceLineFromMap(
  lines: Map<string, PriceLineState>,
  line: PhaseOnePriceLineApi,
  deps: SharedPriceLineDeps,
): void {
  const lineId = deps.getLineId(line);
  if (lineId === undefined || !lines.has(lineId)) {
    throw new Error("chartx phase-one price line has been removed");
  }

  lines.delete(lineId);
  deps.render();
}

export function assertPriceLineActive(
  lines: Map<string, PriceLineState>,
  line: PhaseOnePriceLineApi,
  deps: Pick<SharedPriceLineDeps, "getLineId">,
): void {
  const lineId = deps.getLineId(line);
  if (lineId === undefined || !lines.has(lineId)) {
    throw new Error("chartx phase-one price line has been removed");
  }
}
