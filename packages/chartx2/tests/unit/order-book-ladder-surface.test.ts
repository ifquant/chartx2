import { describe, expect, it } from "vitest";

import {
  resolveOrderBookLadderModel,
  type OrderBookLadderModel,
} from "../../src/lib/public/order-book-ladder-surface";

describe("order book ladder surface model", () => {
  it("derives a compact three-column ladder with best bid, best ask, and last price", () => {
    const model: OrderBookLadderModel = {
      symbol: "rb2605",
      depthMode: "level-5",
      lastPrice: 3718,
      priceTick: 1,
      levels: [
        { price: 3720, askSize: 37 },
        { price: 3719, askSize: 21 },
        { price: 3718, bidSize: 18 },
        { price: 3717, bidSize: 52 },
        { price: 3716, bidSize: 89 },
      ],
    };

    const resolved = resolveOrderBookLadderModel(model);

    expect(resolved).toMatchObject({
      symbol: "rb2605",
      depthLabel: "5档",
      lastPriceLabel: "3718",
    });
    expect(resolved.rows.map((row) => ({
      price: row.priceLabel,
      ask: row.askSizeLabel,
      bid: row.bidSizeLabel,
      side: row.side,
      isBestAsk: row.isBestAsk,
      isBestBid: row.isBestBid,
      isLastPrice: row.isLastPrice,
    }))).toEqual([
      {
        price: "3720",
        ask: "37",
        bid: "",
        side: "ask",
        isBestAsk: false,
        isBestBid: false,
        isLastPrice: false,
      },
      {
        price: "3719",
        ask: "21",
        bid: "",
        side: "ask",
        isBestAsk: true,
        isBestBid: false,
        isLastPrice: false,
      },
      {
        price: "3718",
        ask: "",
        bid: "18",
        side: "bid",
        isBestAsk: false,
        isBestBid: true,
        isLastPrice: true,
      },
      {
        price: "3717",
        ask: "",
        bid: "52",
        side: "bid",
        isBestAsk: false,
        isBestBid: false,
        isLastPrice: false,
      },
      {
        price: "3716",
        ask: "",
        bid: "89",
        side: "bid",
        isBestAsk: false,
        isBestBid: false,
        isLastPrice: false,
      },
    ]);
    expect(resolved.rows[4].bidPercent).toBe(100);
    expect(resolved.rows[0].askPercent).toBe(42);
  });

  it("formats decimal tick prices and level-1 depth labels", () => {
    const resolved = resolveOrderBookLadderModel({
      symbol: "IF2606",
      depthMode: "level-1",
      lastPrice: 4000.2,
      priceTick: 0.2,
      levels: [{ price: 4000.2, bidSize: 1 }],
    });

    expect(resolved.depthLabel).toBe("1档");
    expect(resolved.lastPriceLabel).toBe("4000.2");
    expect(resolved.rows[0].priceLabel).toBe("4000.2");
  });
});
