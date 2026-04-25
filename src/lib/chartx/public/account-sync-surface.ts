export type AccountSyncStatus = "loading" | "ready" | "offline" | "error";
export type AccountSyncTargetState = "idle" | "syncing" | "synced" | "error";

export interface AccountSyncTargetModel {
  id: string;
  label: string;
  detailLabel?: string;
  state: AccountSyncTargetState;
  stateLabel: string;
  lastUpdatedLabel?: string;
  errorLabel?: string;
}

export interface AccountSyncStateModel {
  status: AccountSyncStatus;
  statusLabel: string;
  detailLabel?: string;
  errorLabel?: string;
}

export interface AccountSyncSurfaceModel {
  providerLabel: string;
  accountLabel?: string;
  state: AccountSyncStateModel;
  targets: readonly AccountSyncTargetModel[];
  actionLabel?: string;
}

export interface AccountSyncRefreshRequest {
  providerId: string;
  accountId?: string;
}

export type AccountSyncRefreshResult =
  | {
      ok: true;
      statusLabel: string;
      detailLabel?: string;
      syncedAtLabel?: string;
    }
  | {
      ok: false;
      errorLabel: string;
      detailLabel?: string;
    };

export interface AccountSyncSurfaceHostAdapter {
  refreshStatus(request: AccountSyncRefreshRequest): Promise<AccountSyncRefreshResult>;
}
