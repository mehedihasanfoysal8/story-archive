import { GOOGLE_CONFIG } from "@/config/google";
import { DRIVE_FIELDS, APP_CONFIG } from "@/config/app";
import { tokenStorage } from "@/lib/auth/storage";
import type { DriveApiError } from "@/types/drive";

export class DriveApiException extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly apiError?: DriveApiError
  ) {
    super(message);
    this.name = "DriveApiException";
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = tokenStorage.getAccessToken();
  if (!token) throw new DriveApiException(401, "Not authenticated");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  let apiError: DriveApiError | undefined;
  try {
    const body = await response.json();
    apiError = body.error as DriveApiError;
  } catch {
    // ignore json parse error
  }

  const message =
    apiError?.message ||
    `Drive API error: ${response.status} ${response.statusText}`;

  throw new DriveApiException(response.status, message, apiError);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  attempts = APP_CONFIG.retryAttempts
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const error = err as DriveApiException;
      // Don't retry on auth or not-found errors
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        throw err;
      }
      if (i < attempts - 1) {
        await new Promise((r) =>
          setTimeout(r, APP_CONFIG.retryDelay * Math.pow(2, i))
        );
      }
    }
  }
  throw lastError;
}

/**
 * Core GET request to Drive API
 */
export async function driveGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  return withRetry(async () => {
    const headers = await getAuthHeaders();
    const url = new URL(`${GOOGLE_CONFIG.driveApiBase}${path}`);
    
    // Always include these parameters to support shared public folders not in "My Drive"
    url.searchParams.set("includeItemsFromAllDrives", "true");
    url.searchParams.set("supportsAllDrives", "true");
    
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    // Add cache buster
    url.searchParams.set("_t", Date.now().toString());

    const response = await fetch(url.toString(), { 
      headers,
      cache: "no-store"
    });
    return handleResponse<T>(response);
  });
}

/**
 * Core POST request to Drive API
 */
export async function drivePost<T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> {
  return withRetry(async () => {
    const headers = await getAuthHeaders();
    const url = new URL(`${GOOGLE_CONFIG.driveApiBase}${path}`);
    url.searchParams.set("supportsAllDrives", "true");
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  });
}

/**
 * Core PATCH request to Drive API
 */
export async function drivePatch<T>(path: string, body: unknown, params?: Record<string, string>): Promise<T> {
  return withRetry(async () => {
    const headers = await getAuthHeaders();
    const url = new URL(`${GOOGLE_CONFIG.driveApiBase}${path}`);
    url.searchParams.set("supportsAllDrives", "true");
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const response = await fetch(url.toString(), {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });
    return handleResponse<T>(response);
  });
}

/**
 * Core DELETE request to Drive API
 */
export async function driveDelete(path: string): Promise<void> {
  return withRetry(async () => {
    const headers = await getAuthHeaders();
    const url = new URL(`${GOOGLE_CONFIG.driveApiBase}${path}`);
    url.searchParams.set("supportsAllDrives", "true");
    const response = await fetch(url.toString(), {
      method: "DELETE",
      headers,
    });
    return handleResponse<void>(response);
  });
}

/**
 * Multipart upload for files (metadata + content)
 */
export async function driveMultipartUpload<T>(
  metadata: Record<string, unknown>,
  content: Blob,
  params?: Record<string, string>
): Promise<T> {
  return withRetry(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) throw new DriveApiException(401, "Not authenticated");

    const boundary = `boundary_${Date.now()}`;
    const metaPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
    const filePart = `--${boundary}\r\nContent-Type: ${content.type || "application/octet-stream"}\r\n\r\n`;
    const endPart = `\r\n--${boundary}--`;

    const bodyParts = [
      new TextEncoder().encode(metaPart),
      new TextEncoder().encode(filePart),
      new Uint8Array(await content.arrayBuffer()),
      new TextEncoder().encode(endPart),
    ];

    const totalLength = bodyParts.reduce((a, b) => a + b.length, 0);
    const body = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of bodyParts) {
      body.set(part, offset);
      offset += part.length;
    }

    const url = new URL(`${GOOGLE_CONFIG.driveUploadBase}/files`);
    url.searchParams.set("uploadType", "multipart");
    url.searchParams.set("fields", DRIVE_FIELDS.file);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    return handleResponse<T>(response);
  });
}

/**
 * Update file content via PATCH upload
 */
export async function driveUpdateContent<T>(
  fileId: string,
  content: Blob
): Promise<T> {
  return withRetry(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) throw new DriveApiException(401, "Not authenticated");

    const url = new URL(`${GOOGLE_CONFIG.driveUploadBase}/files/${fileId}`);
    url.searchParams.set("uploadType", "media");
    url.searchParams.set("fields", DRIVE_FIELDS.file);

    const response = await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": content.type || "application/octet-stream",
      },
      body: content,
    });

    return handleResponse<T>(response);
  });
}
