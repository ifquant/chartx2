import type {
  PhaseOneDrawingPropertySchema,
  PhaseOneDrawingStateSnapshot,
} from "./market";

export type WorkbenchDrawingInspectorModel = {
  state: PhaseOneDrawingStateSnapshot;
  schema: PhaseOneDrawingPropertySchema;
} | null;

export { default as WorkbenchDrawingInspectorPanel } from "../ui/WorkbenchDrawingInspectorPanel.svelte";
