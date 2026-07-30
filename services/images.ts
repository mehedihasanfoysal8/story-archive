import { uploadFile, deleteFile } from "./drive/files";
import { APP_CONFIG, SUPPORTED_IMAGE_TYPES } from "@/config/app";
import type { DriveFile, DriveUploadProgress } from "@/types/drive";

export interface ImageUploadOptions {
  files: File[];
  storyFolderId: string;
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
 * Generates the image filename for a given index (e.g. image01.jpg)
 */
export function generateImageName(index: number, ext: string = "jpg"): string {
  return `${APP_CONFIG.imagePrefix}${String(index).padStart(2, "0")}.${ext}`;
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
  const { files, storyFolderId, onProgress } = options;

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
        const idx = i + batchIdx;
        progress[idx] = { ...progress[idx], status: "uploading", progress: 10 };
        onProgress?.([...progress]);

        const ext = getExtension(file);
        const isCover = idx === 0;
        const name = isCover
          ? APP_CONFIG.coverImageName
          : generateImageName(idx, ext);

        const uploaded = await uploadFile(name, file, storyFolderId, file.type);

        progress[idx] = { ...progress[idx], status: "complete", progress: 100, fileId: uploaded.id };
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
export async function deleteImage(fileId: string): Promise<void> {
  return deleteFile(fileId);
}

/**
 * Returns a Drive streaming URL for an image using the current access token
 */
export function getImageUrl(fileId: string, accessToken: string): string {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${encodeURIComponent(accessToken)}`;
}
