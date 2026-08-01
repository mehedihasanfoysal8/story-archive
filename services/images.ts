import { uploadFile, deleteFile } from "./drive/files";
import { APP_CONFIG, SUPPORTED_IMAGE_TYPES } from "@/config/app";
import type { DriveFile, DriveUploadProgress } from "@/types/drive";

import { getStoryImages, syncFolderImages } from "./stories";

export interface ImageUploadOptions {
  files: File[];
  storyFolderId: string;
  storyId?: string;
  onProgress?: (progress: DriveUploadProgress[]) => void;
}

/**
 * Validates an image file before upload
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type as typeof SUPPORTED_IMAGE_TYPES[number])) {
    return { valid: false, error: `Unsupported type: ${file.type}` };
  }
  if (file.size > APP_CONFIG.maxImageSize) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 10MB)`,
    };
  }
  return { valid: true };
}

/**
 * Generates the image filename for a given index (e.g. story_0001_img_01.jpg or image01.jpg)
 */
export function generateImageName(index: number, ext: string = "jpg", storyId?: string): string {
  const prefix = storyId ? `${storyId}_img_` : APP_CONFIG.imagePrefix;
  return `${prefix}${String(index).padStart(2, "0")}.${ext}`;
}

/**
 * Gets the file extension from a File object
 */
export function getExtension(file: File): string {
  const name = file.name;
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "jpg";
}

/**
 * Uploads multiple images to a story folder with progress tracking
 */
export async function uploadImages(
  options: ImageUploadOptions
): Promise<DriveFile[]> {
  const { files, storyFolderId, storyId, onProgress } = options;

  // Determine starting index by counting existing images
  let startIndex = 0;
  try {
    const existingImages = await getStoryImages(storyFolderId, storyId);
    startIndex = existingImages.length;
  } catch (err) {
    console.warn("Failed to get existing images for index offset:", err);
  }

  const progress: DriveUploadProgress[] = files.map((f) => ({
    fileName: f.name,
    progress: 0,
    status: "pending",
  }));

  onProgress?.(progress);

  const results: DriveFile[] = [];
  const concurrency = APP_CONFIG.maxUploadConcurrency;

  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (file, batchIdx) => {
        const fileIdxInBatch = i + batchIdx;
        const nameIdx = startIndex + fileIdxInBatch + 1; // start index from 1 instead of 0 for non-cover images
        progress[fileIdxInBatch] = { ...progress[fileIdxInBatch], status: "uploading", progress: 10 };
        onProgress?.([...progress]);

        const ext = getExtension(file);
        
        // If storyId is not provided (e.g. general folder upload), the first image is the cover
        const isCover = !storyId && (nameIdx === 1);
        const name = isCover
          ? APP_CONFIG.coverImageName
          : generateImageName(nameIdx, ext, storyId);

        const uploaded = await uploadFile(name, file, storyFolderId, file.type);

        progress[fileIdxInBatch] = { ...progress[fileIdxInBatch], status: "complete", progress: 100, fileId: uploaded.id };
        onProgress?.([...progress]);
        return uploaded;
      })
    );

    for (let j = 0; j < batchResults.length; j++) {
      const result = batchResults[j];
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        const idx = i + j;
        progress[idx] = {
          ...progress[idx],
          status: "error",
          error: (result.reason as Error).message,
        };
        onProgress?.([...progress]);
      }
    }
  }

  // Sync JSON file in the background (no await needed for UI, but let's await to be safe)
  try {
    await syncFolderImages(storyFolderId);
  } catch (err) {
    console.error("Failed to sync folder images after upload", err);
  }

  return results;
}

/**
 * Uploads a single cover image
 */
export async function uploadCoverImage(
  file: File,
  storyFolderId: string
): Promise<DriveFile> {
  return uploadFile(APP_CONFIG.coverImageName, file, storyFolderId, file.type);
}

/**
 * Deletes an image from Drive
 */
export async function deleteImage(fileId: string, folderId?: string): Promise<void> {
  await deleteFile(fileId);
  if (folderId) {
    try {
      await syncFolderImages(folderId);
    } catch (err) {
      console.error("Failed to sync folder images after delete", err);
    }
  }
}

/**
 * Returns a Drive streaming URL for an image using the current access token
 */
export function getImageUrl(fileId: string, accessToken: string): string {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${encodeURIComponent(accessToken)}`;
}
