<script lang="ts">
  import {
    resolveOrderBookLadderModel,
    type OrderBookLadderModel,
    type OrderBookLadderResolvedRow,
  } from "../public/order-book-ladder-surface";

  const EMPTY_MODEL: OrderBookLadderModel = {
    symbol: "--",
    depthMode: "level-5",
    levels: [],
    emptyLabel: "Waiting for market depth.",
  };

  type Props = {
    model?: OrderBookLadderModel;
  };

  let { model = EMPTY_MODEL }: Props = $props();
  const resolved = $derived(resolveOrderBookLadderModel(model));

  function rowClass(row: OrderBookLadderResolvedRow): string {
    return [
      "ladder-row",
      row.side,
      row.isBestBid ? "best-bid" : "",
      row.isBestAsk ? "best-ask" : "",
      row.isLastPrice ? "last-price" : "",
    ].filter(Boolean).join(" ");
  }
</script>

<section class="order-book-ladder" data-order-book-ladder data-depth-mode={resolved.depthMode}>
  <header>
    <strong>{resolved.symbol}</strong>
    <span>{resolved.depthLabel}</span>
    <span>last {resolved.lastPriceLabel}</span>
  </header>

  {#if resolved.rows.length === 0}
    <div class="empty">{resolved.emptyLabel}</div>
  {:else}
    <div class="ladder" role="table" aria-label={`${resolved.symbol} order book ladder`}>
      <div class="head">卖量</div>
      <div class="head price">价格</div>
      <div class="head">买量</div>
      {#each resolved.rows as row (row.price)}
        <div class={rowClass(row)}>
          <span class="cell ask-cell">
            <i style={`width: ${row.askPercent}%`}></i>
            <b>{row.askSizeLabel}</b>
          </span>
          <strong class="cell price-cell">{row.priceLabel}</strong>
          <span class="cell bid-cell">
            <i style={`width: ${row.bidPercent}%`}></i>
            <b>{row.bidSizeLabel}</b>
          </span>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .order-book-ladder {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-rows: 28px minmax(0, 1fr);
    background: #101719;
    color: #dbe5e8;
    overflow: hidden;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  header {
    min-width: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    padding: 0 8px;
    color: #91a6ad;
    font-size: 10px;
    font-weight: 800;
    text-transform: uppercase;
  }

  header strong {
    min-width: 0;
    color: #f2f7f7;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .empty {
    display: grid;
    place-items: center;
    color: #91a6ad;
    font-size: 11px;
    font-weight: 800;
  }

  .ladder {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) 54px minmax(0, 1fr);
    align-content: start;
    overflow: hidden;
    font-size: 11px;
  }

  .head {
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding: 0 5px;
    color: #789098;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    font-size: 10px;
    font-weight: 900;
  }

  .head.price {
    justify-content: center;
  }

  .ladder-row {
    display: contents;
  }

  .cell {
    position: relative;
    min-width: 0;
    height: 22px;
    display: flex;
    align-items: center;
    border-right: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .ask-cell {
    justify-content: flex-start;
    color: #ee8f87;
  }

  .bid-cell {
    justify-content: flex-end;
    color: #75d6a5;
  }

  .price-cell {
    justify-content: center;
    color: #f2f7f7;
    background: rgba(255, 255, 255, 0.04);
    font-weight: 900;
  }

  .cell i {
    position: absolute;
    top: 3px;
    bottom: 3px;
    opacity: 0.38;
    pointer-events: none;
  }

  .ask-cell i {
    left: 0;
    background: #b8564f;
  }

  .bid-cell i {
    right: 0;
    background: #2f9b67;
  }

  .cell b {
    position: relative;
    z-index: 1;
    min-width: 0;
    padding: 0 5px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .best-ask .price-cell {
    color: #ffaaa1;
    box-shadow: inset 0 0 0 1px rgba(255, 155, 145, 0.45);
  }

  .best-bid .price-cell {
    color: #83e3b2;
    box-shadow: inset 0 0 0 1px rgba(126, 224, 173, 0.45);
  }

  .last-price .price-cell::after {
    width: 5px;
    height: 5px;
    margin-left: 4px;
    border-radius: 999px;
    background: #f5c15c;
    content: "";
  }
</style>
