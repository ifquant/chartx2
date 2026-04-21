import { formatSeriesReadoutValue as formatSeriesReadoutValueUseCase } from "./chart-series-presentation";
import type {
  PhaseOneReadoutBody,
  PhaseOneReadoutDetail,
} from "./chart-api-types";

type ReadoutState = {
  kind: string;
  options: {
    valueFormatter?: ((value: number) => string) | null;
  };
};

export function formatReadoutDetail(
  readout: PhaseOneReadoutBody,
  deps: {
    formatTime(value: number): string;
    formatPrice(value: number): string;
  },
): PhaseOneReadoutDetail {
  return {
    ...readout,
    formatted: {
      time: readout.time === null ? "--" : deps.formatTime(readout.time),
      open: readout.open === null ? "--" : deps.formatPrice(readout.open),
      high: readout.high === null ? "--" : deps.formatPrice(readout.high),
      low: readout.low === null ? "--" : deps.formatPrice(readout.low),
      close: readout.close === null ? "--" : deps.formatPrice(readout.close),
      price: readout.price === null ? "--" : deps.formatPrice(readout.price),
    },
  };
}

export function formatSeriesReadoutValue(
  state: ReadoutState,
  value: number | null,
  deps: {
    formatPrice(value: number): string;
    formatVolume(value: number): string;
  },
): string {
  return formatSeriesReadoutValueUseCase(state, value, deps);
}
