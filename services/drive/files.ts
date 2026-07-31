import { driveGet, driveMultipartUpload, driveUpdateContent, drivePatch, driveDelete } from "./client";
import { DRIVE_FIELDS } from "@/config/app";
import type { DriveFile, DriveFilesListResponse } from "@/types/drive";

/**
 * Uploads a new file (metadata + content) using multipart upload
 */
export async function uploadFile(
  name: string,
  content: Blob,
  parentId: string,
  mimeType?: string
): Promise<DriveFile> {
  return driveMultipartUpload<DriveFile>(
    { name, parents: [parentId], mimeType: mimeType || content.type },
    content
  );
}

/**
 * Updates an existing file's content
 */
export async function updateFileContent(
  fileId: string,
  content: Blob
): Promise<DriveFile> {
  return driveUpdateContent<DriveFile>(fileId, content);
}

/**
 * Updates an existing file's metadata (name, description, etc.)
 */
export async function updateFileMetadata(
  fileId: string,
  metadata: Partial<{ name: string; description: string }>
): Promise<DriveFile> {
  return drivePatch<DriveFile>(`/files/${fileId}`, metadata);
}

/**
 * Downloads a file's content as text
 */
export async function downloadFileAsText(fileId: string): Promise<string> {
  const token = (await import("@/lib/auth/storage")).tokenStorage.getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Downloads a file's content as a Blob
 */
export async function downloadFileAsBlob(fileId: string): Promise<Blob> {
  const token = (await import("@/lib/auth/storage")).tokenStorage.getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  return response.blob();
}

/**
 * Exports a native Google Workspace file, such as Google Docs, as plain text.
 */
export async function exportGoogleDocAsText(fileId: string): Promise<string> {
  const token = (await import("@/lib/auth/storage")).tokenStorage.getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}/export`);
  url.searchParams.set("mimeType", "text/plain");

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`);
  }

  return response.text();
}

/**
 * Gets the public thumbnail URL for an image file
 */
export function getFileThumbnailUrl(fileId: string, accessToken: string): string {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${accessToken}`;
}

/**
 * Permanently deletes a file
 */
export async function deleteFile(fileId: string): Promise<void> {
  return driveDelete(`/files/${fileId}`);
}

/**
 * Lists files within a folder matching optional MIME type
 */
export async function listFilesInFolder(
  parentId: string,
  mimeType?: string
): Promise<DriveFile[]> {
  const conditions = [
    `'${parentId}' in parents`,
    "trashed = false",
    `mimeType != 'application/vnd.google-apps.folder'`,
  ];
  if (mimeType) conditions.push(`mimeType = '${mimeType}'`);

  const result = await driveGet<DriveFilesListResponse>("/files", {
    q: conditions.join(" and "),
    fields: DRIVE_FIELDS.fileList,
    orderBy: "name",
    pageSize: "200",
  });

  return result.files;
}

/**
 * Finds a file by name inside a folder
 */
export async function findFileByName(
  name: string,
  parentId: string
): Promise<DriveFile | null> {
  const result = await driveGet<DriveFilesListResponse>("/files", {
    q: `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and trashed = false`,
    fields: DRIVE_FIELDS.fileList,
    pageSize: "1",
  });
  return result.files[0] || null;
}

/**
 * Gets a file's metadata by ID
 */
export async function getFileMeta(fileId: string): Promise<DriveFile> {
  return driveGet<DriveFile>(`/files/${fileId}`, {
    fields: DRIVE_FIELDS.file,
  });
}

/**
 * Moves a file to a new parent
 */
export async function moveFile(
  fileId: string,
  newParentId: string,
  currentParentId: string
): Promise<DriveFile> {
  const token = (await import("@/lib/auth/storage")).tokenStorage.getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const url = new URL(`https://www.googleapis.com/drive/v3/files/${fileId}`);
  url.searchParams.set("addParents", newParentId);
  url.searchParams.set("removeParents", currentParentId);
  url.searchParams.set("fields", DRIVE_FIELDS.file);

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });

  if (!response.ok) throw new Error(`Move failed: ${response.statusText}`);
  return response.json();
}
