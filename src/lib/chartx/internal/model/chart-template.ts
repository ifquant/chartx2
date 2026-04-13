export type ChartTemplateV1<TChartState> = {
  kind: "chart-template";
  version: 1;
  chart: TChartState;
};

export const LATEST_CHART_TEMPLATE_VERSION = 1 as const;

export type VersionedChartTemplateInput<TChartState> = ChartTemplateV1<TChartState> | TChartState;

export function createVersionedChartTemplate<TChartState>(
  chart: TChartState,
): ChartTemplateV1<TChartState> {
  return {
    kind: "chart-template",
    version: LATEST_CHART_TEMPLATE_VERSION,
    chart,
  };
}

export function normalizeVersionedChartTemplate<TChartState>(
  input: VersionedChartTemplateInput<TChartState>,
): ChartTemplateV1<TChartState> {
  if (!isVersionedChartTemplateInput(input)) {
    return createVersionedChartTemplate(input);
  }

  return migrateVersionedChartTemplateToLatest(input);
}

export function stringifyVersionedChartTemplate<TChartState>(
  input: VersionedChartTemplateInput<TChartState>,
): string {
  return JSON.stringify(normalizeVersionedChartTemplate(input), null, 2);
}

export function migrateVersionedChartTemplateToLatest<TChartState>(
  input: ChartTemplateV1<TChartState>,
): ChartTemplateV1<TChartState> {
  switch (input.version) {
    case 1:
      return input;
    default:
      throw new Error(
        `chartx chart template version ${String((input as { version: unknown }).version)} is not supported`,
      );
  }
}

function isVersionedChartTemplateInput<TChartState>(
  input: VersionedChartTemplateInput<TChartState>,
): input is ChartTemplateV1<TChartState> {
  if (typeof input !== "object" || input === null) {
    return false;
  }

  if (!("kind" in input) || !("version" in input)) {
    return false;
  }

  if (input.kind !== "chart-template") {
    return false;
  }

  return true;
}
