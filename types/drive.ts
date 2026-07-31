export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  createdTime: string;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  iconLink?: string;
  lastModifyingUser?: {
    displayName?: string;
    emailAddress?: string;
    photoLink?: string;
    me?: boolean;
  };
  starred?: boolean;
  trashed?: boolean;
  description?: string;
  imageMediaMetadata?: {
    width: number;
    height: number;
    rotation?: number;
  };
}

export interface DriveFileWithPath extends DriveFile {
  folderPath: string[];
  displayPath: string;
}

export interface DriveFolder extends DriveFile {
  mimeType: "application/vnd.google-apps.folder";
  childCount?: number;
}

export interface DriveFilesListResponse {
  kind: string;
  nextPageToken?: string;
  incompleteSearch: boolean;
  files: DriveFile[];
}

export interface DriveFileCreateResponse extends DriveFile {}

export interface DriveAbout {
  kind: string;
  storageQuota: {
    limit: string;
    usage: string;
    usageInDrive: string;
    usageInDriveTrash: string;
  };
  user: {
    kind: string;
    displayName: string;
    photoLink: string;
    me: boolean;
    permissionId: string;
    emailAddress: string;
  };
}

export interface DriveUploadProgress {
  fileId?: string;
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
}

export interface BreadcrumbItem {
  id: string;
  name: string;
}

export type DriveApiError = {
  code: number;
  message: string;
  status: string;
  errors?: { message: string; domain: string; reason: string }[];
};

export const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder" as const;
export const JSON_MIME_TYPE = "application/json" as const;
