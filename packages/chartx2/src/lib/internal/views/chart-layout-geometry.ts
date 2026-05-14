export type LayoutGeometry = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type PanePoint = {
  x: number;
  y: number;
};

type ManualLayout = Pick<LayoutGeometry, "width" | "height">;
type LayoutMeasureOptions = {
  fitContainerHeight?: boolean;
};

type PaneFrameLike = {
  top: number;
  height: number;
};

export function resolveActivePane<PaneType extends PaneFrameLike>(
  panes: readonly PaneType[],
  y: number,
): PaneType | null {
  return panes.find((pane) => y >= pane.top && y <= pane.top + pane.height) ?? null;
}

export function resolveLocalPanePoint(
  pane: Pick<PaneFrameLike, "top"> | null | undefined,
  point: PanePoint | null,
): PanePoint | null {
  if (pane === null || pane === undefined || point === null) {
    return null;
  }

  return {
    x: point.x,
    y: point.y - pane.top,
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateBaseBarSpacing(paneWidth: number, pointCount: number): number {
  return paneWidth / Math.max(pointCount + 2, 12);
}

export function resolveBarSpacing(
  currentSpacing: number | null,
  paneWidth: number,
  pointCount: number,
  bounds: {
    minBarSpacing: number;
    maxBarSpacing: number;
  },
): number {
  if (currentSpacing !== null) {
    return Math.max(bounds.minBarSpacing, currentSpacing);
  }

  return clamp(
    calculateBaseBarSpacing(paneWidth, pointCount),
    bounds.minBarSpacing,
    bounds.maxBarSpacing,
  );
}

export function measureLayout<LayoutType extends LayoutGeometry>(
  canvas: HTMLCanvasElement,
  defaultLayout: LayoutType,
  manualLayout: ManualLayout | null = null,
  options: LayoutMeasureOptions = {},
): LayoutType {
  if (manualLayout !== null) {
    return {
      ...defaultLayout,
      width: manualLayout.width,
      height: manualLayout.height,
    };
  }

  const container = canvas.parentElement;
  if (container === null) {
    return defaultLayout;
  }

  const styles = window.getComputedStyle(container);
  const horizontalPadding =
    parseFloat(styles.paddingLeft || "0") + parseFloat(styles.paddingRight || "0");
  const verticalPadding =
    parseFloat(styles.paddingTop || "0") + parseFloat(styles.paddingBottom || "0");
  const availableWidth = Math.floor(container.clientWidth - horizontalPadding);
  const availableHeight = Math.floor(container.clientHeight - verticalPadding);
  const width = Math.max(480, availableWidth);
  const aspectHeight = Math.round((width / defaultLayout.width) * defaultLayout.height);

  return {
    ...defaultLayout,
    width,
    height: Math.max(120, options.fitContainerHeight ? availableHeight : Math.max(320, aspectHeight)),
  };
}

export function resolvePanePoint(
  canvas: HTMLCanvasElement,
  event: Pick<MouseEvent, "clientX" | "clientY">,
  layout: LayoutGeometry,
): PanePoint | null {
  const rect = canvas.getBoundingClientRect();
  const localX = event.clientX - rect.left - layout.left;
  const localY = event.clientY - rect.top - layout.top;
  const paneWidth = layout.width - layout.left - layout.right;
  const paneHeight = layout.height - layout.top - layout.bottom;

  if (localX < 0 || localX > paneWidth || localY < 0 || localY > paneHeight) {
    return null;
  }

  return {
    x: clamp(localX, 0, paneWidth),
    y: clamp(localY, 0, paneHeight),
  };
}
