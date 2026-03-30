<script lang="ts">
  import { onMount } from "svelte";
  import {
    getChartxFoundation,
    mountChartxPhaseOneHarness,
  } from "$lib/chartx/public";

  const foundation = getChartxFoundation();
  let canvas: HTMLCanvasElement | undefined;
  let harnessError = "";

  onMount(() => {
    if (!canvas) {
      return;
    }

    try {
      return mountChartxPhaseOneHarness(canvas);
    } catch (error) {
      harnessError = error instanceof Error ? error.message : "Unknown chart init failure";
      return;
    }
  });
</script>

<svelte:head>
  <title>chartx2 | Phase One Canvas Harness</title>
</svelte:head>

<main class="page">
  <section class="hero">
    <p class="eyebrow">chartx2 / phase one</p>
    <h1>Minimal model data now lands on a real canvas harness.</h1>
    <p class="lede">
      This page still acts as the host shell, but the chart preview now mounts through
      the public chartx entrypoint and renders deterministic OHLC data with the internal
      model, scale, renderer, and view layers.
    </p>
  </section>

  <section class="chart-stage">
    <div class="chart-frame">
      {#if harnessError}
        <div class="error-state">
          <p class="eyebrow">chart init failure</p>
          <p>{harnessError}</p>
        </div>
      {:else}
        <canvas bind:this={canvas} aria-label="chartx2 phase-one chart harness"></canvas>
      {/if}
    </div>

    <div class="chart-copy">
      <h2>Browser Harness</h2>
      <p>
        This is the first deterministic browser harness for validating scale math, plot
        rows, and candle rendering before the broader renderer and view migration continues.
      </p>
      <ul>
        <li>Deterministic sample OHLC data</li>
        <li>Internal time and price scales</li>
        <li>Canvas-based candle and grid renderers</li>
        <li>Visible host error state if chart initialization fails</li>
      </ul>
    </div>
  </section>

  <section class="panel">
    <div>
      <h2>Public Surface</h2>
      <ul>
        {#each foundation.publicSurface as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>

    <div>
      <h2>Internal Layers</h2>
      <ul>
        {#each foundation.internalLayers as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>

    <div>
      <h2>Forbidden Shortcuts</h2>
      <ul>
        {#each foundation.forbiddenShortcuts as item}
          <li>{item}</li>
        {/each}
      </ul>
    </div>
  </section>

  <section class="steps">
    <h2>Phase-One Opening Moves</h2>
    <div class="step-grid">
      {#each foundation.phaseOneSteps as step}
        <article class:active={step.status === "active"} class:complete={step.status === "complete"}>
          <p class="step-id">{step.id}</p>
          <h3>{step.title}</h3>
          <p>{step.note}</p>
        </article>
      {/each}
    </div>
  </section>
</main>

<style>
:root {
  color: #101010;
  background:
    radial-gradient(circle at top, rgba(221, 232, 255, 0.95), transparent 34%),
    linear-gradient(180deg, #f7f6f1 0%, #ece8dc 100%);
  font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif;
}

.page {
  min-height: 100vh;
  padding: 3rem 1.5rem 4rem;
}

.hero,
.chart-stage,
.panel,
.steps {
  width: min(1080px, 100%);
  margin: 0 auto;
}

.hero {
  margin-bottom: 2rem;
}

.eyebrow {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  max-width: 14ch;
  margin: 0;
  font-size: clamp(2.8rem, 7vw, 5.6rem);
  line-height: 0.94;
  font-weight: 700;
}

.lede {
  max-width: 52rem;
  margin: 1.25rem 0 0;
  font-size: 1.15rem;
  line-height: 1.6;
}

.chart-stage {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
  gap: 1rem;
  align-items: start;
  margin-bottom: 2rem;
}

.chart-frame,
.chart-copy,
.panel > div,
.step-grid article {
  border: 1px solid rgba(16, 16, 16, 0.14);
  background: rgba(255, 253, 247, 0.82);
  box-shadow: 0 12px 30px rgba(16, 16, 16, 0.08);
}

.chart-frame,
.chart-copy,
.panel > div {
  padding: 1.25rem;
}

.chart-frame {
  overflow-x: auto;
}

canvas {
  display: block;
  width: min(960px, 100%);
  max-width: 100%;
  height: auto;
}

.error-state {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 1.5rem;
  color: #c7543e;
}

h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

ul {
  margin: 0;
  padding-left: 1.2rem;
}

li + li {
  margin-top: 0.55rem;
}

.panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.step-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}

.step-grid article {
  min-height: 13rem;
  padding: 1.25rem;
}

.step-grid article.complete {
  background: rgba(88, 107, 70, 0.12);
}

.step-grid article.active {
  background: #101010;
  color: #f7f6f1;
}

.step-id {
  margin: 0 0 1rem;
  font-size: 0.82rem;
  letter-spacing: 0.18em;
}

h3 {
  margin: 0 0 0.85rem;
  font-size: 1.4rem;
}

article p:last-child {
  margin-bottom: 0;
  line-height: 1.5;
}

@media (max-width: 900px) {
  .chart-stage,
  .panel,
  .step-grid {
    grid-template-columns: 1fr;
  }
}
</style>
