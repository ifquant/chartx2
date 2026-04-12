export type ChartTemplateV1<TChartState> = {
  kind: "chart-template";
  version: 1;
  chart: TChartState;
};

export type VersionedChartTemplateInput<TChartState> = ChartTemplateV1<TChartState> | TChartState;

export function createVersionedChartTemplate<TChartState>(
  chart: TChartState,
): ChartTemplateV1<TChartState> {
  return {
    kind: "chart-template",
    version: 1,
    chart,
  };
}

export function normalizeVersionedChartTemplate<TChartState>(
  input: VersionedChartTemplateInput<TChartState>,
): ChartTemplateV1<TChartState> {
  if (isChartTemplateV1(input)) {
    return input;
  }

  return createVersionedChartTemplate(input);
}

function isChartTemplateV1<TChartState>(
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

  if (input.version !== 1) {
    throw new Error(`chartx chart template version ${String(input.version)} is not supported`);
  }

  return true;
}
