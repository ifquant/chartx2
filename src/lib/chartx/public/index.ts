import {
  getEngineBoundarySummary,
  type EngineBoundarySummary,
} from "../internal/foundation";

export type { EngineBoundarySummary };

export function getChartxFoundation(): EngineBoundarySummary {
  return getEngineBoundarySummary();
}
