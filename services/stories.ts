import { uploadFile, updateFileContent, downloadFileAsText, deleteFile, listFilesInFolder, findFileByName } from "./drive/files";
import { searchStoryFiles } from "./drive/search";
import { APP_CONFIG, DRIVE_FIELDS } from "@/config/app";
import type { Story, StoryWithMeta } from "@/types/story";
import type { DriveFile } from "@/types/drive";
import { driveGet } from "./drive/client";

// ---------------------------------------------------------------------------
// Helpers: human-readable newlines in JSON string values
// ---------------------------------------------------------------------------

/**
 * After JSON.stringify, replaces \n escape sequences with actual newlines
 * so the file is human-readable. Also replaces escaped double quotes (\")
 * with standard double quotes (") as requested by the user.
 */
function toHumanReadable(json: string): string {
  return json
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, '"');
}

/**
 * Before JSON.parse, escapes actual newlines and standard double quotes
 * that are INSIDE string values back to their escaped forms, so the parser
 * can handle them. We use regex to identify string values based on the
 * known formatting of our custom JSON.
 */
function toValidJson(content: string): string {
  return content.replace(
    /"([a-zA-Z0-9_]+)":\s*"([\s\S]*?)"(?=,\n\s*"[a-zA-Z0-9_]+":|\n\s*\})/g,
    (match, key, innerString) => {
      const escapedInner = innerString
        .replace(/\\/g, "\\\\") // Escape existing backslashes
        .replace(/"/g, '\\"')  // Escape double quotes
        .replace(/\n/g, "\\n") // Escape newlines
        .replace(/\r/g, "");   // Strip carriage returns just in case
      return `"${key}": "${escapedInner}"`;
    }
  );
}

// ---------------------------------------------------------------------------
// Core read/write helpers
// ---------------------------------------------------------------------------

/**
 * Reads a stories.json file.
 * Supports:
 *   - {obj1},{obj2}  (our format — comma-separated objects, no outer brackets)
 *   - [{obj1},{obj2}] (legacy standard JSON array)
 * Also handles actual newlines stored in text fields.
 */
export async function readStoriesArray(fileId: string): Promise<Story[]> {
  const raw = (await downloadFileAsText(fileId)).trim();
  if (!raw) return [];

  // First, escape actual newlines inside string values back to \n
  const escaped = toValidJson(raw);

  // Wrap in [] if not already an array
  const jsonToParse = escaped.startsWith("[")
    ? escaped
    : "[" + escaped.replace(/,\s*$/, "") + "]";

  try {
    const parsed = JSON.parse(jsonToParse);
    return Array.isArray(parsed) ? (parsed as Story[]) : [parsed as Story];
  } catch (err) {
    console.error("Failed to parse stories JSON:", err);
    return [];
  }
}

/**
 * Writes stories as comma-separated JSON objects WITHOUT outer brackets.
 * Newlines in text values are stored as actual newlines (not \\n).
 */
export async function writeStoriesArray(fileId: string, stories: Story[]): Promise<DriveFile> {
  const parts = stories.map((s) => toHumanReadable(JSON.stringify(s, null, 2)));
  const content = parts.join(",\n");
  const blob = new Blob([content], { type: "application/json" });
  return updateFileContent(fileId, blob);
}

// ---------------------------------------------------------------------------
// Public CRUD operations
// ---------------------------------------------------------------------------

export interface AddStoryOptions {
  /** Drive folder ID where stories.json lives (or will be created) */
  folderId: string;
  story: Story;
}

/**
 * Adds a story to the folder's stories.json.
 * Creates stories.json if it doesn't exist yet.
 * Returns the Drive file ID of stories.json.
 */
export async function addStoryToFolder(options: AddStoryOptions): Promise<string> {
  const { folderId, story } = options;

  // Sync images
  const images = await getStoryImages(folderId, story.story_id);
  story.image_ids = images.map(img => img.name);
  story.num_images = images.length;

  // Find existing stories.json in the folder
  const existing = await findFileByName(APP_CONFIG.storyFileName, folderId);

  if (existing) {
    // Read existing array, append, write back
    const stories = await readStoriesArray(existing.id);

    // Prevent duplicate story_id
    if (stories.some((s) => s.story_id === story.story_id)) {
      throw new Error(`A story with ID "${story.story_id}" already exists in this folder.`);
    }

    stories.push(story);
    await writeStoriesArray(existing.id, stories);
    return existing.id;
  } else {
    // Create new stories.json with this story as first entry (no outer brackets)
    const content = toHumanReadable(JSON.stringify(story, null, 2));
    const blob = new Blob([content], { type: "application/json" });
    const file = await uploadFile(APP_CONFIG.storyFileName, blob, folderId, "application/json");
    return file.id;
  }
}

/**
 * Reads a single story from a stories.json file by story_id.
 */
export async function readStory(storiesFileId: string, storyId: string): Promise<Story> {
  const stories = await readStoriesArray(storiesFileId);
  const found = stories.find((s) => s.story_id === storyId);
  if (!found) throw new Error(`Story "${storyId}" not found in file.`);
  return found;
}

/**
 * Updates a single story in its stories.json file.
 */
export async function updateStory(storiesFileId: string, story: Story, folderId?: string | null): Promise<void> {
  // Sync images if folderId is provided
  if (folderId) {
    const images = await getStoryImages(folderId, story.story_id);
    story.image_ids = images.map(img => img.name);
    story.num_images = images.length;
  }

  const stories = await readStoriesArray(storiesFileId);
  let idx = stories.findIndex((s) => s.story_id === story.story_id);

  if (idx === -1) {
    // Legacy: single-story file where story_id might differ — update index 0
    if (stories.length === 1) {
      idx = 0;
    } else {
      throw new Error(`Story "${story.story_id}" not found — cannot update.`);
    }
  }

  stories[idx] = story;
  await writeStoriesArray(storiesFileId, stories);
}

/**
 * Syncs image_ids and num_images for all stories in a folder.
 * Used after image upload or deletion.
 */
export async function syncFolderImages(folderId: string): Promise<void> {
  const existing = await findFileByName(APP_CONFIG.storyFileName, folderId);
  if (!existing) return;

  const stories = await readStoriesArray(existing.id);
  let changed = false;

  for (let i = 0; i < stories.length; i++) {
    const story = stories[i];
    const images = await getStoryImages(folderId, story.story_id);
    const newIds = images.map(img => img.name);
    
    // Check if changed
    if (story.num_images !== images.length || JSON.stringify(story.image_ids) !== JSON.stringify(newIds)) {
      story.image_ids = newIds;
      story.num_images = images.length;
      changed = true;
    }
  }

  if (changed) {
    await writeStoriesArray(existing.id, stories);
  }
}

/**
 * Removes a story from its stories.json file. Also deletes image files.
 * Does NOT delete the stories.json file itself or the folder.
 */
export async function deleteStoryFromFile(storiesFileId: string, storyId: string, folderId: string): Promise<void> {
  // Remove from array
  const stories = await readStoriesArray(storiesFileId);
  const story = stories.find((s) => s.story_id === storyId);
  const updated = stories.filter((s) => s.story_id !== storyId);
  await writeStoriesArray(storiesFileId, updated);

  // Delete associated image files from the folder
  if (story && story.image_ids && story.image_ids.length > 0) {
    const folderFiles = await listFilesInFolder(folderId);
    const imageFiles = folderFiles.filter(
      (f) => f.mimeType.startsWith("image/") && story.image_ids.some((id) => f.name.startsWith(id))
    );
    await Promise.all(imageFiles.map((f) => deleteFile(f.id)));
  }
}

// ---------------------------------------------------------------------------
// Listing / fetching all stories
// ---------------------------------------------------------------------------

/**
 * Finds all stories.json files under the root folder,
 * reads each array, and returns a flat list of StoryWithMeta.
 */
export async function fetchStoriesWithMeta(rootFolderId: string): Promise<StoryWithMeta[]> {
  // Search for all stories.json files under root
  const storyFiles = await searchStoryFiles(rootFolderId);

  if (storyFiles.length === 0) return [];

  // Batch-fetch unique folder names
  const uniqueFolderIds = [
    ...new Set(storyFiles.map((f) => f.parents?.[0]).filter(Boolean) as string[]),
  ];
  const folderNameMap: Record<string, string> = {};

  await Promise.all(
    uniqueFolderIds.map(async (folderId) => {
      try {
        const folder = await driveGet<{ id: string; name: string }>(`/files/${folderId}`, {
          fields: "id,name",
        });
        folderNameMap[folderId] = folder.name;
      } catch {
        folderNameMap[folderId] = folderId;
      }
    })
  );

  // Read each stories.json and expand into individual story entries
  const allResults = await Promise.allSettled(
    storyFiles.map(async (file) => {
      const folderId = file.parents?.[0] || "";
      const stories = await readStoriesArray(file.id);

      return stories.map((story) => ({
        ...story,
        storiesFileId: file.id,
        driveFolderId: folderId,
        folderName: folderNameMap[folderId] || folderId,
        lastModified: file.modifiedTime,
        folderPath: [] as string[],
      } satisfies StoryWithMeta));
    })
  );

  // Flatten and deduplicate by story_id
  const flat: StoryWithMeta[] = [];
  const seenIds = new Set<string>();

  for (const result of allResults) {
    if (result.status !== "fulfilled") continue;
    for (const story of result.value) {
      if (seenIds.has(story.story_id)) continue;
      seenIds.add(story.story_id);
      flat.push(story);
    }
  }

  return flat;
}

// ---------------------------------------------------------------------------
// Legacy compat / search helper
// ---------------------------------------------------------------------------

/**
 * Lists all stories.json files under the root folder.
 */
export async function listAllStories(rootFolderId: string): Promise<DriveFile[]> {
  return searchStoryFiles(rootFolderId);
}

/**
 * Duplicates a story into the same (or different) folder's stories.json
 * with a new story_id.
 */
export async function duplicateStory(
  storiesFileId: string,
  sourceStoryId: string,
  newStoryId: string,
  targetFolderId: string
): Promise<string> {
  const original = await readStory(storiesFileId, sourceStoryId);
  const duplicated: Story = {
    ...original,
    story_id: newStoryId,
    image_ids: [], // Don't duplicate image references
    num_images: null,
  };
  return addStoryToFolder({ folderId: targetFolderId, story: duplicated });
}

/**
 * Gets all image files inside a story folder, optionally filtered by storyId
 */
export async function getStoryImages(storyFolderId: string, storyId?: string): Promise<DriveFile[]> {
  const files = await listFilesInFolder(storyFolderId);
  return files.filter(
    (f) =>
      f.mimeType.startsWith("image/") &&
      f.name !== APP_CONFIG.storyFileName &&
      (!storyId || f.name.includes(storyId))
  );
}
