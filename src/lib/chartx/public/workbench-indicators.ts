import {
  getWorkbenchScriptDefinition,
  type WorkbenchScriptNumericInputDefinition,
} from "./workbench-scripts";

export type WorkbenchIndicatorCatalogEntryId =
  | "moving-average"
  | "compare"
  | "overlay-line"
  | "scripted-close-sma"
  | "scripted-hlc3-sma";

export type WorkbenchIndicatorPlacement = "overlay" | "separate-pane";

export interface WorkbenchIndicatorCatalogEntry {
  id: WorkbenchIndicatorCatalogEntryId;
  label: string;
  shortLabel: string;
  description: string;
  family: "trend" | "comparison" | "overlay" | "script";
  placement: WorkbenchIndicatorPlacement;
  engineKind: "moving-average" | "compare" | "overlay" | "script";
  enabled: boolean;
  unavailableReason?: string;
  scriptId?: string;
  scriptInputs?: readonly WorkbenchScriptNumericInputDefinition[];
}

function createScriptIndicatorCatalogEntry(input: {
  id: Extract<WorkbenchIndicatorCatalogEntryId, `scripted-${string}`>;
  scriptId: string;
  description: string;
}): WorkbenchIndicatorCatalogEntry {
  const definition = getWorkbenchScriptDefinition(input.scriptId);
  if (definition === null) {
    throw new Error(`Unknown scripted indicator definition ${input.scriptId}`);
  }

  return {
    id: input.id,
    label: definition.label,
    shortLabel: definition.shortLabel,
    description: input.description,
    family: "script",
    placement: definition.placement,
    engineKind: "script",
    enabled: true,
    scriptId: definition.id,
    scriptInputs: definition.inputs ?? [],
  };
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
  createScriptIndicatorCatalogEntry({
    id: "scripted-close-sma",
    scriptId: "close-sma-20-v0",
    description: "Execute a sandboxed close-price SMA script in a separate indicator pane.",
  }),
  createScriptIndicatorCatalogEntry({
    id: "scripted-hlc3-sma",
    scriptId: "hlc3-sma-10-v0",
    description: "Execute a sandboxed HLC3 SMA script in a separate indicator pane.",
  }),
] as const satisfies readonly WorkbenchIndicatorCatalogEntry[];

export function getWorkbenchIndicatorCatalogEntry(
  id: string,
): WorkbenchIndicatorCatalogEntry | null {
  return WORKBENCH_INDICATOR_CATALOG.find((entry) => entry.id === id) ?? null;
}
