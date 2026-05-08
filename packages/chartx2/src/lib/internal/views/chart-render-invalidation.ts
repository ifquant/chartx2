type CanvasLike = HTMLCanvasElement;

export function createChartRenderInvalidation(deps: {
  getCanvas(): CanvasLike | null;
  renderCanvas(canvas: CanvasLike): void;
}) {
  return {
    renderIfAttached(): void {
      const canvas = deps.getCanvas();
      if (canvas === null) {
        return;
      }
      deps.renderCanvas(canvas);
    },
  };
}
