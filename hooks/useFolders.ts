"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFolderContents, createFolder, renameFile, deleteFile, moveFile, listAllFolders } from "@/services/drive/folders";
import { getOrCreateFolder } from "@/services/drive/folders";
import { uploadFile, deleteFile as deleteFileDirect, updateFileMetadata } from "@/services/drive/files";
import { rootFolderStorage } from "@/lib/auth/storage";
import toast from "react-hot-toast";

export const FOLDERS_QUERY_KEY = "folders";

export function useFolderContents(parentId: string | null) {
  return useQuery({
    queryKey: [FOLDERS_QUERY_KEY, "contents", parentId],
    queryFn: () => listFolderContents(parentId!, { foldersOnly: false }),
    enabled: !!parentId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useFolderTree(rootFolderId: string | null) {
  return useQuery({
    queryKey: [FOLDERS_QUERY_KEY, "tree", rootFolderId],
    queryFn: () => listAllFolders(rootFolderId!),
    enabled: !!rootFolderId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateFolder(parentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => createFolder(name, parentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      toast.success("Folder created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRenameFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      renameFile(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      toast.success("Folder renamed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFile(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      toast.success("Folder deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMoveFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      fileId,
      newParentId,
      currentParentId,
    }: {
      fileId: string;
      newParentId: string;
      currentParentId: string;
    }) => moveFile(fileId, newParentId, currentParentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      toast.success("Folder moved");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useGetOrCreateRootFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rootFolderId: string) => {
      // Verify the root folder exists
      const { getFile } = await import("@/services/drive/folders");
      return getFile(rootFolderId);
    },
    onSuccess: (folder:any) => {
      rootFolderStorage.setRootFolderId(folder.id);
      qc.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/**
 * Creates a native Google Docs document in the current folder.
 */
export function useCreateFile(parentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fileName: string) => {
      const { createGoogleDoc } = await import("@/services/drive/folders");
      const cleanName = fileName.replace(/\.(docs|docx|doc)$/i, "").trim() || "Untitled Document";
      return createGoogleDoc(cleanName, parentId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      toast.success("Google Docs document created successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/**
 * Renames any Drive file (not just folders).
 */
export function useRenameFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      updateFileMetadata(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      toast.success("File renamed");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

/**
 * Deletes a Drive file (not a folder).
 */
export function useDeleteFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFileDirect(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [FOLDERS_QUERY_KEY] });
      toast.success("File deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
