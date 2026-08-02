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
 * Searches for stories.json files. 
 * Tries a global search first. If none found (which happens with shared folders not in My Drive),
 * it falls back to a BFS traversal up to depth 2 to find the files explicitly by parent IDs.
 */
export async function searchStoryFiles(
  rootFolderId: string,
  query?: string
): Promise<DriveFile[]> {
  const conditions = [
    "trashed = false",
    "mimeType = 'application/json'",
    `name = 'stories.json'`,
  ];

  if (query) {
    conditions.push(`fullText contains '${query.replace(/'/g, "\\'")}'`);
  }

  // 1. Try global search first (fastest, works for owned files)
  const result = await driveGet<DriveFilesListResponse>("/files", {
    q: conditions.join(" and "),
    fields: `nextPageToken,files(${DRIVE_FIELDS.file},parents)`,
    orderBy: "modifiedTime desc",
    pageSize: "1000",
    corpora: "allDrives",
  });

  let files = result.files || [];

  // 2. If global search returns empty, fallback to tree traversal (slower, but works for shared links)
  // We only do this if there is no fullText query (since we can't easily filter fullText in traversal efficiently if we just want to find if ANY exist)
  // Actually, we can just fetch all stories.json and the frontend will filter them.
  if (files.length === 0 && rootFolderId && !query) {
    console.log("Global search returned 0 files. Falling back to simple tree traversal...");
    
    // Recursive function to search for folders and stories.json
    async function traverseAndSearch(folderId: string, depth: number): Promise<DriveFile[]> {
      if (depth > 3) return [];
      
      const q = `'${folderId}' in parents and trashed = false`;
      const res = await driveGet<DriveFilesListResponse>("/files", {
        q,
        fields: `nextPageToken,files(${DRIVE_FIELDS.file},parents)`,
        pageSize: "1000",
        corpora: "allDrives"
      });
      
      const currentFiles = res.files || [];
      const storiesJsonFiles = currentFiles.filter(f => f.name === 'stories.json');
      const childFolders = currentFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
      
      const nestedPromises = childFolders.map(folder => traverseAndSearch(folder.id, depth + 1));
      const nestedResults = await Promise.all(nestedPromises);
      
      return [...storiesJsonFiles, ...nestedResults.flat()];
    }
    
    try {
      const allStories = await traverseAndSearch(rootFolderId, 0);
      files.push(...allStories);
    } catch (err) {
      console.warn("Tree traversal failed:", err);
      // Let it throw so UI can show error, or we can throw it explicitly
      throw err;
    }
  }

  return files;
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
