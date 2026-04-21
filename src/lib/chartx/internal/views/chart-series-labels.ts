export function formatSeriesKindLabel(kind: string): string {
  switch (kind) {
    case "candlestick":
      return "Candlestick";
    case "line-break":
      return "Line Break";
    case "kagi":
      return "Kagi";
    case "point-figure":
      return "Point Figure";
    case "volume-candles":
      return "Volume Candles";
    case "hollow-candles":
      return "Hollow Candles";
    case "heikin-ashi":
      return "Heikin Ashi";
    case "renko":
      return "Renko";
    case "hlc-bars":
      return "HLC Bars";
    case "high-low":
      return "High-Low";
    case "line":
      return "Line";
    case "line-markers":
      return "Line Markers";
    case "stepline":
      return "Stepline";
    case "area":
      return "Area";
    case "baseline":
      return "Baseline";
    case "bar":
      return "Bar";
    case "histogram":
      return "Histogram";
    case "volume":
      return "Volume";
    default:
      return "Series";
  }
}
