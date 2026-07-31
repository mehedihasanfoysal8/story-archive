import { listFolderContents } from "@/services/drive/folders";
import { exportGoogleDocAsText } from "@/services/drive/files";
import type { DriveFileWithPath } from "@/types/drive";

const FOLDER_MIME_TYPE = "application/vnd.google-apps.folder";
const GOOGLE_DOC_MIME_TYPE = "application/vnd.google-apps.document";

export interface DashboardSummary {
  totalStories: number;
  totalImages: number;
  emptyDocs: DriveFileWithPath[];
  nonEmptyDocs: DriveFileWithPath[];
  recentFiles: DriveFileWithPath[];
}

async function listFilesRecursive(
  rootFolderId: string,
  folderPath: string[] = []
): Promise<DriveFileWithPath[]> {
  const result = await listFolderContents(rootFolderId, { pageSize: 1000 });
  const files = (result.files || []).map((file) => ({
    ...file,
    folderPath,
    displayPath: [...folderPath, file.name].join(" -> "),
  }));
  const childFolders = files.filter((file) => file.mimeType === FOLDER_MIME_TYPE);

  const nested = await Promise.all(
    childFolders.map((folder) =>
      listFilesRecursive(folder.id, [...folderPath, folder.name])
    )
  );

  return [...files, ...nested.flat()];
}

async function isGoogleDocEmpty(fileId: string): Promise<boolean> {
  const text = await exportGoogleDocAsText(fileId);
  return text.trim().length === 0;
}

export async function getDashboardSummary(
  rootFolderId: string
): Promise<DashboardSummary> {
  const files = await listFilesRecursive(rootFolderId);
  const docs = files.filter((file) => file.mimeType === GOOGLE_DOC_MIME_TYPE);
  const imageFiles = files.filter((file) => file.mimeType.startsWith("image/"));

  const checkedDocs = await Promise.allSettled(
    docs.map(async (doc) => ({
      doc,
      empty: await isGoogleDocEmpty(doc.id),
    }))
  );

  const readableDocs = checkedDocs.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : []
  );

  const emptyDocs = readableDocs
    .filter((result) => result.empty)
    .map((result) => result.doc);

  const nonEmptyDocs = readableDocs
    .filter((result) => !result.empty)
    .map((result) => result.doc);

  const totalStories = nonEmptyDocs.length;

  const recentFiles = files
    .filter((file) => file.mimeType !== FOLDER_MIME_TYPE)
    .sort(
      (a, b) =>
        new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
    )

  return {
    totalStories,
    totalImages: imageFiles.length,
    emptyDocs,
    nonEmptyDocs,
    recentFiles,
  };
}
