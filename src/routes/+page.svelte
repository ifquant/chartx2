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
    paneIndex: null,
    time: null,
    open: null,
    high: null,
    low: null,
    close: null,
    price: null,
    series: [],
  };

  const leftTools = ["+", "⌖", "╱", "⌗", "T", "☺", "⊕", "⌂", "🗑"];
  const topTools = ["Indicators", "Alert", "Replay"];
  const timeframes = ["1D", "5D", "1M", "3M", "6M", "YTD", "1Y", "5Y", "All"];
  const watchlist = [
    { symbol: "SPX", last: "6,368.86", change: "-108.31", percent: "-1.67%" },
    { symbol: "NDQ", last: "23,132.77", change: "-454.22", percent: "-1.93%" },
    { symbol: "DJI", last: "45,166.64", change: "-793.47", percent: "-1.73%" },
    { symbol: "VIX", last: "30.73", change: "-0.32", percent: "-1.03%" },
    { symbol: "DXY", last: "100.257", change: "0.064", percent: "0.06%" },
  ];
  const performance = [
    { label: "1W", value: "-4.64%" },
    { label: "1M", value: "-7.98%" },
    { label: "3M", value: "-9.96%" },
    { label: "6M", value: "-5.24%" },
    { label: "YTD", value: "-9.37%" },
    { label: "1Y", value: "16.75%" },
  ];

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
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(value));
  }

  function formatSigned(value: string): string {
    return value.startsWith("-") ? value : `+${value}`;
  }
</script>

<svelte:head>
  <title>chartx2 | Demo Workstation</title>
</svelte:head>

<main class="workspace">
  <header class="topbar">
    <div class="brand-strip">
      <div class="notif">11</div>
      <button class="symbol-chip">NDX</button>
      <button class="ghost-btn">⌕</button>
      <button class="ghost-btn">◎</button>
      <div class="divider"></div>
      <button class="ghost-btn">D</button>
      <button class="ghost-btn">⇅</button>
      {#each topTools as item}
        <button class="tool-btn">{item}</button>
      {/each}
    </div>

    <div class="topbar-meta">
      <h2 class="workspace-heading">Phase-one floor is now carrying the first real pane architecture.</h2>
      <button class="ghost-btn">↶</button>
      <button class="ghost-btn">↷</button>
      <button class="layout-chip">Unnamed</button>
      <button class="trade-btn">Trade</button>
    </div>
  </header>

  <section class="shell">
    <aside class="left-rail">
      {#each leftTools as item}
        <button class="rail-btn">{item}</button>
      {/each}
    </aside>

    <section class="chart-shell">
      <div class="chart-header">
        <div class="market-line">
          <strong>Nasdaq 100 Index</strong>
          <span>1D</span>
          <span>NASDAQ</span>
          <span class="ohlc o">O {formatValue(readout.open)}</span>
          <span class="ohlc h">H {formatValue(readout.high)}</span>
          <span class="ohlc l">L {formatValue(readout.low)}</span>
          <span class="ohlc c">C {formatValue(readout.close)}</span>
        </div>
        <div class="market-side">
          <span>USD</span>
          <span>{formatTime(readout.time)}</span>
        </div>
      </div>

      <div class="chart-board chart-frame">
        <div class="chart-overlays">
          <div class="quote-cards">
            <article class="quote-card sell">
              <span>23,132.77</span>
              <small>SELL</small>
            </article>
            <article class="quote-card buy">
              <span>23,132.77</span>
              <small>BUY</small>
            </article>
          </div>

          <div class="study-strip">
            <div class="study-meta readout-bar">
              <span class="study-name">Pane {readout.paneIndex === null ? "--" : readout.paneIndex + 1}</span>
              {#each readout.series as series}
                <span class="study-pill" style={`--series-color: ${series.color};`}>
                  {series.label} {formatValue(series.value)}
                </span>
              {/each}
            </div>
          </div>
        </div>

        {#if harnessError}
          <div class="error-state">
            <p class="error-label">chart init failure</p>
            <p>{harnessError}</p>
          </div>
        {:else}
          <canvas bind:this={canvas} aria-label="chartx2 phase-one chart harness"></canvas>
        {/if}
      </div>

      <footer class="statusbar">
        <div class="tf-strip">
          {#each timeframes as timeframe}
            <button class:active={timeframe === "1D"}>{timeframe}</button>
          {/each}
        </div>
        <div class="status-meta">
          <span>{formatTime(readout.time)}</span>
          <span>Phase-one floor</span>
        </div>
      </footer>
    </section>

    <aside class="rightbar">
      <section class="watchlist-card">
        <div class="card-head">
          <h2>Watchlist</h2>
          <button class="ghost-btn">＋</button>
        </div>
        <div class="watchlist-head">
          <span>Symbol</span>
          <span>Last</span>
          <span>Chg</span>
        </div>
        <div class="watchlist-body">
          {#each watchlist as item}
            <div class="watch-item">
              <strong>{item.symbol}</strong>
              <span>{item.last}</span>
              <span class:down={item.change.startsWith("-")} class:up={!item.change.startsWith("-")}>
                {formatSigned(item.change)} {item.percent}
              </span>
            </div>
          {/each}
        </div>
      </section>

      <section class="detail-card">
        <div class="card-head">
          <h2>NDX</h2>
          <span class="mini-meta">NASDAQ</span>
        </div>
        <div class="headline-price">{formatValue(readout.close)}</div>
        <div class="headline-change down">-454.22 -1.93%</div>
        <p class="detail-copy">让首页先收敛成 demo 风格工作台，而不是继续像文档页。</p>
      </section>

      <section class="performance-card">
        <h2>Performance</h2>
        <div class="perf-grid">
          {#each performance as item}
            <article class:positive={!item.value.startsWith("-")}>
              <strong>{item.value}</strong>
              <small>{item.label}</small>
            </article>
          {/each}
        </div>
      </section>

      <section class="engine-card">
        <h2>Engine Status</h2>
        <ul>
          {#each foundation.publicSurface.slice(0, 2) as item}
            <li>{item}</li>
          {/each}
          <li>{foundation.phaseOneSteps.filter((step) => step.status === "complete").length}/10 phase-one steps complete</li>
        </ul>
      </section>
    </aside>
  </section>
</main>

<style>
:root {
  color: #1d1d1f;
  background: #f7f6f3;
  font-family: "Segoe UI", "SF Pro Text", "Helvetica Neue", sans-serif;
}

:global(body) {
  margin: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(243, 240, 234, 0.98) 100%);
}

.workspace {
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
}

.topbar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  padding: 0.7rem 1rem;
  border-bottom: 1px solid rgba(28, 28, 30, 0.08);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(16px);
  position: sticky;
  top: 0;
  z-index: 10;
}

.brand-strip,
.topbar-meta {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
}

.brand-strip {
  overflow: hidden;
}

.topbar-meta {
  justify-content: flex-end;
}

.workspace-heading {
  flex: 1 1 auto;
  min-width: 0;
  max-width: 26rem;
  margin: 0 0.45rem 0 0;
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(29, 29, 31, 0.56);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif,
.rail-btn,
.ghost-btn,
.tool-btn,
.symbol-chip,
.layout-chip,
.trade-btn,
.tf-strip button {
  border: 1px solid rgba(28, 28, 30, 0.1);
  background: rgba(255, 255, 255, 0.92);
  color: inherit;
}

.notif {
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.68rem;
  color: #fff;
  background: #e15353;
  border: none;
}

.symbol-chip,
.layout-chip,
.trade-btn,
.tool-btn,
.ghost-btn {
  border-radius: 0.7rem;
  padding: 0.45rem 0.7rem;
  font-size: 0.82rem;
}

.symbol-chip {
  font-weight: 700;
}

.trade-btn {
  background: #f1ede4;
}

.divider {
  width: 1px;
  height: 1.35rem;
  background: rgba(28, 28, 30, 0.1);
}

.shell {
  display: grid;
  grid-template-columns: 3.4rem minmax(0, 1fr) clamp(15.5rem, 18vw, 19rem);
  gap: 0;
  min-height: 0;
  height: 100%;
}

.left-rail {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.8rem 0.55rem;
  border-right: 1px solid rgba(28, 28, 30, 0.08);
  background: rgba(249, 248, 245, 0.96);
}

.rail-btn {
  width: 2.3rem;
  height: 2.3rem;
  border-radius: 0.8rem;
  display: grid;
  place-items: center;
  font-size: 0.95rem;
}

.chart-shell {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-width: 0;
  min-height: 0;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.78) 0%, rgba(246, 243, 236, 0.86) 100%);
}

.chart-header,
.statusbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.55rem 0.9rem;
  border-bottom: 1px solid rgba(28, 28, 30, 0.07);
}

.statusbar {
  border-top: 1px solid rgba(28, 28, 30, 0.07);
  border-bottom: none;
}

.market-line,
.market-side,
.tf-strip {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-wrap: wrap;
}

.market-line {
  font-size: 0.82rem;
}

.market-line strong {
  font-size: 1rem;
  margin-right: 0.3rem;
}

.ohlc.o,
.ohlc.h {
  color: #b87426;
}

.ohlc.l,
.ohlc.c {
  color: #bc4a4a;
}

.chart-board {
  position: relative;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.5) 0%, rgba(250, 247, 241, 0.85) 100%);
}

.chart-overlays {
  position: absolute;
  inset: 0 0 auto 0;
  z-index: 2;
  pointer-events: none;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.8rem;
}

.quote-cards {
  display: flex;
  gap: 0.6rem;
}

.quote-card {
  display: grid;
  gap: 0.15rem;
  min-width: 5.5rem;
  padding: 0.55rem 0.7rem;
  border-radius: 0.85rem;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(28, 28, 30, 0.08);
  box-shadow: 0 10px 24px rgba(28, 28, 30, 0.08);
  font-size: 0.78rem;
}

.quote-card span {
  font-weight: 700;
  font-size: 1rem;
}

.quote-card.sell {
  color: #bf4444;
}

.quote-card.buy {
  color: #316bd5;
}

.study-strip {
  display: flex;
  justify-content: flex-end;
  width: min(46rem, 100%);
}

.study-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.45rem;
  max-width: 100%;
}

.study-name,
.study-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.38rem 0.6rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(28, 28, 30, 0.08);
  font-size: 0.72rem;
  box-shadow: 0 8px 20px rgba(28, 28, 30, 0.05);
}

.study-pill::before {
  content: "";
  width: 0.48rem;
  height: 0.48rem;
  border-radius: 999px;
  background: var(--series-color, rgba(28, 28, 30, 0.4));
}

canvas {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
}

.tf-strip button {
  border-radius: 999px;
  padding: 0.35rem 0.62rem;
  font-size: 0.76rem;
}

.tf-strip button.active {
  background: #1d1d1f;
  color: #fff;
}

.status-meta {
  display: flex;
  gap: 0.7rem;
  font-size: 0.76rem;
  color: rgba(29, 29, 31, 0.62);
}

.rightbar {
  display: grid;
  grid-template-rows: auto auto auto auto;
  align-content: start;
  gap: 0.8rem;
  padding: 0.85rem;
  border-left: 1px solid rgba(28, 28, 30, 0.08);
  background: rgba(250, 249, 246, 0.96);
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.watchlist-card,
.detail-card,
.performance-card,
.engine-card {
  border: 1px solid rgba(28, 28, 30, 0.08);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 22px rgba(28, 28, 30, 0.05);
  padding: 0.85rem;
}

.card-head,
.watchlist-head,
.watch-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 0.65rem;
  align-items: center;
}

.card-head {
  grid-template-columns: minmax(0, 1fr) auto;
  margin-bottom: 0.7rem;
}

.card-head h2,
.performance-card h2,
.engine-card h2 {
  margin: 0;
  font-size: 0.86rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.mini-meta,
.watchlist-head,
.detail-copy,
.engine-card li {
  font-size: 0.74rem;
  color: rgba(29, 29, 31, 0.62);
}

.watchlist-head {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(28, 28, 30, 0.07);
}

.watchlist-body {
  display: grid;
  gap: 0.45rem;
  padding-top: 0.55rem;
}

.watch-item strong {
  font-size: 0.84rem;
}

.watch-item span:last-child,
.headline-change.down,
.down {
  color: #c7543e;
}

.up,
.positive strong {
  color: #1a8f62;
}

.headline-price {
  font-size: 2.25rem;
  font-weight: 700;
  line-height: 1;
  margin-bottom: 0.45rem;
}

.headline-change {
  font-size: 1rem;
  margin-bottom: 0.65rem;
}

.perf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
}

.perf-grid article {
  padding: 0.7rem 0.55rem;
  border-radius: 0.8rem;
  background: rgba(243, 115, 115, 0.1);
  display: grid;
  gap: 0.15rem;
  text-align: center;
}

.perf-grid article.positive {
  background: rgba(37, 167, 110, 0.14);
}

.perf-grid strong {
  font-size: 0.86rem;
}

.perf-grid small {
  color: rgba(29, 29, 31, 0.62);
  font-size: 0.68rem;
  text-transform: uppercase;
}

.engine-card ul {
  margin: 0.7rem 0 0;
  padding-left: 1rem;
}

.error-state {
  min-height: 26rem;
  display: grid;
  place-items: center;
  text-align: center;
  color: #c7543e;
}

.error-label {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.72rem;
}

@media (max-width: 1200px) {
  .topbar {
    gap: 0.7rem;
    padding-inline: 0.7rem;
  }

  .symbol-chip,
  .layout-chip,
  .trade-btn,
  .tool-btn,
  .ghost-btn {
    padding: 0.42rem 0.6rem;
    font-size: 0.78rem;
  }

  .workspace-heading {
    max-width: 18rem;
  }

  .quote-card {
    min-width: 4.8rem;
    padding-inline: 0.6rem;
  }
}

@media (max-width: 1040px) {
  .shell {
    grid-template-columns: 3.4rem minmax(0, 1fr);
  }

  .rightbar {
    grid-column: 1 / -1;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    border-left: none;
    border-top: 1px solid rgba(28, 28, 30, 0.08);
    overflow: visible;
  }
}

@media (max-width: 900px) {
  .workspace {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }

  .topbar,
  .chart-header,
  .statusbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .shell {
    grid-template-columns: 1fr;
  }

  .workspace-heading {
    width: 100%;
    margin: 0 0 0.3rem;
  }

  .left-rail {
    flex-direction: row;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid rgba(28, 28, 30, 0.08);
  }

  .rightbar {
    grid-template-columns: 1fr;
  }

  .chart-overlays {
    position: static;
    padding: 0.8rem 0.8rem 0;
    flex-direction: column;
  }

  .quote-cards,
  .study-strip,
  .study-meta {
    justify-content: flex-start;
  }
}
</style>
