"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadImages, deleteImage } from "@/services/images";
import { getStoryImages } from "@/services/stories";
import type { DriveUploadProgress } from "@/types/drive";
import { useState } from "react";
import toast from "react-hot-toast";

export const IMAGES_QUERY_KEY = "images";

export function useStoryImages(storyFolderId: string | null, storyId?: string) {
  return useQuery({
    queryKey: [IMAGES_QUERY_KEY, storyFolderId, storyId],
    queryFn: () => getStoryImages(storyFolderId!, storyId),
    enabled: !!storyFolderId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUploadImages(storyFolderId: string, storyId?: string) {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<DriveUploadProgress[]>([]);

  const mutation = useMutation({
    mutationFn: (files: File[]) =>
      uploadImages({
        files,
        storyFolderId,
        storyId,
        onProgress: setProgress,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [IMAGES_QUERY_KEY, storyFolderId] });
      setProgress([]);
      toast.success("Images uploaded successfully");
    },
    onError: (err: Error) => toast.error(`Upload failed: ${err.message}`),
  });

  return { ...mutation, progress };
}

export function useDeleteImage(storyFolderId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => deleteImage(fileId, storyFolderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [IMAGES_QUERY_KEY, storyFolderId] });
      toast.success("Image deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
