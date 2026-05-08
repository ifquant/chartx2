<script lang="ts">
  export let entries: readonly string[] = [];
</script>

<section class="mini-card action-card" data-activity-log-panel>
  <h4>Activity</h4>
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
  .event-log {
    display: grid;
    gap: 8px;
    margin: 10px 0 0;
    padding-left: 16px;
    color: rgba(24, 24, 27, 0.72);
    font-size: 0.78rem;
  }
</style>
