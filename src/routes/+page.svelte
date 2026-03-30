<script lang="ts">
  import { onMount } from "svelte";
  import {
    getChartxFoundation,
    mountChartxPhaseOneHarness,
    type PhaseOneReadoutDetail,
  } from "$lib/chartx/public";

  const foundation = getChartxFoundation();
  let canvas: HTMLCanvasElement | undefined;
  let harnessError = "";
  let readout: PhaseOneReadoutDetail = {
    active: false,
    time: null,
    open: null,
    high: null,
    low: null,
    close: null,
    price: null,
  };

  onMount(() => {
    if (!canvas) {
      return;
    }

    const handleReadout = (event: Event) => {
      const detail = (event as CustomEvent<PhaseOneReadoutDetail>).detail;
      readout = detail;
    };
    canvas.addEventListener("chartx:readout", handleReadout);

    try {
      const destroy = mountChartxPhaseOneHarness(canvas);
      return () => {
        canvas?.removeEventListener("chartx:readout", handleReadout);
        destroy();
      };
    } catch (error) {
      harnessError = error instanceof Error ? error.message : "Unknown chart init failure";
      canvas.removeEventListener("chartx:readout", handleReadout);
      return;
    }
  });

  function formatValue(value: number | null, digits = 2): string {
    return value === null
      ? "--"
      : value.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: digits,
        });
  }

  function formatTime(value: number | null): string {
    if (value === null) {
      return "--";
    }

    if (Math.abs(value) < 100_000_000_000) {
      return String(value);
    }

    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  }
</script>

<svelte:head>
  <title>chartx2 | Phase One Canvas Harness</title>
</svelte:head>

<main class="page">
  <section class="hero">
    <p class="eyebrow">chartx2 / phase one</p>
    <h1>Phase-one floor is now carrying the first real pane architecture.</h1>
    <p class="lede">
      This page is still the host shell, but the chart preview now steps past the
      single-pane floor into the first pane lifecycle: a primary price pane,
      removable secondary panes, a shared time scale, and pane-local price
      scales with explicit series-to-pane targeting on both the primary slot and
      managed secondary panes.
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
        <div class="readout-bar" aria-live="polite">
          <span class:inactive={!readout.active}>T {formatTime(readout.time)}</span>
          <span class:inactive={!readout.active}>O {formatValue(readout.open)}</span>
          <span class:inactive={!readout.active}>H {formatValue(readout.high)}</span>
          <span class:inactive={!readout.active}>L {formatValue(readout.low)}</span>
          <span class:inactive={!readout.active}>C {formatValue(readout.close)}</span>
          <span class:inactive={!readout.active}>P {formatValue(readout.price)}</span>
        </div>
        <canvas bind:this={canvas} aria-label="chartx2 phase-one chart harness"></canvas>
      {/if}
    </div>

    <div class="chart-copy">
      <h2>Browser Harness</h2>
      <p>
        This deterministic browser harness now validates the first pane lifecycle as
        well: one primary chart pane, managed secondary panes, and a shared time
        scale across the whole stack.
      </p>
      <ul>
        <li>Deterministic sample OHLC data</li>
        <li>Primary price pane plus managed secondary study panes</li>
        <li>Shared time scale with pane-local price scales</li>
        <li>Public pane handles with add/remove, pane sizing, and explicit series-to-pane targeting</li>
        <li>Canvas-based candle, bar, line, histogram, and volume renderers</li>
        <li>Baseline pointer-driven crosshair rendering</li>
        <li>Host-level OHLC readout bar fed by crosshair state</li>
        <li>Minimal append / replace-last update flow</li>
        <li>Public API with one primary slot plus one basic series per managed secondary pane</li>
        <li>Dynamic time and price axis labels with active crosshair tags</li>
        <li>Wheel-driven viewport zoom baseline</li>
        <li>Drag-driven viewport pan baseline</li>
        <li>Visible host error state plus high-DPI browser verification</li>
        <li>2K and 5K bars performance smoke coverage</li>
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
    <h2>Phase-One Closure</h2>
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

.readout-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem 1rem;
  margin-bottom: 0.85rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid rgba(16, 16, 16, 0.12);
  background: rgba(16, 16, 16, 0.9);
  color: #f7f6f1;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.readout-bar span.inactive {
  opacity: 0.62;
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
