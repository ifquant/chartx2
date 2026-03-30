export type PhaseOneStep = {
  id: string;
  title: string;
  status: "active" | "queued";
  note: string;
};

export type EngineBoundarySummary = {
  publicSurface: string[];
  internalLayers: string[];
  forbiddenShortcuts: string[];
  phaseOneSteps: PhaseOneStep[];
};

const boundarySummary: EngineBoundarySummary = {
  publicSurface: [
    "src/lib/chartx/public",
    "host shell reads chartx only through public entrypoints",
  ],
  internalLayers: [
    "typings/helpers",
    "model core/scales/data",
    "renderers/views",
    "minimal chart API adapters",
  ],
  forbiddenShortcuts: [
    "src/routes importing engine internals directly",
    "Tauri commands reaching into renderer internals",
    "page-local chart state becoming the source of truth",
  ],
  phaseOneSteps: [
    {
      id: "01",
      title: "Repo Hygiene",
      status: "active",
      note: "Remove stale scaffolding and keep local-only tooling out of version control.",
    },
    {
      id: "02",
      title: "Engine Boundary",
      status: "active",
      note: "Create a public chartx entrypoint and keep internals behind it from day one.",
    },
    {
      id: "03",
      title: "Parity Definition",
      status: "queued",
      note: "Write the pass/fail checklist for lightweight-charts phase-one parity.",
    },
    {
      id: "04",
      title: "Layered Migration",
      status: "queued",
      note: "Migrate upstream in dependency order, validating each layer before the next one.",
    },
  ],
};

export function getEngineBoundarySummary(): EngineBoundarySummary {
  return boundarySummary;
}
