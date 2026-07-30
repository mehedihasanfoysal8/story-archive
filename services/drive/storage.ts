import { driveGet } from "./client";
import type { DriveAbout } from "@/types/drive";

/**
 * Fetches Google Drive storage quota and user info
 */
export async function getDriveAbout(): Promise<DriveAbout> {
  return driveGet<DriveAbout>("/about", {
    fields: "storageQuota,user",
  });
}

export interface StorageInfo {
  total: number;
  used: number;
  inDrive: number;
  inTrash: number;
  free: number;
  usedPercent: number;
  displayTotal: string;
  displayUsed: string;
  displayFree: string;
}

export function parseStorageInfo(about: DriveAbout): StorageInfo {
  const total = Number(about.storageQuota.limit) || 0;
  const used = Number(about.storageQuota.usage) || 0;
  const inDrive = Number(about.storageQuota.usageInDrive) || 0;
  const inTrash = Number(about.storageQuota.usageInDriveTrash) || 0;
  const free = Math.max(0, total - used);

  const fmt = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return {
    total,
    used,
    inDrive,
    inTrash,
    free,
    usedPercent: total > 0 ? Math.round((used / total) * 100) : 0,
    displayTotal: fmt(total),
    displayUsed: fmt(used),
    displayFree: fmt(free),
  };
}
