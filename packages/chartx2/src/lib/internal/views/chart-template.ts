import {
  createVersionedChartTemplate,
  normalizeVersionedChartTemplate,
  type ChartTemplateV1,
  type VersionedChartTemplateInput,
} from "../model";

export function createChartTemplate<TChartState>(chart: TChartState): ChartTemplateV1<TChartState> {
  return createVersionedChartTemplate(chart);
}

export function normalizeChartTemplate<TChartState>(
  input: VersionedChartTemplateInput<TChartState>,
): ChartTemplateV1<TChartState> {
  return normalizeVersionedChartTemplate(input);
}

export function applyChartTemplate<TChartState>(
  input: VersionedChartTemplateInput<TChartState>,
  deps: {
    normalize(input: VersionedChartTemplateInput<TChartState>): ChartTemplateV1<TChartState>;
    applyChartState(state: TChartState): void;
  },
): void {
  const normalized = deps.normalize(input);
  deps.applyChartState(normalized.chart);
}
