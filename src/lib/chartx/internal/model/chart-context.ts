import type { ChartBarSequence } from "./chart-bar-sequence";
import { createTimeBasedChartBarSequence } from "./chart-bar-sequence";

export interface ChartContextState<TTime = unknown, TChartType = string> {
  readonly chartType: TChartType | null;
  readonly mainSourceId: string | null;
  readonly barSequence: ChartBarSequence<TTime>;
}

export class ChartContext<TTime = unknown, TChartType = string> {
  private state: ChartContextState<TTime, TChartType> = {
    chartType: null,
    mainSourceId: null,
    barSequence: createTimeBasedChartBarSequence([]),
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
    };
  }

  public updateBarSequence(barSequence: ChartBarSequence<TTime>): void {
    this.state = {
      ...this.state,
      barSequence,
    };
  }

  public clearMainSource(): void {
    this.state = {
      chartType: null,
      mainSourceId: null,
      barSequence: createTimeBasedChartBarSequence([]),
    };
  }
}
