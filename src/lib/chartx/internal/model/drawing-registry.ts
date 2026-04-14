export type DrawingDescriptor<Kind extends string, Api> = {
  id: string;
  kind: Kind;
  paneId: string;
  visible: boolean;
  api: Api;
};

export class DrawingRegistry<
  Kind extends string,
  Api,
  State extends DrawingDescriptor<Kind, Api>,
> {
  private readonly byId = new Map<string, State>();
  private readonly byApi = new Map<Api, string>();
  private readonly order: string[] = [];

  public register(drawing: State): void {
    if (this.byId.has(drawing.id)) {
      throw new Error(`drawing registry already contains id ${drawing.id}`);
    }
    if (this.byApi.has(drawing.api)) {
      throw new Error("drawing registry already contains the provided api handle");
    }
    this.byId.set(drawing.id, drawing);
    this.byApi.set(drawing.api, drawing.id);
    this.order.push(drawing.id);
  }

  public list(): readonly State[] {
    return this.order
      .map((id) => this.byId.get(id))
      .filter((drawing): drawing is State => drawing !== undefined);
  }

  public listByPane(paneId: string): readonly State[] {
    return this.list().filter((drawing) => drawing.paneId === paneId);
  }

  public getByApi(api: Api): State | undefined {
    const id = this.byApi.get(api);
    return id === undefined ? undefined : this.byId.get(id);
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
    const drawing = this.byId.get(id);
    this.byId.delete(id);
    return drawing;
  }

  public move(id: string, paneId: string): void {
    const drawing = this.byId.get(id);
    if (drawing === undefined) {
      throw new Error("drawing registry cannot move an unknown drawing");
    }
    drawing.paneId = paneId;
  }

  public setVisible(id: string, visible: boolean): void {
    const drawing = this.byId.get(id);
    if (drawing === undefined) {
      throw new Error("drawing registry cannot update visibility for an unknown drawing");
    }
    drawing.visible = visible;
  }
}
