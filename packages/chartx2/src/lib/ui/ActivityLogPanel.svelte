<script lang="ts">
  export let entries: readonly string[] = [];
</script>

<section class="mini-card activity-log-card" data-activity-log-panel>
  <div class="sidebar-head">
    <h4>Activity</h4>
  </div>
  <ul class="event-log">
    {#if entries.length === 0}
      <li>Waiting for the first chart event.</li>
    {:else}
      {#each entries as entry}
        <li>{entry}</li>
      {/each}
    {/if}
  </ul>
</section>

<style>
  .mini-card {
    padding: 10px 12px;
    border-radius: 0;
    border: 0;
    border-bottom: 1px solid rgba(24, 24, 27, 0.08);
    background: transparent;
    box-shadow: none;
  }

  .sidebar-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: nowrap;
  }

  .sidebar-head h4 {
    margin: 0;
  }

  .event-log {
    display: grid;
    gap: 8px;
    margin: 10px 0 0;
    padding-left: 16px;
    color: rgba(24, 24, 27, 0.72);
    font-size: 0.78rem;
  }
</style>
