export type WorkbenchIndicatorCatalogEntryId =
  | "moving-average"
  | "compare"
  | "overlay-line";

export type WorkbenchIndicatorPlacement = "overlay" | "separate-pane";

export interface WorkbenchIndicatorCatalogEntry {
  id: WorkbenchIndicatorCatalogEntryId;
  label: string;
  shortLabel: string;
  description: string;
  family: "trend" | "comparison" | "overlay";
  placement: WorkbenchIndicatorPlacement;
  engineKind: "moving-average" | "compare" | "overlay";
  enabled: boolean;
  unavailableReason?: string;
}

export const WORKBENCH_INDICATOR_CATALOG = [
  {
    id: "moving-average",
    label: "Moving Average",
    shortLabel: "MA",
    description: "Add a moving average study to a separate indicator pane.",
    family: "trend",
    placement: "separate-pane",
    engineKind: "moving-average",
    enabled: true,
  },
  {
    id: "compare",
    label: "Compare",
    shortLabel: "Compare",
    description: "Overlay a comparison series on the main chart.",
    family: "comparison",
    placement: "overlay",
    engineKind: "compare",
    enabled: true,
  },
  {
    id: "overlay-line",
    label: "Overlay Line",
    shortLabel: "Overlay",
    description: "Overlay a line series on the main chart.",
    family: "overlay",
    placement: "overlay",
    engineKind: "overlay",
    enabled: true,
  },
] as const satisfies readonly WorkbenchIndicatorCatalogEntry[];

export function getWorkbenchIndicatorCatalogEntry(
  id: string,
): WorkbenchIndicatorCatalogEntry | null {
  return WORKBENCH_INDICATOR_CATALOG.find((entry) => entry.id === id) ?? null;
}
