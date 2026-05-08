<script lang="ts">
  import type { DemoReplayState } from "$lib/demo/chartx-demo";

  export let model: DemoReplayState | undefined = undefined;
  export let onEnterReplay: () => void;
  export let onPlayReplay: () => void;
  export let onPauseReplay: () => void;
  export let onStepReplay: () => void;
  export let onExitReplay: () => void;
</script>

<section class="mini-card replay-card" data-replay-panel>
  <div class="sidebar-head">
    <h4>Replay</h4>
    <span>{model?.active ? "active" : "ready"}</span>
  </div>
  <div
    class="replay-summary"
    data-replay-active={model?.active ? "true" : "false"}
    data-replay-playing={model?.playing ? "true" : "false"}
    data-replay-current-step={String(model?.currentStep ?? 0)}
    data-replay-total-steps={String(model?.totalSteps ?? 0)}
  >
    <strong>{model?.currentTimeLabel ?? "--"}</strong>
    <span>{model?.currentStep ?? 0} / {model?.totalSteps ?? 0}</span>
    <span>{model?.startTimeLabel ?? "--"} → {model?.endTimeLabel ?? "--"}</span>
  </div>
  <div class="replay-controls">
    {#if !(model?.active ?? false)}
      <button type="button" data-replay-control="enter" on:click={onEnterReplay}>
        Enter replay
      </button>
    {:else}
      <button
        type="button"
        data-replay-control={model?.playing ? "pause" : "play"}
        on:click={() => {
          if (model?.playing) {
            onPauseReplay();
            return;
          }
          onPlayReplay();
        }}
      >
        {model?.playing ? "Pause" : "Play"}
      </button>
      <button type="button" data-replay-control="step" on:click={onStepReplay}>
        Step
      </button>
      <button type="button" data-replay-control="exit" on:click={onExitReplay}>
        Exit
      </button>
    {/if}
  </div>
</section>

<style>
  .replay-summary {
    display: grid;
    gap: 4px;
    margin-top: 8px;
    color: rgba(24, 24, 27, 0.64);
    font-size: 0.76rem;
  }

  .replay-summary strong {
    color: #18181b;
    font-size: 0.84rem;
  }

  .replay-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .replay-controls button {
    border: 0;
    border-radius: 8px;
    padding: 7px 10px;
    background: rgba(24, 24, 27, 0.08);
    color: #18181b;
    font: inherit;
    cursor: pointer;
  }

  .replay-controls button:hover {
    background: rgba(24, 24, 27, 0.12);
  }
</style>
