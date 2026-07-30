import { driveGet, drivePost, drivePatch, driveDelete } from "./client";
import { DRIVE_FIELDS } from "@/config/app";
import type { DriveFile, DriveFolder, DriveFilesListResponse, BreadcrumbItem } from "@/types/drive";

export const FOLDER_MIME = "application/vnd.google-apps.folder";
export const DOC_MIME = "application/vnd.google-apps.document";

/**
 * Creates a new folder inside a parent folder
 */
export async function createFolder(
  name: string,
  parentId: string
): Promise<DriveFolder> {
  return drivePost<DriveFolder>("/files", {
    name,
    mimeType: FOLDER_MIME,
    parents: [parentId],
  });
}

/**
 * Creates a new native Google Docs document inside a parent folder
 */
export async function createGoogleDoc(
  name: string,
  parentId: string
): Promise<DriveFile> {
  return drivePost<DriveFile>("/files", {
    name,
    mimeType: DOC_MIME,
    parents: [parentId],
  });
}

/**
 * Lists all folders and/or files inside a parent folder
 */
export async function listFolderContents(
  parentId: string,
  options: {
    foldersOnly?: boolean;
    filesOnly?: boolean;
    pageToken?: string;
    pageSize?: number;
  } = {}
): Promise<DriveFilesListResponse> {
  const mimeFilter = options.foldersOnly
    ? `mimeType = '${FOLDER_MIME}'`
    : options.filesOnly
    ? `mimeType != '${FOLDER_MIME}'`
    : "";

  const query = [
    `'${parentId}' in parents`,
    "trashed = false",
    mimeFilter,
  ]
    .filter(Boolean)
    .join(" and ");

  return driveGet<DriveFilesListResponse>("/files", {
    q: query,
    fields: DRIVE_FIELDS.fileList,
    orderBy: "folder,name",
    pageSize: String(options.pageSize || 1000),
    ...(options.pageToken ? { pageToken: options.pageToken } : {}),
  });
}

/**
 * Gets a single file or folder by ID
 */
export async function getFile(fileId: string): Promise<DriveFile> {
  return driveGet<DriveFile>(`/files/${fileId}`, {
    fields: DRIVE_FIELDS.file,
  });
}

/**
 * Renames a file or folder
 */
export async function renameFile(
  fileId: string,
  newName: string
): Promise<DriveFile> {
  return drivePatch<DriveFile>(`/files/${fileId}`, { name: newName });
}

/**
 * Moves a file or folder to a new parent
 */
export async function moveFile(
  fileId: string,
  newParentId: string,
  currentParentId: string
): Promise<DriveFile> {
  const token = (await import("@/lib/auth/storage")).tokenStorage.getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const url = new URL(
    `https://www.googleapis.com/drive/v3/files/${fileId}`
  );
  url.searchParams.set("addParents", newParentId);
  url.searchParams.set("removeParents", currentParentId);
  url.searchParams.set("fields", DRIVE_FIELDS.file);

  const response = await fetch(url.toString(), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Move failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Permanently deletes a file or folder (and all its contents)
 */
export async function deleteFile(fileId: string): Promise<void> {
  return driveDelete(`/files/${fileId}`);
}

/**
 * Copies a file to a new parent folder with a new name
 */
export async function copyFile(
  fileId: string,
  newName: string,
  parentId: string
): Promise<DriveFile> {
  return drivePost<DriveFile>(`/files/${fileId}/copy`, {
    name: newName,
    parents: [parentId],
  });
}

/**
 * Gets the full path (breadcrumb) for a folder by walking up the parent chain
 */
export async function getFolderBreadcrumb(
  folderId: string,
  rootFolderId: string
): Promise<BreadcrumbItem[]> {
  const crumbs: BreadcrumbItem[] = [];
  let currentId = folderId;

  while (currentId && currentId !== rootFolderId) {
    const file = await getFile(currentId);
    crumbs.unshift({ id: file.id, name: file.name });
    currentId = file.parents?.[0] || "";
  }

  // Add root
  const root = await getFile(rootFolderId);
  crumbs.unshift({ id: root.id, name: root.name });

  return crumbs;
}

/**
 * Lists all folders recursively (up to 2 levels for tree view)
 */
export async function listAllFolders(
  parentId: string,
  depth = 0,
  maxDepth = 3
): Promise<(DriveFolder & { children?: DriveFolder[] })[]> {
  const response = await listFolderContents(parentId, { foldersOnly: true });
  const folders = response.files as DriveFolder[];

  if (depth >= maxDepth) return folders;

  const withChildren = await Promise.all(
    folders.map(async (folder) => {
      const children = await listAllFolders(folder.id, depth + 1, maxDepth);
      return { ...folder, children };
    })
  );

  return withChildren;
}

/**
 * Searches for a folder by name inside a parent
 */
export async function findFolderByName(
  name: string,
  parentId: string
): Promise<DriveFolder | null> {
  const result = await driveGet<DriveFilesListResponse>("/files", {
    q: `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: DRIVE_FIELDS.fileList,
    pageSize: "1",
  });
  return (result.files[0] as DriveFolder) || null;
}

/**
 * Creates a folder only if it doesn't already exist
 */
export async function getOrCreateFolder(
  name: string,
  parentId: string
): Promise<DriveFolder> {
  const existing = await findFolderByName(name, parentId);
  if (existing) return existing;
  return createFolder(name, parentId);
}
