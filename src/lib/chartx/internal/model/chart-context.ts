import type { ChartBarSequence } from "./chart-bar-sequence";
import { createTimeBasedChartBarSequence } from "./chart-bar-sequence";

export interface ChartContextDescriptor {
  readonly symbol: string | null;
  readonly resolution: string | null;
  readonly session: string | null;
  readonly timezone: string | null;
}

export interface ChartContextState<TTime = unknown, TChartType = string> {
  readonly chartType: TChartType | null;
  readonly mainSourceId: string | null;
  readonly barSequence: ChartBarSequence<TTime>;
  readonly descriptor: ChartContextDescriptor;
}

export class ChartContext<TTime = unknown, TChartType = string> {
  private state: ChartContextState<TTime, TChartType> = {
    chartType: null,
    mainSourceId: null,
    barSequence: createTimeBasedChartBarSequence([]),
    descriptor: {
      symbol: null,
      resolution: null,
      session: null,
      timezone: null,
    },
  };

  public snapshot(): ChartContextState<TTime, TChartType> {
    return this.state;
  }

  public bindMainSource(
    mainSourceId: string,
    chartType: TChartType,
    barSequence: ChartBarSequence<TTime>,
  ): void {
    this.state = {
      chartType,
      mainSourceId,
      barSequence,
      descriptor: this.state.descriptor,
    };
  }

  public updateBarSequence(barSequence: ChartBarSequence<TTime>): void {
    this.state = {
      ...this.state,
      barSequence,
    };
  }

  public updateDescriptor(descriptor: Partial<ChartContextDescriptor>): void {
    this.state = {
      ...this.state,
      descriptor: {
        ...this.state.descriptor,
        ...descriptor,
      },
    };
  }

  public clearMainSource(): void {
    this.state = {
      chartType: null,
      mainSourceId: null,
      barSequence: createTimeBasedChartBarSequence([]),
      descriptor: this.state.descriptor,
    };
  }
}
