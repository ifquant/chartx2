import type { RunLocationIntent, StrategyRunSummary } from "./types";

export function createRunLocationIntent(
  run: StrategyRunSummary,
  sourceReportId: string,
): RunLocationIntent {
  return {
    kind: "locate-run",
    runId: run.runId,
    strategyId: run.strategyId,
    params: { ...run.params },
    sourceReportId,
  };
}
