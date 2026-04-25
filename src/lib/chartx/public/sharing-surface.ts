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

export interface ShareDialogModel {
  artifactType: ShareArtifactType;
  title: string;
  descriptionLabel?: string;
  visibility: ShareVisibility;
  link?: ShareLinkModel;
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
