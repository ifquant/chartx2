export type ChartFrameTone = "default" | "accent" | "muted";

export interface ChartFrameToolModel {
  id: string;
  label: string;
  glyph: string;
  active?: boolean;
  disabled?: boolean;
}

export interface ChartFrameChipModel {
  id: string;
  label: string;
  tone?: ChartFrameTone;
}

export interface ChartFrameShellModel {
  title: string;
  statusLabel?: string;
  toolRailLabel?: string;
  tools: ChartFrameToolModel[];
  chips: ChartFrameChipModel[];
}
