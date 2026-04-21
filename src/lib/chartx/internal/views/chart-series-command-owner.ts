import type { PhaseOneMainChartType } from "../model";

import {
  addTargetedSeries,
  addTargetedStudy,
  addVolumeSeriesCommand,
} from "./chart-add-commands";
import {
  createCompareStudySeriesApi,
  createMovingAverageStudySeriesApi,
  createSecondaryAreaSeriesApi,
  createSecondaryBarSeriesApi,
  createSecondaryBaselineSeriesApi,
  createSecondaryCandlestickSeriesApi,
  createSecondaryHistogramSeriesApi,
  createSecondaryLineSeriesApi,
  createSecondaryVolumeSeriesApi,
} from "./chart-secondary-series-api";
import { removeSeriesCommand } from "./chart-structure-commands";
import type {
  PhaseOneAreaSeriesApi,
  PhaseOneBarSeriesApi,
  PhaseOneBaselineSeriesApi,
  PhaseOneCandlestickSeriesApi,
  PhaseOneCompareSeriesApi,
  PhaseOneHistogramSeriesApi,
  PhaseOneLineSeriesApi,
  PhaseOneMainSeriesApi,
  PhaseOneMovingAverageStudyApi,
  PhaseOneOverlaySeriesApi,
  PhaseOneSeriesTarget,
  PhaseOneVolumeSeriesApi,
  PhaseOneVolumeSeriesTarget,
} from "./chart-harness";

type ResolvedSeriesTarget = { kind: "primary" } | { kind: "secondary"; paneId: string };
type SecondarySeriesKind = "candlestick" | "line" | "area" | "baseline" | "bar" | "histogram" | "volume";

type SeriesApi =
  | PhaseOneCandlestickSeriesApi
  | PhaseOneBarSeriesApi
  | PhaseOneLineSeriesApi
  | PhaseOneAreaSeriesApi
  | PhaseOneBaselineSeriesApi
  | PhaseOneHistogramSeriesApi
  | PhaseOneVolumeSeriesApi;

type RemovedSource = {
  role: string;
};

export function createChartSeriesCommandOwner(deps: {
  resolveTarget(
    target: PhaseOneSeriesTarget | PhaseOneVolumeSeriesTarget | undefined,
    options: { defaultToSecondary: boolean; allowPrimary: boolean },
  ): ResolvedSeriesTarget;
  addPrimary(kind: PhaseOneMainChartType): PhaseOneMainSeriesApi;
  addSecondarySeries<Api>(params: {
    paneId: string;
    kind: SecondarySeriesKind;
    createApi(apiDeps: never): Api;
  }): Api;
  addLineStudySeries<Api>(
    paneId: string,
    studyKind: string,
    params: {
      indicator?: unknown;
      createApi(apiDeps: never): Api;
    },
  ): Api;
  getMovingAverageLength(): number;
  removeSourceByApi(series: SeriesApi): RemovedSource | undefined;
  resetPrimaryRangeOverride(): void;
  resetViewportState(): void;
  clearCrosshair(): void;
  render(): void;
}) {
  return {
    addCandlestickSeries(target?: PhaseOneSeriesTarget): PhaseOneCandlestickSeriesApi {
      return addTargetedSeries(target, {
        resolveTarget: deps.resolveTarget,
        addPrimary: () => deps.addPrimary("candlestick") as PhaseOneCandlestickSeriesApi,
        addSecondary: (paneId) =>
          deps.addSecondarySeries({
            paneId,
            kind: "candlestick",
            createApi: (apiDeps) => createSecondaryCandlestickSeriesApi(apiDeps),
          }),
      });
    },
    addLineSeries(target?: PhaseOneSeriesTarget): PhaseOneLineSeriesApi {
      return addTargetedSeries(target, {
        resolveTarget: deps.resolveTarget,
        addPrimary: () => deps.addPrimary("line") as PhaseOneLineSeriesApi,
        addSecondary: (paneId) =>
          deps.addLineStudySeries(paneId, "series", {
            createApi: (apiDeps) => createSecondaryLineSeriesApi(apiDeps),
          }),
      });
    },
    addAreaSeries(target?: PhaseOneSeriesTarget): PhaseOneAreaSeriesApi {
      return addTargetedSeries(target, {
        resolveTarget: deps.resolveTarget,
        addPrimary: () => deps.addPrimary("area") as PhaseOneAreaSeriesApi,
        addSecondary: (paneId) =>
          deps.addSecondarySeries({
            paneId,
            kind: "area",
            createApi: (apiDeps) => createSecondaryAreaSeriesApi(apiDeps),
          }),
      });
    },
    addBaselineSeries(target?: PhaseOneSeriesTarget): PhaseOneBaselineSeriesApi {
      return addTargetedSeries(target, {
        resolveTarget: deps.resolveTarget,
        addPrimary: () => deps.addPrimary("baseline") as PhaseOneBaselineSeriesApi,
        addSecondary: (paneId) =>
          deps.addSecondarySeries({
            paneId,
            kind: "baseline",
            createApi: (apiDeps) => createSecondaryBaselineSeriesApi(apiDeps),
          }),
      });
    },
    addBarSeries(target?: PhaseOneSeriesTarget): PhaseOneBarSeriesApi {
      return addTargetedSeries(target, {
        resolveTarget: deps.resolveTarget,
        addPrimary: () => deps.addPrimary("bar") as PhaseOneBarSeriesApi,
        addSecondary: (paneId) =>
          deps.addSecondarySeries({
            paneId,
            kind: "bar",
            createApi: (apiDeps) => createSecondaryBarSeriesApi(apiDeps),
          }),
      });
    },
    addHistogramSeries(target?: PhaseOneSeriesTarget): PhaseOneHistogramSeriesApi {
      return addTargetedSeries(target, {
        resolveTarget: deps.resolveTarget,
        addPrimary: () => deps.addPrimary("histogram") as PhaseOneHistogramSeriesApi,
        addSecondary: (paneId) =>
          deps.addSecondarySeries({
            paneId,
            kind: "histogram",
            createApi: (apiDeps) => createSecondaryHistogramSeriesApi(apiDeps),
          }),
      });
    },
    addVolumeSeries(target?: PhaseOneVolumeSeriesTarget): PhaseOneVolumeSeriesApi {
      return addVolumeSeriesCommand(target, {
        resolveTarget: deps.resolveTarget,
        addSecondary: (paneId) =>
          deps.addSecondarySeries({
            paneId,
            kind: "volume",
            createApi: (apiDeps) => createSecondaryVolumeSeriesApi(apiDeps),
          }),
      });
    },
    addOverlaySeries(target?: PhaseOneSeriesTarget): PhaseOneOverlaySeriesApi {
      return addTargetedStudy(target, {
        resolveTarget: deps.resolveTarget,
        addToPane: (paneId) => this.addOverlaySeriesToPane(paneId),
      }, {
        defaultToSecondary: false,
        allowPrimary: true,
      });
    },
    addOverlaySeriesToPane(paneId: string): PhaseOneOverlaySeriesApi {
      return deps.addLineStudySeries(paneId, "overlay", {
        createApi: (apiDeps) => createSecondaryLineSeriesApi(apiDeps),
      });
    },
    addCompareSeries(target?: PhaseOneSeriesTarget): PhaseOneCompareSeriesApi {
      return addTargetedStudy(target, {
        resolveTarget: deps.resolveTarget,
        addToPane: (paneId) => this.addCompareSeriesToPane(paneId),
      }, {
        defaultToSecondary: false,
        allowPrimary: true,
      });
    },
    addCompareSeriesToPane(paneId: string): PhaseOneCompareSeriesApi {
      return deps.addLineStudySeries(paneId, "compare", {
        createApi: (apiDeps) => createCompareStudySeriesApi(apiDeps),
      });
    },
    addMovingAverageStudy(target?: PhaseOneSeriesTarget): PhaseOneMovingAverageStudyApi {
      return addTargetedStudy(target, {
        resolveTarget: deps.resolveTarget,
        addToPane: (paneId) => this.addMovingAverageStudyToPane(paneId),
      }, {
        defaultToSecondary: true,
        allowPrimary: true,
      });
    },
    addMovingAverageStudyToPane(paneId: string): PhaseOneMovingAverageStudyApi {
      return deps.addLineStudySeries(paneId, "indicator", {
        indicator: {
          kind: "moving-average",
          length: deps.getMovingAverageLength(),
        },
        createApi: (apiDeps) => createMovingAverageStudySeriesApi(apiDeps),
      });
    },
    removeSeries(series: SeriesApi): void {
      removeSeriesCommand(series, {
        removeSourceByApi: deps.removeSourceByApi,
        resetPrimaryRangeOverride: deps.resetPrimaryRangeOverride,
        resetViewportState: deps.resetViewportState,
        clearCrosshair: deps.clearCrosshair,
        render: deps.render,
      });
    },
  };
}
