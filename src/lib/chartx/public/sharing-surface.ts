export type ShareArtifactType = "layout" | "script" | "preset";
export type ShareVisibility = "private" | "unlisted" | "public";
export type ShareDialogStatus = "loading" | "ready" | "publishing" | "error";

export interface ShareDialogStateModel {
  status: ShareDialogStatus;
  statusLabel?: string;
  errorLabel?: string;
  publishEnabled: boolean;
}

export interface ShareLinkModel {
  label: string;
  href: string;
  copied?: boolean;
}

export interface ShareArtifactFieldModel {
  id: string;
  label: string;
  valueLabel: string;
}

export interface ShareDialogActionModel {
  id: string;
  label: string;
  disabled?: boolean;
  tone?: "default" | "primary";
}

export interface ShareHistoryEntryModel {
  id: string;
  versionLabel: string;
  statusLabel: string;
  visibility: ShareVisibility;
  createdAtLabel: string;
  noteLabel?: string;
}

export interface ShareReviewEntryModel {
  id: string;
  label: string;
  targetLabel: string;
  statusLabel: string;
  noteLabel?: string;
}

export interface SharePermissionEntryModel {
  id: string;
  label: string;
  statusLabel: string;
  scopeLabel: string;
  noteLabel?: string;
}

export interface ShareDialogModel {
  artifactType: ShareArtifactType;
  title: string;
  descriptionLabel?: string;
  visibility: ShareVisibility;
  artifactFields?: readonly ShareArtifactFieldModel[];
  link?: ShareLinkModel;
  historyEntries?: readonly ShareHistoryEntryModel[];
  reviewEntries?: readonly ShareReviewEntryModel[];
  permissionEntries?: readonly SharePermissionEntryModel[];
  secondaryActions?: readonly ShareDialogActionModel[];
  publishLabel: string;
  state: ShareDialogStateModel;
}

export interface SharePublishRequest {
  artifactType: ShareArtifactType;
  artifactId: string;
  title: string;
  visibility: ShareVisibility;
}

export type SharePublishResult =
  | {
      ok: true;
      shareId: string;
      href: string;
      statusLabel?: string;
    }
  | {
      ok: false;
      errorLabel: string;
      detailLabel?: string;
    };

export interface SharingSurfaceHostAdapter {
  publishArtifact(request: SharePublishRequest): Promise<SharePublishResult>;
}
