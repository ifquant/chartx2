import type {
  PhaseOneTimeFocusRequest,
  PhaseOneTimeFocusResult,
} from "./market";

/**
 * An opaque proof that identifies one ready Market Chart surface generation.
 *
 * This declaration is nominal TypeScript ergonomics only. The surface verifies
 * the exact object reference against module-private runtime state; consumers
 * cannot construct, serialize, clone, or inspect a valid receipt.
 */
export declare class PhaseOneMarketChartMountLifecycleReceiptV1 {
  private readonly phaseOneMarketChartMountLifecycleReceiptV1: never;
  private constructor();
}

/** A host-owned stable key for exactly the axis data currently shown by a surface. */
export type PhaseOneMarketChartDataIdentityV1 = Readonly<{
  readonly key: string;
}>;

/** A declarative request for the current surface generation to focus one axis time. */
export type PhaseOneMarketChartTimeFocusCommandV1 = Readonly<{
  readonly requestId: number;
  readonly mountLifecycleReceipt: PhaseOneMarketChartMountLifecycleReceiptV1;
  readonly expectedDataIdentity: PhaseOneMarketChartDataIdentityV1;
  readonly focus: PhaseOneTimeFocusRequest;
}>;

export type PhaseOneMarketChartTimeFocusRejectedReasonV1 =
  | "staleRequest"
  | "dataIdentityMismatch"
  | "dataNotReady"
  | "invalidRequest"
  | "disposed"
  | "superseded";

/** The one terminal fact emitted for a lifecycle command. */
export type PhaseOneMarketChartTimeFocusCompletionV1 =
  | Readonly<{
      readonly kind: "completed";
      readonly requestId: number;
      readonly mountLifecycleReceipt: PhaseOneMarketChartMountLifecycleReceiptV1;
      readonly dataIdentity: PhaseOneMarketChartDataIdentityV1;
      readonly request: PhaseOneTimeFocusRequest;
      readonly result: PhaseOneTimeFocusResult;
    }>
  | Readonly<{
      readonly kind: "rejected";
      readonly requestId: number;
      /** The receipt authenticated by ChartX2, or null for untrusted input. */
      readonly checkedMountLifecycleReceipt: PhaseOneMarketChartMountLifecycleReceiptV1 | null;
      /** The shallow-frozen current surface identity, never the command fallback. */
      readonly currentDataIdentity: PhaseOneMarketChartDataIdentityV1 | null;
      readonly reason: PhaseOneMarketChartTimeFocusRejectedReasonV1;
    }>;
