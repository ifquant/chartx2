import { calculateChartPointCount } from "./chart-point-count";

type MainSequenceLike = {
  logicalLength: number;
};

type ContextSnapshotLike = {
  mainSourceId: string | null;
  barSequence: {
    bars: readonly { index: number }[];
  };
};

type SourceLike = Parameters<typeof calculateChartPointCount>[0]["sources"][number];

export function createChartRuntimeQueryOwner<Api>(deps: {
  buildMainBarSequence(): MainSequenceLike;
  getContextSnapshot(): ContextSnapshotLike;
  listSources(): readonly SourceLike[];
  hasSourceApi(api: Api): boolean;
}) {
  return {
    getPointCount(): number {
      const mainSequence = deps.buildMainBarSequence();
      const context = deps.getContextSnapshot();

      return calculateChartPointCount({
        mainSequenceLogicalLength: mainSequence.logicalLength,
        mainSourceId: context.mainSourceId,
        contextRows: context.barSequence.bars,
        sources: deps.listSources(),
      });
    },

    assertSeriesActive(series: Api): void {
      if (!deps.hasSourceApi(series)) {
        throw new Error("chartx phase-one series has been removed");
      }
    },
  };
}
