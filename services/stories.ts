import { uploadFile, updateFileContent, downloadFileAsText, deleteFile, findFileByName, listFilesInFolder } from "./drive/files";
import { createFolder, getOrCreateFolder, listFolderContents, deleteFile as deleteFolder } from "./drive/folders";
import { searchStoryFiles } from "./drive/search";
import { APP_CONFIG } from "@/config/app";
import type { Story, StoryWithMeta } from "@/types/story";
import type { DriveFile } from "@/types/drive";

export interface CreateStoryOptions {
  story: Story;
  rootFolderId: string;
  country?: string;
  collection?: string;
  storyFolderName?: string;
  targetFolderId?: string;
  /** Custom filename for the story json (e.g. "my_story.json"). Required when using targetFolderId. */
  fileName?: string;
}

/**
 * Creates a story in Drive.
 * - If `targetFolderId` + `fileName` are given: uploads story.json directly to targetFolderId (no new subfolder).
 * - Otherwise: creates a country/collection/storyFolder hierarchy and uploads inside.
 */
export async function createStory(options: CreateStoryOptions): Promise<{
  storyFolderId: string;
  storyFileId: string;
}> {
  const { story, rootFolderId, country, collection, storyFolderName, targetFolderId, fileName } = options;

  let parentFolderId = rootFolderId;

  if (targetFolderId && fileName) {
    // Direct placement: upload the .json directly into the selected folder
    parentFolderId = targetFolderId;
  } else {
    // Folder hierarchy mode
    if (country) {
      parentFolderId = (await getOrCreateFolder(country, parentFolderId)).id;
    }
    if (collection) {
      parentFolderId = (await getOrCreateFolder(collection, parentFolderId)).id;
    }
    if (storyFolderName) {
      parentFolderId = (await createFolder(storyFolderName, parentFolderId)).id;
    }
  }

  // Upload story JSON
  const actualFileName = fileName || APP_CONFIG.storyFileName;
  const storyJson = JSON.stringify(story, null, 2);
  const blob = new Blob([storyJson], { type: "application/json" });
  const storyFile = await uploadFile(actualFileName, blob, parentFolderId, "application/json");

  return { storyFolderId: parentFolderId, storyFileId: storyFile.id };
}


/**
 * Reads and parses a story.json from Drive
 */
export async function readStory(fileId: string): Promise<Story> {
  const text = await downloadFileAsText(fileId);
  const parsed = JSON.parse(text) as Story;
  return parsed;
}

/**
 * Updates a story.json in Drive
 */
export async function updateStory(fileId: string, story: Story): Promise<DriveFile> {
  const json = JSON.stringify(story, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  return updateFileContent(fileId, blob);
}

/**
 * Deletes the story JSON file and image files in the same folder.
 * Other files (non-image, non-json) in the folder are NOT touched.
 */
export async function deleteStoryFolder(storyFileId: string): Promise<void> {
  // Get the JSON file's parent folder
  const { driveGet } = await import("./drive/client");
  const file = await driveGet<{ id: string; parents?: string[] }>(`/files/${storyFileId}`, {
    fields: "id,parents"
  });
  const parentFolderId = file.parents?.[0];

  // Delete the story JSON file first
  await deleteFile(storyFileId);

  // Delete ONLY image files in the same folder
  if (parentFolderId) {
    const { listFilesInFolder } = await import("./drive/files");
    const allFiles = await listFilesInFolder(parentFolderId);
    const imageFiles = allFiles.filter(f => f.mimeType.startsWith("image/"));
    if (imageFiles.length > 0) {
      await Promise.all(imageFiles.map(f => deleteFile(f.id)));
    }
  }
}

/**
 * Lists all story.json files under the root folder
 */
export async function listAllStories(rootFolderId: string): Promise<DriveFile[]> {
  return searchStoryFiles(rootFolderId);
}

/**
 * Fetches and hydrates all stories with their metadata
 */
export async function fetchStoriesWithMeta(
  rootFolderId: string
): Promise<StoryWithMeta[]> {
  const storyFiles = await listAllStories(rootFolderId);
  const fetchedIds = new Set(storyFiles.map(f => f.id));

  // Check for any pending stories that haven't been indexed by Drive yet
  let pendingIds: string[] = [];
  if (typeof window !== "undefined") {
    try {
      const { pendingStoryStorage } = await import("@/lib/auth/storage");
      const currentPending = pendingStoryStorage.getPending();
      
      for (const id of currentPending) {
        if (fetchedIds.has(id)) {
          // It was found! Drive has indexed it, we can remove it.
          pendingStoryStorage.removePending(id);
        } else {
          // Still not indexed, we need to fetch it manually
          pendingIds.push(id);
        }
      }
    } catch (e) {
      console.warn("Failed to process pending stories", e);
    }
  }

  // We need to construct DriveFile-like objects for pending IDs so they can be processed
  // Normally `listAllStories` returns files with parents, but we might not know the exact parent
  // We'll just fetch the file directly to get its parents
  const { driveGet } = await import("./drive/client");
  const { DRIVE_FIELDS } = await import("@/config/app");
  
  const pendingFilesPromises = pendingIds.map(async (id) => {
    try {
      const file = await driveGet<DriveFile>(`/files/${id}`, {
        fields: DRIVE_FIELDS.file + ",parents"
      });
      return file;
    } catch {
      return null;
    }
  });

  const pendingFilesResult = await Promise.all(pendingFilesPromises);
  const validPendingFiles = pendingFilesResult.filter(Boolean) as DriveFile[];

  const allFilesToProcess = [...storyFiles, ...validPendingFiles];

  const stories = await Promise.allSettled(
    allFilesToProcess.map(async (file) => {
      const story = await readStory(file.id);
      const parentId = file.parents?.[0] || "";

      return {
        ...story,
        driveFileId: file.id,
        driveFolderId: parentId,
        lastModified: file.modifiedTime,
        folderPath: [] as string[],
      } satisfies StoryWithMeta;
    })
  );

  const fetched = stories
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<StoryWithMeta>).value);

  // Deduplicate by driveFileId
  const seen = new Set<string>();
  const deduped = fetched.filter(s => {
    if (seen.has(s.driveFileId)) return false;
    seen.add(s.driveFileId);
    return true;
  });

  // Batch-fetch unique folder names (one request per unique folder)
  const uniqueFolderIds = [...new Set(deduped.map(s => s.driveFolderId).filter(Boolean))];
  const folderNameMap: Record<string, string> = {};

  await Promise.all(
    uniqueFolderIds.map(async (folderId) => {
      try {
        const folder = await driveGet<{ id: string; name: string }>(`/files/${folderId}`, {
          fields: "id,name"
        });
        folderNameMap[folderId] = folder.name;
      } catch {
        folderNameMap[folderId] = folderId; // fallback to ID if fetch fails
      }
    })
  );

  return deduped.map(s => ({
    ...s,
    folderName: folderNameMap[s.driveFolderId] || s.driveFolderId,
  }));
}

/**
 * Duplicates a story into the same parent folder with a new ID
 */
export async function duplicateStory(
  sourceFileId: string,
  sourceFolderId: string,
  newStoryId: string,
  newFolderName: string
): Promise<{ storyFolderId: string; storyFileId: string }> {
  // Read original story
  const story = await readStory(sourceFileId);

  // Get source folder parent
  const { getFile } = await import("./drive/folders");
  const sourceFolder = await getFile(sourceFolderId);
  const parentId = sourceFolder.parents?.[0] || "";

  // Create new story folder
  const newFolder = await createFolder(newFolderName, parentId);

  // Upload with new ID
  const newStory: Story = { ...story, story_id: newStoryId };
  const blob = new Blob([JSON.stringify(newStory, null, 2)], { type: "application/json" });
  const newFile = await uploadFile(APP_CONFIG.storyFileName, blob, newFolder.id, "application/json");

  return { storyFolderId: newFolder.id, storyFileId: newFile.id };
}

/**
 * Gets all image files inside a story folder
 */
export async function getStoryImages(storyFolderId: string): Promise<DriveFile[]> {
  const files = await listFilesInFolder(storyFolderId);
  return files.filter(
    (f) =>
      f.mimeType.startsWith("image/") &&
      f.name !== APP_CONFIG.storyFileName
  );
}
