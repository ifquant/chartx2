type RenderSurfaceCanvas = {
  width: number;
  height: number;
  style: {
    width: string;
    height: string;
  };
};

type RenderSurfaceContext = {
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  scale(x: number, y: number): void;
  clearRect(x: number, y: number, width: number, height: number): void;
  fillStyle: string | CanvasGradient | CanvasPattern;
  fillRect(x: number, y: number, width: number, height: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  strokeStyle: string | CanvasGradient | CanvasPattern;
  strokeRect(x: number, y: number, width: number, height: number): void;
};

type LayoutLike = {
  width: number;
  height: number;
  left: number;
  top: number;
};

export function prepareCanvasRenderSurface(
  params: {
    canvas: RenderSurfaceCanvas;
    context: RenderSurfaceContext;
    layout: LayoutLike;
    dpr: number;
    backgroundColor: string;
  },
): void {
  params.canvas.width = Math.round(params.layout.width * params.dpr);
  params.canvas.height = Math.round(params.layout.height * params.dpr);
  params.canvas.style.width = `${params.layout.width}px`;
  params.canvas.style.height = `${params.layout.height}px`;

  params.context.setTransform(1, 0, 0, 1, 0, 0);
  params.context.scale(params.dpr, params.dpr);
  params.context.clearRect(0, 0, params.layout.width, params.layout.height);
  params.context.fillStyle = params.backgroundColor;
  params.context.fillRect(0, 0, params.layout.width, params.layout.height);
}

export function renderEmptyPlotFrame(
  params: {
    context: RenderSurfaceContext;
    layout: Pick<LayoutLike, "left" | "top">;
    paneWidth: number;
    plotHeight: number;
    paneBackgroundColor: string;
    frameColor: string;
  },
): void {
  params.context.save();
  params.context.translate(params.layout.left, params.layout.top);
  params.context.fillStyle = params.paneBackgroundColor;
  params.context.fillRect(0, 0, params.paneWidth, params.plotHeight);
  params.context.strokeStyle = params.frameColor;
  params.context.strokeRect(0.5, 0.5, params.paneWidth - 1, params.plotHeight - 1);
  params.context.restore();
}
