import { driveGet } from "./client";
import { DRIVE_FIELDS } from "@/config/app";
import type { DriveFile, DriveFilesListResponse } from "@/types/drive";

interface SearchOptions {
  rootFolderId?: string;
  query: string;
  mimeType?: string;
  pageToken?: string;
  pageSize?: number;
}

/**
 * Full-text search across all Drive files
 */
export async function searchDriveFiles(
  options: SearchOptions
): Promise<DriveFilesListResponse> {
  const conditions: string[] = ["trashed = false"];

  if (options.rootFolderId) {
    conditions.push(`'${options.rootFolderId}' in parents`);
  }

  if (options.query) {
    // Drive full-text search
    conditions.push(`fullText contains '${options.query.replace(/'/g, "\\'")}'`);
  }

  if (options.mimeType) {
    conditions.push(`mimeType = '${options.mimeType}'`);
  }

  return driveGet<DriveFilesListResponse>("/files", {
    q: conditions.join(" and "),
    fields: DRIVE_FIELDS.fileList,
    orderBy: "modifiedTime desc",
    pageSize: String(options.pageSize || 50),
    ...(options.pageToken ? { pageToken: options.pageToken } : {}),
  });
}

/**
 * Lists all subfolder IDs under a given parent (1 level deep).
 */
async function listSubfolderIds(parentId: string): Promise<string[]> {
  const result = await driveGet<DriveFilesListResponse>("/files", {
    q: `'${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: "files(id)",
    pageSize: "200",
  });
  return result.files.map((f) => f.id);
}

/**
 * Searches for JSON files (story.json) recursively under a root folder
 */
export async function searchStoryFiles(
  rootFolderId: string,
  query?: string
): Promise<DriveFile[]> {
  // Step 1: Get all direct child folder IDs
  const childFolderIds = await listSubfolderIds(rootFolderId);

  // The search scope includes rootFolderId itself + all child folders
  const allParentIds = [rootFolderId, ...childFolderIds];

  // Step 2: Build query to match stories.json in any of those folders
  const parentConditions = allParentIds
    .map((id) => `'${id}' in parents`)
    .join(" or ");

  const conditions = [
    "trashed = false",
    "mimeType = 'application/json'",
    `name = 'stories.json'`,
    `(${parentConditions})`,
  ];

  if (query) {
    conditions.push(`fullText contains '${query.replace(/'/g, "\\'")}'`);
  }

  const result = await driveGet<DriveFilesListResponse>("/files", {
    q: conditions.join(" and "),
    fields: `nextPageToken,files(${DRIVE_FIELDS.file},parents)`,
    orderBy: "modifiedTime desc",
    pageSize: "1000",
  });

  return result.files;
}

/**
 * Lists all image files under a story folder
 */
export async function listStoryImages(
  storyFolderId: string
): Promise<DriveFile[]> {
  const result = await driveGet<DriveFilesListResponse>("/files", {
    q: `'${storyFolderId}' in parents and trashed = false and (mimeType contains 'image/')`,
    fields: DRIVE_FIELDS.fileList,
    orderBy: "name",
    pageSize: "100",
  });

  return result.files;
}
