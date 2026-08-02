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
 * Searches for stories.json files recursively (2 levels deep) under a root folder.
 * Structure: root → book_folder → story_folder → stories.json
 */
export async function searchStoryFiles(
  rootFolderId: string,
  query?: string
): Promise<DriveFile[]> {
  // Level 1: direct children of root
  const level1Ids = await listSubfolderIds(rootFolderId);

  // Level 2: children of level1 folders (book folders → story folders)
  const level2Ids = (
    await Promise.all(level1Ids.map((id) => listSubfolderIds(id).catch(() => [])))
  ).flat();

  // All parent IDs to search within (root + level1 + level2)
  const allParentIds = [rootFolderId, ...level1Ids, ...level2Ids];

  if (allParentIds.length === 0) return [];

  // Drive queries have a URL length limit — batch in chunks of 50
  const CHUNK = 50;
  const chunks: string[][] = [];
  for (let i = 0; i < allParentIds.length; i += CHUNK) {
    chunks.push(allParentIds.slice(i, i + CHUNK));
  }

  const baseConditions = [
    "trashed = false",
    "mimeType = 'application/json'",
    `name = 'stories.json'`,
  ];
  if (query) {
    baseConditions.push(`fullText contains '${query.replace(/'/g, "\\'")}'`);
  }

  const allFiles: DriveFile[] = [];
  await Promise.all(
    chunks.map(async (chunk) => {
      const parentConditions = chunk.map((id) => `'${id}' in parents`).join(" or ");
      const conditions = [...baseConditions, `(${parentConditions})`];
      const result = await driveGet<DriveFilesListResponse>("/files", {
        q: conditions.join(" and "),
        fields: `nextPageToken,files(${DRIVE_FIELDS.file},parents)`,
        orderBy: "modifiedTime desc",
        pageSize: "1000",
      });
      allFiles.push(...result.files);
    })
  );

  return allFiles;
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
