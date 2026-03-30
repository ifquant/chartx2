export type PhaseOneStep = {
  id: string;
  title: string;
  status: "complete" | "active" | "queued";
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
    "createChartxPhaseOneChart exposes a narrow chart API with one primary series path plus a dedicated volume-series path",
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
      status: "complete",
      note: "Remove stale scaffolding and keep local-only tooling out of version control.",
    },
    {
      id: "02",
      title: "Engine Boundary",
      status: "complete",
      note: "Create a public chartx entrypoint and keep internals behind it from day one.",
    },
    {
      id: "03",
      title: "Typings And Helpers",
      status: "complete",
      note: "Migrate the smallest upstream helper subset needed for future model and scale work.",
    },
    {
      id: "04",
      title: "Model Core Scales Data",
      status: "complete",
      note: "Land the smallest range, scale, and data-store layer needed for later rendering work.",
    },
    {
      id: "05",
      title: "Renderers Views",
      status: "complete",
      note: "Render deterministic candle data through the first browser harness and keep it behind the chartx boundary.",
    },
    {
      id: "06",
      title: "Host Integration",
      status: "complete",
      note: "Mount the browser harness through the public chartx entrypoint and fail visibly if initialization breaks.",
    },
    {
      id: "07",
      title: "Unit And Visual Tests",
      status: "complete",
      note: "Pin model and scale behavior with unit tests, cover candlestick, bar, and line-series visual baselines, verify high-DPI and visible init-failure handling, and keep viewport snapshots stable.",
    },
    {
      id: "08",
      title: "Minimal Public API",
      status: "complete",
      note: "Expose the narrow create chart, add one candlestick, bar, or line series, and setData/update flows through the public boundary.",
    },
    {
      id: "09",
      title: "Parity Definition",
      status: "complete",
      note: "Write the pass/fail checklist for what lightweight-charts parity actually means in the current phase-one scope.",
    },
    {
      id: "10",
      title: "Layered Migration",
      status: "complete",
      note: "Migrate the phase-one floor in dependency order, validating each layer before widening the supported series and verification surface.",
    },
  ],
};

export function getEngineBoundarySummary(): EngineBoundarySummary {
  return boundarySummary;
}
