import { mainSeriesStyleSchemaSpec } from "../model";
import type {
  PhaseOneMainChartType,
  PhaseOneMainSeriesBuilder,
  PhaseOneMainSeriesInputCapability,
  PhaseOneMainSeriesRenderer,
  PhaseOneMainStyleSchemaId,
} from "../model";

import type {
  PhaseOnePaneSeriesState,
  PhaseOnePaneState,
} from "./chart-api-types";

type PaneLike = {
  id: string;
  kind: "primary" | "secondary";
  resizable: boolean;
};

type SourceLike = {
  id: string;
  label: string;
  kind: string;
  role: "main-series" | "study";
  studyKind?: "series" | "indicator" | "overlay" | "compare" | null;
  inputContext?: { mode: "chart-context" | "requested-context" };
  priceScaleId: string;
  inputCapability?: PhaseOneMainSeriesInputCapability | null;
  builder?: PhaseOneMainSeriesBuilder | null;
  renderer?: PhaseOneMainSeriesRenderer | null;
  chartType?: PhaseOneMainChartType | null;
  styleSchemaId?: PhaseOneMainStyleSchemaId;
  data: readonly unknown[];
};

export function buildPaneSeriesStates(
  sources: readonly SourceLike[],
): readonly PhaseOnePaneSeriesState[] {
  return sources.map((source): PhaseOnePaneSeriesState => {
    if (source.role === "main-series") {
      const styleSchemaId = source.styleSchemaId;
      if (styleSchemaId === undefined) {
        throw new Error("chartx pane state requires a style schema id for main-series sources");
      }
      const styleSchema = mainSeriesStyleSchemaSpec(styleSchemaId);
      return {
        id: source.id,
        label: source.label,
        kind: source.kind,
        chartType: source.chartType ?? null,
        sourceRole: source.role,
        studyKind: null,
        inputContextMode: null,
        priceScaleId: source.priceScaleId,
        inputCapability: source.inputCapability ?? null,
        builder: source.builder ?? null,
        renderer: source.renderer ?? null,
        styleSchemaId,
        styleOptionSurface: styleSchema.optionSurface,
        styleOptionKeys: styleSchema.optionKeys,
        styleTypeSpecificOptionKeys: styleSchema.typeSpecificOptionKeys,
        pointCount: source.data.length,
      };
    }

    return {
      id: source.id,
      label: source.label,
      kind: source.kind,
      chartType: null,
      sourceRole: source.role,
      studyKind: source.studyKind ?? null,
      inputContextMode: source.inputContext?.mode ?? null,
      priceScaleId: source.priceScaleId,
      inputCapability: null,
      builder: null,
      renderer: null,
      styleSchemaId: null,
      styleOptionSurface: null,
      styleOptionKeys: [],
      styleTypeSpecificOptionKeys: [],
      pointCount: source.data.length,
    };
  });
}

export function buildPaneState(
  paneId: string,
  deps: {
    getPaneById(paneId: string): PaneLike | undefined;
    getPaneIndex(paneId: string): number;
    getPaneHeight(paneId: string): number;
    getPaneSeriesStates(paneId: string): readonly PhaseOnePaneSeriesState[];
  },
): PhaseOnePaneState | null {
  const pane = deps.getPaneById(paneId);
  if (pane === undefined) {
    return null;
  }
  const series = deps.getPaneSeriesStates(paneId);
  const seriesKinds = series.map((item) => item.kind);
  return {
    paneIndex: deps.getPaneIndex(paneId),
    height: deps.getPaneHeight(paneId),
    isPrimary: pane.kind === "primary",
    resizable: pane.resizable,
    hasSeries: seriesKinds.length > 0,
    seriesCount: seriesKinds.length,
    seriesKinds,
    series,
  };
}

export function buildPaneStateSnapshot(
  paneIds: readonly string[],
  deps: {
    buildPaneState(paneId: string): PhaseOnePaneState | null;
  },
): readonly PhaseOnePaneState[] {
  return paneIds
    .map((paneId) => deps.buildPaneState(paneId))
    .filter((pane): pane is PhaseOnePaneState => pane !== null);
}
