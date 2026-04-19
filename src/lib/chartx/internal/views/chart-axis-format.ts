export function formatPriceAxisLabel(
  value: number,
  formatter: ((value: number) => string) | null = null,
): string {
  if (formatter !== null) {
    return formatter(value);
  }
  const digits = Math.abs(value) >= 1000 ? 2 : 3;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function formatVolumeAxisLabel(value: number): string {
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (absolute >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (absolute >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

export function formatTimeAxisLabel(
  value: number,
  formatter: ((time: number) => string) | null = null,
): string {
  if (formatter !== null) {
    return formatter(value);
  }
  if (Math.abs(value) < 100_000_000_000) {
    return `T ${value}`;
  }

  return new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}
