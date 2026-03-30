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
      title: "Typings And Helpers",
      status: "active",
      note: "Migrate the smallest upstream helper subset needed for future model and scale work.",
    },
    {
      id: "04",
      title: "Model Core Scales Data",
      status: "active",
      note: "Land the smallest range, scale, and data-store layer needed for later rendering work.",
    },
    {
      id: "05",
      title: "Renderers Views",
      status: "active",
      note: "Render deterministic candle data through the first browser harness and keep it behind the chartx boundary.",
    },
    {
      id: "06",
      title: "Host Integration",
      status: "active",
      note: "Mount the browser harness through the public chartx entrypoint and fail visibly if initialization breaks.",
    },
    {
      id: "07",
      title: "Parity Definition",
      status: "queued",
      note: "Write the pass/fail checklist for lightweight-charts phase-one parity.",
    },
    {
      id: "08",
      title: "Layered Migration",
      status: "queued",
      note: "Migrate upstream in dependency order, validating each layer before the next one.",
    },
  ],
};

export function getEngineBoundarySummary(): EngineBoundarySummary {
  return boundarySummary;
}
