import {
  assertPriceLineActive as assertPriceLineActiveUseCase,
  createPriceLineApi as createPriceLineApiUseCase,
  createPriceLineState as createPriceLineStateUseCase,
  removePriceLineFromMap as removePriceLineFromMapUseCase,
  type PriceLineState,
} from "./chart-price-line-runtime";
import type {
  PhaseOnePriceLineApi,
  PhaseOnePriceLineOptions,
} from "./chart-api-types";

export type PriceLineManager = ReturnType<typeof createPriceLineManager>;

export function createPriceLineManager(deps: {
  defaultOptions: Required<PhaseOnePriceLineOptions>;
  render(): void;
}) {
  let nextPriceLineId = 1;
  const priceLineHandleIds = new WeakMap<PhaseOnePriceLineApi, string>();

  return {
    createState(options: PhaseOnePriceLineOptions = {}): PriceLineState {
      const ordinal = nextPriceLineId;
      nextPriceLineId += 1;
      return createPriceLineStateUseCase(ordinal, options, {
        defaultOptions: deps.defaultOptions,
      });
    },
    createApi(lines: Map<string, PriceLineState>, lineState: PriceLineState): PhaseOnePriceLineApi {
      return createPriceLineApiUseCase(lines, lineState, {
        setLineId: (line, lineId) => {
          priceLineHandleIds.set(line, lineId);
        },
        getLineId: (line) => priceLineHandleIds.get(line),
        render: deps.render,
      });
    },
    remove(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void {
      removePriceLineFromMapUseCase(lines, line, {
        getLineId: (nextLine) => priceLineHandleIds.get(nextLine),
        render: deps.render,
      });
    },
    assertActive(lines: Map<string, PriceLineState>, line: PhaseOnePriceLineApi): void {
      assertPriceLineActiveUseCase(lines, line, {
        getLineId: (nextLine) => priceLineHandleIds.get(nextLine),
      });
    },
  };
}
