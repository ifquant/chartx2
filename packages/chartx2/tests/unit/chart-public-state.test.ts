import { describe, expect, it, vi } from "vitest";

import {
  subscribePublicHandler,
  unsubscribePublicHandler,
} from "../../src/lib/internal/views/chart-public-state";

describe("chart public state use-cases", () => {
  it("routes public subscription mutation through shared helpers", () => {
    const handlers = new Set<() => void>();
    const handler = vi.fn();
    subscribePublicHandler(handlers, handler);
    expect(handlers.has(handler)).toBe(true);
    unsubscribePublicHandler(handlers, handler);
    expect(handlers.has(handler)).toBe(false);
  });
});
