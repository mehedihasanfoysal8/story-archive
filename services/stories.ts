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
 * Deletes an entire story folder (including all files inside)
 */
export async function deleteStoryFolder(storyFolderId: string): Promise<void> {
  return deleteFolder(storyFolderId);
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

  const stories = await Promise.allSettled(
    storyFiles.map(async (file) => {
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

  return stories
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<StoryWithMeta>).value);
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
