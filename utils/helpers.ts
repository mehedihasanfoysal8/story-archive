import { cn } from "@/utils/cn";

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 30) return formatDate(dateString);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .replace(/^-+|-+$/g, "");
}

export function extractFolderIdFromUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  // Match pattern: /folders/FOLDER_ID or /folders/u/X/FOLDER_ID or id=FOLDER_ID
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // If it's already a raw ID string without slashes or spaces
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

export function generateStoryId(title: string, index?: number): string {
  const base = slugify(title).slice(0, 20) || "story";
  const suffix = index !== undefined ? `_${String(index).padStart(4, "0")}` : `_${Date.now()}`;
  return `${base}${suffix}`;
}

/**
 * Generates a unique 4-digit zero-padded numeric story ID, e.g. "story_0042"
 * Uses timestamp + random to ensure uniqueness across sessions.
 */
export function generateNumericStoryId(): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 1000);
  const num = (ts + rand) % 9000 + 1000; // always 4 digits: 1000-9999
  return `story_${String(num).padStart(4, "0")}`;
}


export function parseJSON<T>(text: string): { data: T | null; error: string | null } {
  try {
    return { data: JSON.parse(text) as T, error: null };
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }
}

export function downloadJSON(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });
}

export { cn };
