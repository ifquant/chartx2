import { ChartContext } from "./chart-context";
import type { ChartBarSequence } from "./chart-bar-sequence";
import { PaneCollection } from "./pane-model";
import { PriceScale } from "./price-scale";
import { SourceRegistry } from "./source-registry";
import type { SourceDescriptor } from "./source-registry";

type SourceWithRole<
  State,
  Role extends "main-series" | "study",
> = State extends { role: infer CurrentRole }
  ? Role extends CurrentRole
    ? State & { role: Role }
    : never
  : never;

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

  public listSources(): readonly State[] {
    return this.sourceRegistry.list();
  }

  public listSourcesByPane(paneId: string): readonly State[] {
    return this.sourceRegistry.listByPane(paneId);
  }

  public listSourcesByRole<Role extends State["role"]>(
    role: Role,
  ): readonly SourceWithRole<State, Role>[] {
    return this.sourceRegistry.listByRole(role);
  }

  public registerSource(source: State): void {
    this.sourceRegistry.register(source);
  }

  public removeSourceByApi(api: Api): State | undefined {
    const removed = this.sourceRegistry.removeByApi(api);
    if (removed?.role === "main-series") {
      this.chartContext.clearMainSource();
    }
    return removed;
  }

  public getSourceByApiOrThrow(api: Api, message: string): State {
    return this.sourceRegistry.getByApiOrThrow(api, message);
  }

  public getSourceByIdAndRole<Role extends State["role"]>(
    id: string,
    role: Role,
  ): SourceWithRole<State, Role> | undefined {
    return this.sourceRegistry.getByIdAndRole(id, role);
  }

  public listSourcesByPaneAndRole<Role extends State["role"]>(
    paneId: string,
    role: Role,
  ): readonly SourceWithRole<State, Role>[] {
    return this.sourceRegistry.listByPaneAndRole(paneId, role);
  }

  public removeSourcesWhere(predicate: (source: State) => boolean): readonly State[] {
    const removed: State[] = [];
    for (const source of this.sourceRegistry.list()) {
      if (!predicate(source)) {
        continue;
      }
      const nextRemoved = this.removeSourceByApi(source.api);
      if (nextRemoved !== undefined) {
        removed.push(nextRemoved);
      }
    }
    return removed;
  }

  public context(): ChartContext<number, ChartType> {
    return this.chartContext;
  }

  public bindMainSource(
    mainSourceId: string,
    chartType: ChartType,
    barSequence: ChartBarSequence<number>,
  ): void {
    this.chartContext.bindMainSource(mainSourceId, chartType, barSequence);
  }

  public clearMainSource(): void {
    this.chartContext.clearMainSource();
  }

  public mainSourceId(): string | null {
    return this.chartContext.snapshot().mainSourceId;
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
