/** Host-neutral visual contract shared by chart DOM and canvas renderers. */
export type ChartxThemeRevision = string | number;

export type ChartxVisualTheme = Readonly<{
  revision: ChartxThemeRevision;
  colors: Readonly<{
    surface: string; paneSurface: string; elevatedSurface: string; border: string;
    text: string; mutedText: string; grid: string; axisText: string;
    axisLabelBackground: string; axisLabelBorder: string; axisActiveBackground: string;
    axisActiveText: string; crosshair: string; focus: string; selection: string;
    paneLegendBackground: string; paneLegendBorder: string; paneLegendText: string;
    magnetTagBackground: string; magnetTagBorder: string; magnetTagText: string;
    defaultMarker: string;
    positive: string; negative: string; bid: string; ask: string;
    primarySeries: string; secondarySeries: string; warning: string; error: string; info: string;
  }>;
  typography: Readonly<{ uiFont: string; numericFont: string; fontSize: string }>;
  metrics: Readonly<{ controlHeight: string; rowHeight: string; radius: string }>;
}>;

export type ChartxMessages = Readonly<{
  noChartData: string; noOrdersOrTrades: string; noRowSelected: string; detail: string; last: string;
}>;

export const DEFAULT_CHARTX_MESSAGES: ChartxMessages = Object.freeze({
  noChartData: "No chart data", noOrdersOrTrades: "No orders or trades",
  noRowSelected: "No row selected", detail: "Detail", last: "Last",
});

export const DEFAULT_CHARTX_VISUAL_THEME: ChartxVisualTheme = Object.freeze({
  revision: 0,
  colors: Object.freeze({
    surface: "#fffdf7", paneSurface: "#fffaf0", elevatedSurface: "#ffffff",
    border: "rgba(16, 16, 16, 0.18)", text: "#101010", mutedText: "rgba(16, 16, 16, 0.72)",
    grid: "rgba(16, 16, 16, 0.08)", axisText: "rgba(16, 16, 16, 0.72)",
    axisLabelBackground: "rgba(255, 253, 247, 0.96)", axisLabelBorder: "rgba(16, 16, 16, 0.14)",
    axisActiveBackground: "#101010", axisActiveText: "#fffdf7", crosshair: "rgba(16, 16, 16, 0.5)",
    paneLegendBackground: "rgba(255, 253, 247, 0.92)", paneLegendBorder: "rgba(16, 16, 16, 0.12)",
    paneLegendText: "rgba(16, 16, 16, 0.78)", magnetTagBackground: "#3f6fd8",
    magnetTagBorder: "#3f6fd8", magnetTagText: "#fffdf7", defaultMarker: "#2563eb",
    focus: "#3f6fd8", selection: "rgba(63, 111, 216, 0.22)", positive: "#0c8f62",
    negative: "#c7543e", bid: "#2563eb", ask: "#d97706", primarySeries: "#3f6fd8",
    secondarySeries: "#d97706", warning: "#d97706", error: "#c7543e", info: "#3f6fd8",
  }),
  typography: Object.freeze({
    uiFont: "Inter, ui-sans-serif, system-ui, sans-serif",
    numericFont: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace", fontSize: "12px",
  }),
  metrics: Object.freeze({ controlHeight: "28px", rowHeight: "26px", radius: "4px" }),
});

export const CHARTX_VISUAL_CSS_VARIABLES = Object.freeze({
  surface: "--chartx-surface-canvas", paneSurface: "--chartx-surface-pane",
  elevatedSurface: "--chartx-surface-elevated", border: "--chartx-border",
  text: "--chartx-text-primary", mutedText: "--chartx-text-muted", grid: "--chartx-grid-major",
  axisText: "--chartx-axis-text", axisLabelBackground: "--chartx-axis-label-background",
  axisLabelBorder: "--chartx-axis-label-border", axisActiveBackground: "--chartx-axis-active-background",
  axisActiveText: "--chartx-axis-active-text", crosshair: "--chartx-crosshair", focus: "--chartx-focus",
  paneLegendBackground: "--chartx-pane-legend-background", paneLegendBorder: "--chartx-pane-legend-border",
  paneLegendText: "--chartx-pane-legend-text", magnetTagBackground: "--chartx-magnet-tag-background",
  magnetTagBorder: "--chartx-magnet-tag-border", magnetTagText: "--chartx-magnet-tag-text",
  defaultMarker: "--chartx-marker-default",
  selection: "--chartx-selection", positive: "--chartx-market-positive", negative: "--chartx-market-negative",
  bid: "--chartx-market-bid", ask: "--chartx-market-ask", primarySeries: "--chartx-series-primary",
  secondarySeries: "--chartx-series-secondary", warning: "--chartx-state-warning",
  error: "--chartx-state-error", info: "--chartx-state-info", uiFont: "--chartx-font-ui",
  numericFont: "--chartx-font-numeric", fontSize: "--chartx-font-size", controlHeight: "--chartx-control-height",
  rowHeight: "--chartx-row-height", radius: "--chartx-radius",
});

type StyleReader = Pick<CSSStyleDeclaration, "getPropertyValue">;
function read(style: StyleReader, name: string, fallback: string): string {
  const value = style.getPropertyValue(name).trim();
  return value === "" ? fallback : value;
}

/** Resolve at mount/revision boundaries only; frame and tick paths consume the cached object. */
export function resolveChartxVisualThemeFromStyle(style: StyleReader, revision: ChartxThemeRevision): ChartxVisualTheme {
  const base = DEFAULT_CHARTX_VISUAL_THEME;
  const v = CHARTX_VISUAL_CSS_VARIABLES;
  const colors = Object.fromEntries(
    (Object.keys(base.colors) as Array<keyof ChartxVisualTheme["colors"]>).map((key) => [key, read(style, v[key], base.colors[key])]),
  ) as unknown as ChartxVisualTheme["colors"];
  return Object.freeze({ revision, colors: Object.freeze(colors), typography: Object.freeze({
    uiFont: read(style, v.uiFont, base.typography.uiFont), numericFont: read(style, v.numericFont, base.typography.numericFont),
    fontSize: read(style, v.fontSize, base.typography.fontSize),
  }), metrics: Object.freeze({
    controlHeight: read(style, v.controlHeight, base.metrics.controlHeight), rowHeight: read(style, v.rowHeight, base.metrics.rowHeight),
    radius: read(style, v.radius, base.metrics.radius),
  }) });
}

export function resolveChartxVisualThemeFromElement(element: Element, revision: ChartxThemeRevision): ChartxVisualTheme {
  return resolveChartxVisualThemeFromStyle(getComputedStyle(element), revision);
}

/** Convert an explicit public theme into the same CSS roles consumed by chart DOM. */
export function chartxVisualThemeCssVariables(theme: ChartxVisualTheme): Readonly<Record<string, string>> {
  const variables: Record<string, string> = {};
  for (const key of Object.keys(theme.colors) as Array<keyof ChartxVisualTheme["colors"]>) {
    variables[CHARTX_VISUAL_CSS_VARIABLES[key]] = theme.colors[key];
  }
  for (const key of Object.keys(theme.typography) as Array<keyof ChartxVisualTheme["typography"]>) {
    variables[CHARTX_VISUAL_CSS_VARIABLES[key]] = theme.typography[key];
  }
  for (const key of Object.keys(theme.metrics) as Array<keyof ChartxVisualTheme["metrics"]>) {
    variables[CHARTX_VISUAL_CSS_VARIABLES[key]] = theme.metrics[key];
  }
  return Object.freeze(variables);
}

export function serializeChartxVisualThemeStyle(theme: ChartxVisualTheme): string {
  return Object.entries(chartxVisualThemeCssVariables(theme)).map(([name, value]) => `${name}: ${value}`).join("; ");
}

export function mergeChartxMessages(messages?: Partial<ChartxMessages>): ChartxMessages {
  return Object.freeze({ ...DEFAULT_CHARTX_MESSAGES, ...messages });
}

export type ChartxVisualProvider = Readonly<{ theme: ChartxVisualTheme; messages: ChartxMessages }>;
export function createChartxVisualProvider(input: { theme?: ChartxVisualTheme; messages?: Partial<ChartxMessages> } = {}): ChartxVisualProvider {
  return Object.freeze({ theme: input.theme ?? DEFAULT_CHARTX_VISUAL_THEME, messages: mergeChartxMessages(input.messages) });
}
