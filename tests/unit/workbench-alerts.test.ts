import { describe, expect, it } from "vitest";

import {
  createLocalStorageWorkbenchAlertsProvider,
  createWorkbenchAlertsState,
  isWorkbenchAlertsState,
  toAlertSummaryModel,
} from "../../src/lib/chartx/public/workbench-alerts";
import type { WorkbenchAlertStateV1 } from "../../src/lib/chartx/public/workbench-alerts";

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear() {
      values.clear();
    },
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    key(index: number) {
      return [...values.keys()][index] ?? null;
    },
    removeItem(key: string) {
      values.delete(key);
    },
    setItem(key: string, value: string) {
      values.set(key, value);
    },
  };
}

function createThrowingStorage(): Storage {
  return {
    get length() {
      return 0;
    },
    clear() {
      throw new Error("clear failed");
    },
    getItem() {
      throw new Error("getItem failed");
    },
    key() {
      return null;
    },
    removeItem() {
      throw new Error("removeItem failed");
    },
    setItem() {
      throw new Error("setItem failed");
    },
  };
}

const baseAlert: WorkbenchAlertStateV1 = {
  id: "alert-1",
  label: "ES upside",
  condition: {
    kind: "price-crosses",
    symbol: "ESM2026",
    timeframe: "1m",
    price: 23125.5,
    direction: "above",
  },
  status: "armed",
  createdAt: 1776873600000,
  updatedAt: 1776873600000,
};

describe("workbench alerts state", () => {
  it("creates a valid V1 alerts state", () => {
    const state = createWorkbenchAlertsState({ alerts: [baseAlert] });

    expect(state).toEqual({
      kind: "workbench-alerts",
      version: 1,
      alerts: [baseAlert],
    });
    expect(isWorkbenchAlertsState(state)).toBe(true);
  });

  it("projects a price-cross alert into the current sidebar summary fields", () => {
    expect(toAlertSummaryModel(baseAlert)).toEqual({
      id: "alert-1",
      label: "ES upside",
      conditionLabel: "Price crosses above 23125.50",
      status: "armed",
    });
    expect(
      toAlertSummaryModel({
        ...baseAlert,
        condition: { ...baseAlert.condition, direction: "either" },
      }).conditionLabel,
    ).toBe("Price crosses 23125.50");
  });

  it("rejects malformed version and alerts shape", () => {
    expect(isWorkbenchAlertsState(null)).toBe(false);
    expect(isWorkbenchAlertsState({ kind: "workbench-alerts", version: 2, alerts: [] })).toBe(
      false,
    );
    expect(isWorkbenchAlertsState({ kind: "other", version: 1, alerts: [] })).toBe(false);
    expect(isWorkbenchAlertsState({ kind: "workbench-alerts", version: 1, alerts: {} })).toBe(
      false,
    );
    expect(
      isWorkbenchAlertsState({ kind: "workbench-alerts", version: 1, alerts: [null] }),
    ).toBe(false);
  });

  it("rejects malformed alert fields, status, direction, price, and timestamps", () => {
    const validState = createWorkbenchAlertsState({ alerts: [baseAlert] });

    expect(isWorkbenchAlertsState(validState)).toBe(true);
    expect(
      isWorkbenchAlertsState(createWorkbenchAlertsState({ alerts: [{ ...baseAlert, id: "" }] })),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({ alerts: [{ ...baseAlert, label: "   " }] }),
      ),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({
          alerts: [{ ...baseAlert, status: "unknown" as WorkbenchAlertStateV1["status"] }],
        }),
      ),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({
          alerts: [
            {
              ...baseAlert,
              condition: {
                ...baseAlert.condition,
                direction: "sideways" as WorkbenchAlertStateV1["condition"]["direction"],
              },
            },
          ],
        }),
      ),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({
          alerts: [{ ...baseAlert, condition: { ...baseAlert.condition, symbol: "" } }],
        }),
      ),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({
          alerts: [{ ...baseAlert, condition: { ...baseAlert.condition, timeframe: "" } }],
        }),
      ),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({
          alerts: [{ ...baseAlert, condition: { ...baseAlert.condition, price: Number.NaN } }],
        }),
      ),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({
          alerts: [{ ...baseAlert, createdAt: Number.POSITIVE_INFINITY }],
        }),
      ),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({ alerts: [{ ...baseAlert, updatedAt: Number.NaN }] }),
      ),
    ).toBe(false);
    expect(
      isWorkbenchAlertsState(
        createWorkbenchAlertsState({
          alerts: [{ ...baseAlert, triggeredAt: Number.NEGATIVE_INFINITY }],
        }),
      ),
    ).toBe(false);
  });

  it("saves, loads, and clears alerts state from localStorage", async () => {
    const storage = createMemoryStorage();
    const provider = createLocalStorageWorkbenchAlertsProvider(storage, "chartx2:test-alerts");
    const state = createWorkbenchAlertsState({
      alerts: [{ ...baseAlert, status: "triggered", triggeredAt: 1776873660000 }],
    });

    await expect(provider.saveWorkbenchAlerts(state)).resolves.toBe(true);
    await expect(provider.loadWorkbenchAlerts()).resolves.toEqual(state);

    await provider.clearWorkbenchAlerts();
    await expect(provider.loadWorkbenchAlerts()).resolves.toBeNull();
  });

  it("returns null for invalid persisted JSON and invalid persisted shape", async () => {
    const storage = createMemoryStorage();
    const provider = createLocalStorageWorkbenchAlertsProvider(storage, "chartx2:test-alerts");

    storage.setItem("chartx2:test-alerts", "{bad json");
    await expect(provider.loadWorkbenchAlerts()).resolves.toBeNull();

    storage.setItem(
      "chartx2:test-alerts",
      JSON.stringify({ kind: "workbench-alerts", version: 1, alerts: [{ ...baseAlert, id: "" }] }),
    );
    await expect(provider.loadWorkbenchAlerts()).resolves.toBeNull();
  });

  it("tolerates storage exceptions", async () => {
    const provider = createLocalStorageWorkbenchAlertsProvider(
      createThrowingStorage(),
      "chartx2:test-alerts",
    );

    await expect(provider.loadWorkbenchAlerts()).resolves.toBeNull();
    await expect(provider.saveWorkbenchAlerts(createWorkbenchAlertsState({ alerts: [baseAlert] })))
      .resolves.toBe(false);
    await expect(provider.clearWorkbenchAlerts()).resolves.toBeUndefined();
  });
});
