import type { PhaseOneChartApi, PhaseOneTimeFocusRequest } from "./chart-api-types";
import type {
  PhaseOneMarketChartDataIdentityV1,
  PhaseOneMarketChartMountLifecycleReceiptV1,
  PhaseOneMarketChartTimeFocusCommandV1,
  PhaseOneMarketChartTimeFocusCompletionV1,
  PhaseOneMarketChartTimeFocusRejectedReasonV1,
} from "../../public/market-chart-lifecycle";

type ReservationState = "inflight" | "terminal";

type ReceiptLedger = {
  requestStates: Map<number, ReservationState>;
  greatestTerminalRequestId: number | null;
};

// Both ledgers are process-local. The command-object ledger covers malformed
// primitive/null receipts; the receipt/id ledger extends the same guarantee to
// equivalent command objects, remounts, and different component instances.
const mintedReceipts = new WeakSet<object>();
const commandReservations = new WeakMap<object, ReservationState>();
const receiptLedgers = new WeakMap<object, ReceiptLedger>();

function weakIdentity(value: unknown): object | null {
  return (typeof value === "object" && value !== null) || typeof value === "function"
    ? value as object
    : null;
}

function ledgerFor(receipt: object): ReceiptLedger {
  let ledger = receiptLedgers.get(receipt);
  if (ledger === undefined) {
    ledger = { requestStates: new Map(), greatestTerminalRequestId: null };
    receiptLedgers.set(receipt, ledger);
  }
  return ledger;
}

function snapshotCurrentIdentity(
  value: unknown,
): PhaseOneMarketChartDataIdentityV1 | null {
  if (typeof value !== "object" || value === null) return null;
  try {
    const key = (value as { key?: unknown }).key;
    return typeof key === "string" && key.trim().length > 0 ? Object.freeze({ key }) : null;
  } catch {
    return null;
  }
}

function validFocusRequest(value: unknown): value is PhaseOneTimeFocusRequest {
  if (typeof value !== "object" || value === null) return false;
  const request = value as Partial<PhaseOneTimeFocusRequest>;
  if (!Number.isFinite(request.time) || !Number.isFinite(request.maxDistance) || (request.maxDistance ?? -1) < 0) {
    return false;
  }
  return [request.paddingBeforeBars, request.paddingAfterBars].every(
    (padding) => padding === undefined || (Number.isSafeInteger(padding) && padding >= 0),
  );
}

function validRequestId(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function freezeCompletion<T extends PhaseOneMarketChartTimeFocusCompletionV1>(completion: T): T {
  return Object.freeze(completion);
}

/** Mint a nonserializable, reference-authenticated receipt for one generation. */
export function mintPhaseOneMarketChartMountLifecycleReceipt(): PhaseOneMarketChartMountLifecycleReceiptV1 {
  const receipt = Object.freeze(Object.create(null)) as PhaseOneMarketChartMountLifecycleReceiptV1;
  mintedReceipts.add(receipt);
  receiptLedgers.set(receipt, { requestStates: new Map(), greatestTerminalRequestId: null });
  return receipt;
}

export type PhaseOneMarketChartLifecycleState = Readonly<{
  mounted: boolean;
  receipt: PhaseOneMarketChartMountLifecycleReceiptV1 | null;
  dataIdentity: PhaseOneMarketChartDataIdentityV1 | undefined;
  chart: PhaseOneChartApi | null;
  axisReady: boolean;
}>;

/**
 * Consume one surface command. After reading one safe id, reserve the exact
 * command before any remaining field or resolver work so recursion cannot replay it.
 */
export function consumePhaseOneMarketChartTimeFocusCommand(
  command: unknown,
  state: PhaseOneMarketChartLifecycleState,
): PhaseOneMarketChartTimeFocusCompletionV1 | null {
  const commandObject = weakIdentity(command);
  if (commandObject === null) return null;
  const candidate = command as Partial<PhaseOneMarketChartTimeFocusCommandV1>;
  let requestId: unknown;
  try {
    requestId = candidate.requestId;
  } catch {
    return null;
  }

  // An invalid id is not correlatable. It cannot enter either ledger and must
  // never produce a completion containing a fabricated/coerced identifier.
  if (!validRequestId(requestId)) return null;
  if (commandReservations.has(commandObject)) return null;
  commandReservations.set(commandObject, "inflight");

  let receiptInput: unknown;
  try {
    receiptInput = candidate.mountLifecycleReceipt;
  } catch {
    commandReservations.set(commandObject, "terminal");
    return freezeCompletion({
      kind: "rejected",
      requestId,
      checkedMountLifecycleReceipt: null,
      currentDataIdentity: snapshotCurrentIdentity(state.dataIdentity),
      reason: "invalidRequest",
    });
  }

  const receipt = weakIdentity(receiptInput);
  const receiptLedger = receipt === null ? null : ledgerFor(receipt);
  if (receiptLedger?.requestStates.has(requestId)) {
    commandReservations.set(commandObject, "terminal");
    return null;
  }

  receiptLedger?.requestStates.set(requestId, "inflight");
  const currentDataIdentity = snapshotCurrentIdentity(state.dataIdentity);
  const checkedMountLifecycleReceipt = receipt !== null && mintedReceipts.has(receipt)
    ? receipt as PhaseOneMarketChartMountLifecycleReceiptV1
    : null;

  const markTerminal = (): void => {
    commandReservations.set(commandObject, "terminal");
    if (receiptLedger !== null) {
      receiptLedger.requestStates.set(requestId, "terminal");
      receiptLedger.greatestTerminalRequestId = Math.max(
        receiptLedger.greatestTerminalRequestId ?? requestId,
        requestId,
      );
    }
  };
  const reject = (reason: PhaseOneMarketChartTimeFocusRejectedReasonV1) => {
    markTerminal();
    return freezeCompletion({
      kind: "rejected" as const,
      requestId,
      checkedMountLifecycleReceipt,
      currentDataIdentity,
      reason,
    });
  };

  if (checkedMountLifecycleReceipt === null) return reject("invalidRequest");
  if (state.receipt !== receipt) return reject("superseded");
  if (!state.mounted) return reject("disposed");

  // The current id is already reserved but not terminal, so greatestTerminal
  // still describes only prior commands for the active receipt.
  if (
    receiptLedger !== null
    && receiptLedger.greatestTerminalRequestId !== null
    && requestId <= receiptLedger.greatestTerminalRequestId
  ) {
    return reject("staleRequest");
  }
  if (currentDataIdentity === null || state.chart === null || !state.axisReady) {
    return reject("dataNotReady");
  }
  let expectedDataIdentity: unknown;
  try {
    expectedDataIdentity = candidate.expectedDataIdentity;
  } catch {
    return reject("invalidRequest");
  }
  const expectedDataIdentitySnapshot = snapshotCurrentIdentity(expectedDataIdentity);
  if (expectedDataIdentitySnapshot === null) return reject("invalidRequest");
  if (currentDataIdentity.key !== expectedDataIdentitySnapshot.key) return reject("dataIdentityMismatch");

  let focus: unknown;
  try {
    focus = candidate.focus;
  } catch {
    return reject("invalidRequest");
  }
  if (!validFocusRequest(focus)) return reject("invalidRequest");

  try {
    // The pair is inflight before entering the resolver. If an adapter or test
    // recursively consumes the same command, that nested call is a silent no-op.
    const result = state.chart.timeScale().focusTime(focus);
    markTerminal();
    return freezeCompletion({
      kind: "completed",
      requestId,
      mountLifecycleReceipt: checkedMountLifecycleReceipt,
      dataIdentity: currentDataIdentity,
      request: focus,
      result,
    });
  } catch (error) {
    // Resolver/chart invariant failures are ChartX2 bugs, not lifecycle facts.
    // Terminalize private reservations so retry cannot duplicate side effects,
    // then preserve the original failure and emit no completion.
    markTerminal();
    throw error;
  }
}
