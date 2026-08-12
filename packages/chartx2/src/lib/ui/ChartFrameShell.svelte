<script lang="ts">
  import type { ChartFrameChipModel, ChartFrameShellModel, ChartFrameToolModel } from "../public/chart-frame-surface";

  const EMPTY_MODEL: ChartFrameShellModel = {
    title: "Chart frame",
    statusLabel: "No chart metadata available.",
    toolRailLabel: "Chart tools",
    tools: [],
    chips: [],
  };

  export let model: ChartFrameShellModel = EMPTY_MODEL;
  export let onSelectTool: (toolId: string) => void | Promise<void> = () => {};
  export let onSelectChip: (chipId: string) => void | Promise<void> = () => {};

  function toolPressed(tool: ChartFrameToolModel): "true" | undefined {
    return tool.active ? "true" : undefined;
  }

  function chipClass(chip: ChartFrameChipModel): string | undefined {
    if (chip.tone === "accent") {
      return "accent";
    }
    if (chip.tone === "muted") {
      return "muted";
    }
    return undefined;
  }
</script>

<section class="chart-frame-shell" data-chart-frame-shell>
  <div class="tool-rail" aria-label={model.toolRailLabel ?? "Chart tools"}>
    {#each model.tools as tool}
      <button
        type="button"
        data-chart-frame-tool={tool.id}
        aria-label={`Chart tool: ${tool.label}`}
        aria-pressed={toolPressed(tool)}
        disabled={tool.disabled}
        class:active={tool.active}
        onclick={() => {
          void onSelectTool(tool.id);
        }}
      >
        {tool.glyph}
      </button>
    {/each}
  </div>

  <div class="frame-body">
    <div class="frame-head">
      <strong>{model.title}</strong>
      <div class="chips">
        {#each model.chips as chip}
          <button
            type="button"
            data-chart-frame-chip={chip.id}
            class={chipClass(chip)}
            onclick={() => {
              void onSelectChip(chip.id);
            }}
          >
            {chip.label}
          </button>
        {/each}
      </div>
      <span>{model.statusLabel ?? ""}</span>
    </div>

    <div class="frame-content">
      <slot />
    </div>
  </div>
</section>

<style>
  .chart-frame-shell {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-columns: 34px minmax(0, 1fr);
    border-right: 1px solid #8f9aa1;
    overflow: hidden;
    background: #fbfdfd;
  }

  .tool-rail {
    display: grid;
    grid-auto-rows: 30px;
    align-content: start;
    border-right: 1px solid #8f9aa1;
    background: #f2f5f6;
    overflow: hidden;
  }

  .tool-rail button {
    display: grid;
    place-items: center;
    border: 0;
    border-bottom: 1px solid #cbd4d8;
    background: transparent;
    color: #33434b;
    font: inherit;
    font-weight: 800;
    cursor: pointer;
  }

  .tool-rail button.active,
  .tool-rail button:hover:not(:disabled) {
    background: #e7f2f4;
    color: #0f5964;
  }

  .tool-rail button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .frame-body {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: 30px minmax(0, 1fr);
    overflow: hidden;
  }

  .frame-head {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 10px;
    padding: 0 8px;
    border-bottom: 1px solid #c3cdd2;
    background: #f8faf9;
    white-space: nowrap;
    overflow: hidden;
  }

  .frame-head strong,
  .frame-head > span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chips {
    display: flex;
    gap: 3px;
    overflow: hidden;
  }

  .chips button {
    height: 22px;
    padding: 4px 8px;
    border: 1px solid #c3cdd2;
    border-radius: 2px;
    background: #fff;
    font-weight: 700;
    white-space: nowrap;
  }

  .chips button.accent {
    border-color: #7db1b9;
    color: #0f5964;
    background: #eef6f7;
  }

  .chips button.muted {
    color: #5d737b;
    background: #f5f8f9;
  }

  .frame-content {
    min-height: 0;
    overflow: hidden;
    padding: 10px;
    background:
      linear-gradient(#eef2f4 1px, transparent 1px),
      linear-gradient(90deg, #eef2f4 1px, transparent 1px),
      #fbfdfd;
    background-size: 42px 34px;
  }
</style>
