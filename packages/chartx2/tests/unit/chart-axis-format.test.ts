import { describe, expect, it } from "vitest";

import {
  formatPriceAxisLabel,
  formatTimeAxisLabel,
  formatVolumeAxisLabel,
} from "../../src/lib/internal/views/chart-axis-format";

describe("chart axis format helpers", () => {
  it("formats price labels with fallback precision and custom overrides", () => {
    expect(formatPriceAxisLabel(12.3456)).toBe("12.346");
    expect(formatPriceAxisLabel(1234.567)).toBe("1,234.57");
    expect(formatPriceAxisLabel(12.3, (value) => `P:${value}`)).toBe("P:12.3");
  });

  it("formats volume labels with compact suffixes", () => {
    expect(formatVolumeAxisLabel(999)).toBe("999");
    expect(formatVolumeAxisLabel(12_300)).toBe("12.3K");
    expect(formatVolumeAxisLabel(1_500_000)).toBe("1.5M");
    expect(formatVolumeAxisLabel(2_100_000_000)).toBe("2.1B");
  });

  it("formats time labels for logical and timestamp values", () => {
    expect(formatTimeAxisLabel(42)).toBe("T 42");
    expect(formatTimeAxisLabel(42, (value) => `T:${value}`)).toBe("T:42");
    expect(formatTimeAxisLabel(Date.UTC(2024, 0, 1, 9, 30))).toMatch(/^\d{2}:\d{2}$/);
  });
});
