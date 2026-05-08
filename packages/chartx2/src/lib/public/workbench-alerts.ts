import type { AlertSummaryModel } from "./workbench";

export type WorkbenchAlertStatus = "armed" | "paused" | "triggered";
export type WorkbenchPriceCrossDirection = "above" | "below" | "either";

export interface WorkbenchPriceCrossAlertConditionV1 {
  kind: "price-crosses";
  symbol: string;
  timeframe: string;
  price: number;
  direction: WorkbenchPriceCrossDirection;
}

export type WorkbenchAlertConditionV1 = WorkbenchPriceCrossAlertConditionV1;

export interface WorkbenchAlertStateV1 {
  id: string;
  label: string;
  condition: WorkbenchAlertConditionV1;
  status: WorkbenchAlertStatus;
  createdAt: number;
  updatedAt: number;
  triggeredAt?: number;
}

export interface WorkbenchAlertsStateV1 {
  kind: "workbench-alerts";
  version: 1;
  alerts: readonly WorkbenchAlertStateV1[];
}

export type WorkbenchAlertsState = WorkbenchAlertsStateV1;

export interface WorkbenchAlertsStateInput {
  alerts: readonly WorkbenchAlertStateV1[];
}

export interface WorkbenchAlertsPersistenceProvider {
  loadWorkbenchAlerts(): Promise<WorkbenchAlertsState | null>;
  saveWorkbenchAlerts(state: WorkbenchAlertsState): Promise<boolean>;
  clearWorkbenchAlerts(): Promise<void>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isWorkbenchAlertStatus(value: unknown): value is WorkbenchAlertStatus {
  return value === "armed" || value === "paused" || value === "triggered";
}

function isWorkbenchPriceCrossDirection(
  value: unknown,
): value is WorkbenchPriceCrossDirection {
  return value === "above" || value === "below" || value === "either";
}

function isWorkbenchAlertCondition(value: unknown): value is WorkbenchAlertConditionV1 {
  if (!isRecord(value) || value.kind !== "price-crosses") {
    return false;
  }
  return (
    isNonEmptyString(value.symbol) &&
    isNonEmptyString(value.timeframe) &&
    isFiniteNumber(value.price) &&
    isWorkbenchPriceCrossDirection(value.direction)
  );
}

function isWorkbenchAlert(value: unknown): value is WorkbenchAlertStateV1 {
  if (!isRecord(value)) {
    return false;
  }
  if (
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.label) ||
    !isWorkbenchAlertCondition(value.condition) ||
    !isWorkbenchAlertStatus(value.status) ||
    !isFiniteNumber(value.createdAt) ||
    !isFiniteNumber(value.updatedAt)
  ) {
    return false;
  }
  return value.triggeredAt === undefined || isFiniteNumber(value.triggeredAt);
}

function formatPrice(value: number): string {
  return value.toFixed(2);
}

function toConditionLabel(condition: WorkbenchAlertConditionV1): string {
  if (condition.direction === "either") {
    return `Price crosses ${formatPrice(condition.price)}`;
  }
  return `Price crosses ${condition.direction} ${formatPrice(condition.price)}`;
}

export function createWorkbenchAlertsState(
  input: WorkbenchAlertsStateInput,
): WorkbenchAlertsStateV1 {
  return {
    kind: "workbench-alerts",
    version: 1,
    alerts: input.alerts,
  };
}

export function isWorkbenchAlertsState(value: unknown): value is WorkbenchAlertsState {
  if (!isRecord(value)) {
    return false;
  }
  if (value.kind !== "workbench-alerts" || value.version !== 1) {
    return false;
  }
  return Array.isArray(value.alerts) && value.alerts.every((alert) => isWorkbenchAlert(alert));
}

export function toAlertSummaryModel(alert: WorkbenchAlertStateV1): AlertSummaryModel {
  return {
    id: alert.id,
    label: alert.label,
    conditionLabel: toConditionLabel(alert.condition),
    status: alert.status,
  };
}

export function createLocalStorageWorkbenchAlertsProvider(
  storage: Storage,
  key = "chartx2:workbench-alerts:v1",
): WorkbenchAlertsPersistenceProvider {
  return {
    async loadWorkbenchAlerts() {
      try {
        const raw = storage.getItem(key);
        if (raw === null) {
          return null;
        }
        try {
          const parsed: unknown = JSON.parse(raw);
          return isWorkbenchAlertsState(parsed) ? parsed : null;
        } catch {
          return null;
        }
      } catch {
        return null;
      }
    },
    async saveWorkbenchAlerts(state) {
      try {
        storage.setItem(key, JSON.stringify(state));
        return true;
      } catch {
        return false;
      }
    },
    async clearWorkbenchAlerts() {
      try {
        storage.removeItem(key);
      } catch {
        // Ignore storage access failures in the local UI provider.
      }
    },
  };
}
