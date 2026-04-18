import { ChartContext } from "./chart-context";
import { PaneCollection } from "./pane-model";
import { PriceScale } from "./price-scale";
import { SourceRegistry } from "./source-registry";
import type { SourceDescriptor } from "./source-registry";

export class ChartModel<
  Kind extends string,
  Api,
  State extends SourceDescriptor<Kind, Api>,
  ChartType extends string,
> {
  private readonly paneCollection = new PaneCollection();
  private readonly sourceRegistry = new SourceRegistry<Kind, Api, State>();
  private readonly chartContext = new ChartContext<number, ChartType>();
  private readonly primaryPriceScale = new PriceScale();
  private readonly secondaryPanePriceScales = new Map<string, PriceScale>();

  public panes(): PaneCollection {
    return this.paneCollection;
  }

  public sources(): SourceRegistry<Kind, Api, State> {
    return this.sourceRegistry;
  }

  public context(): ChartContext<number, ChartType> {
    return this.chartContext;
  }

  public primaryScale(): PriceScale {
    return this.primaryPriceScale;
  }

  public getSecondaryScale(paneId: string): PriceScale | undefined {
    return this.secondaryPanePriceScales.get(paneId);
  }

  public getOrCreateSecondaryScale(paneId: string): PriceScale {
    const existing = this.secondaryPanePriceScales.get(paneId);
    if (existing !== undefined) {
      return existing;
    }

    const scale = new PriceScale();
    this.secondaryPanePriceScales.set(paneId, scale);
    return scale;
  }

  public removeSecondaryScale(paneId: string): void {
    this.secondaryPanePriceScales.delete(paneId);
  }

  public secondaryScales(): readonly PriceScale[] {
    return Array.from(this.secondaryPanePriceScales.values());
  }
}
