export type ChartSourceRole = "main-series" | "study";

type SourceWithRole<
  State,
  Role extends ChartSourceRole,
> = State extends { role: infer CurrentRole }
  ? Role extends CurrentRole
    ? State & { role: Role }
    : never
  : never;

export type SourceDescriptor<Kind extends string, Api> = {
  id: string;
  label: string;
  kind: Kind;
  role: ChartSourceRole;
  paneId: string;
  priceScaleId: string;
  visible: boolean;
  api: Api;
};

export class SourceRegistry<
  Kind extends string,
  Api,
  State extends SourceDescriptor<Kind, Api>,
> {
  private readonly byId = new Map<string, State>();
  private readonly byApi = new Map<Api, string>();
  private readonly order: string[] = [];

  public register(source: State): void {
    if (this.byId.has(source.id)) {
      throw new Error(`source registry already contains id ${source.id}`);
    }
    if (this.byApi.has(source.api)) {
      throw new Error(`source registry already contains the provided api handle`);
    }
    this.byId.set(source.id, source);
    this.byApi.set(source.api, source.id);
    this.order.push(source.id);
  }

  public list(): readonly State[] {
    return this.order
      .map((id) => this.byId.get(id))
      .filter((source): source is State => source !== undefined);
  }

  public listByPane(paneId: string): readonly State[] {
    return this.list().filter((source) => source.paneId === paneId);
  }

  public listByRole<Role extends State["role"]>(
    role: Role,
  ): readonly SourceWithRole<State, Role>[] {
    return this.list().filter((source): source is SourceWithRole<State, Role> => source.role === role);
  }

  public listByPaneAndRole<Role extends State["role"]>(
    paneId: string,
    role: Role,
  ): readonly SourceWithRole<State, Role>[] {
    return this.listByPane(paneId).filter((source): source is SourceWithRole<State, Role> => source.role === role);
  }

  public getById(id: string): State | undefined {
    return this.byId.get(id);
  }

  public getByIdAndRole<Role extends State["role"]>(
    id: string,
    role: Role,
  ): SourceWithRole<State, Role> | undefined {
    const source = this.byId.get(id);
    if (source === undefined || source.role !== role) {
      return undefined;
    }
    return source as SourceWithRole<State, Role>;
  }

  public getByApi(api: Api): State | undefined {
    const id = this.byApi.get(api);
    return id === undefined ? undefined : this.byId.get(id);
  }

  public getByApiOrThrow(api: Api, message: string): State {
    const source = this.getByApi(api);
    if (source === undefined) {
      throw new Error(message);
    }
    return source;
  }

  public hasApi(api: Api): boolean {
    return this.byApi.has(api);
  }

  public removeByApi(api: Api): State | undefined {
    const id = this.byApi.get(api);
    if (id === undefined) {
      return undefined;
    }
    this.byApi.delete(api);
    const index = this.order.indexOf(id);
    if (index !== -1) {
      this.order.splice(index, 1);
    }
    const source = this.byId.get(id);
    this.byId.delete(id);
    return source;
  }

  public move(id: string, paneId: string, priceScaleId?: string): void {
    const source = this.byId.get(id);
    if (source === undefined) {
      throw new Error("source registry cannot move an unknown source");
    }
    source.paneId = paneId;
    if (priceScaleId !== undefined) {
      source.priceScaleId = priceScaleId;
    }
  }

  public setVisible(id: string, visible: boolean): void {
    const source = this.byId.get(id);
    if (source === undefined) {
      throw new Error("source registry cannot update visibility for an unknown source");
    }
    source.visible = visible;
  }
}
