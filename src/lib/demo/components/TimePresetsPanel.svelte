<script lang="ts">
  export let ranges: readonly string[] = [];
  export let activeRange = "1D";
</script>

<section class="mini-card time-presets-card" data-time-presets-panel>
  <div class="sidebar-head">
    <h4>Time Presets</h4>
    <span>{activeRange}</span>
  </div>
  <div class="time-presets-grid">
    {#each ranges as range}
      <button type="button" class:active={range === activeRange} data-time-preset={range}>
        {range}
      </button>
    {/each}
  </div>
</section>

<style>
  .time-presets-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  .time-presets-grid button {
    border: 0;
    border-radius: 999px;
    padding: 8px 12px;
    background: rgba(24, 24, 27, 0.06);
    color: rgba(24, 24, 27, 0.72);
    font: inherit;
    font-weight: 600;
  }

  .time-presets-grid button.active {
    background: #18181b;
    color: #fffdf8;
  }
</style>
