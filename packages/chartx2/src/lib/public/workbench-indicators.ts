import {
  buildWorkbenchScriptLibrary,
  getWorkbenchScriptDefinition,
  getWorkbenchScriptDefinitionFromLibrary,
  type WorkbenchScriptDefinition,
  type WorkbenchScriptNumericInputDefinition,
} from "./workbench-scripts";

export type WorkbenchIndicatorCatalogEntryId = string;

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
  source?: "builtin" | "custom";
}

function createScriptIndicatorCatalogEntry(input: {
  id: string;
  scriptId: string;
  description: string;
  source?: "builtin" | "custom";
  library?: readonly WorkbenchScriptDefinition[];
}): WorkbenchIndicatorCatalogEntry {
  const definition =
    input.library === undefined
      ? getWorkbenchScriptDefinition(input.scriptId)
      : getWorkbenchScriptDefinitionFromLibrary(input.library, input.scriptId);
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
    source: input.source ?? (definition.source === "custom" ? "custom" : "builtin"),
  };
}

export const WORKBENCH_BUILTIN_INDICATOR_CATALOG = [
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
    source: "builtin",
  }),
  createScriptIndicatorCatalogEntry({
    id: "scripted-hlc3-sma",
    scriptId: "hlc3-sma-10-v0",
    description: "Execute a sandboxed HLC3 SMA script in a separate indicator pane.",
    source: "builtin",
  }),
] as const satisfies readonly WorkbenchIndicatorCatalogEntry[];

export const WORKBENCH_INDICATOR_CATALOG = WORKBENCH_BUILTIN_INDICATOR_CATALOG;

export function createWorkbenchIndicatorCatalog(
  customScripts: readonly WorkbenchScriptDefinition[] = [],
): readonly WorkbenchIndicatorCatalogEntry[] {
  if (customScripts.length === 0) {
    return WORKBENCH_BUILTIN_INDICATOR_CATALOG;
  }

  const customEntries = buildWorkbenchScriptLibrary(customScripts)
    .filter((definition) => definition.source === "custom")
    .map((definition) =>
      createScriptIndicatorCatalogEntry({
        id: `script-library:${definition.id}`,
        scriptId: definition.id,
        description: definition.description,
        source: "custom",
        library: customScripts,
      }),
    );

  return [...WORKBENCH_BUILTIN_INDICATOR_CATALOG, ...customEntries];
}

export function getWorkbenchIndicatorCatalogEntry(
  id: string,
  customScripts: readonly WorkbenchScriptDefinition[] = [],
): WorkbenchIndicatorCatalogEntry | null {
  return createWorkbenchIndicatorCatalog(customScripts).find((entry) => entry.id === id) ?? null;
}
