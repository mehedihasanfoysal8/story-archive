"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStoriesWithMeta, createStory, updateStory, deleteStoryFolder, readStory, duplicateStory } from "@/services/stories";
import type { Story, StoryWithMeta } from "@/types/story";
import toast from "react-hot-toast";

export const STORIES_QUERY_KEY = "stories";

export function useStories(rootFolderId: string | null) {
  return useQuery({
    queryKey: [STORIES_QUERY_KEY, rootFolderId],
    queryFn: () => fetchStoriesWithMeta(rootFolderId!),
    enabled: !!rootFolderId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useStory(fileId: string | null) {
  return useQuery({
    queryKey: [STORIES_QUERY_KEY, "single", fileId],
    queryFn: () => readStory(fileId!),
    enabled: !!fileId,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createStory,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORIES_QUERY_KEY] });
      toast.success("Story created successfully");
    },
    onError: (err: Error) => toast.error(`Failed to create story: ${err.message}`),
  });
}

export function useUpdateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fileId, story }: { fileId: string; story: Story }) =>
      updateStory(fileId, story),
    onSuccess: (_, { fileId }) => {
      qc.invalidateQueries({ queryKey: [STORIES_QUERY_KEY, "single", fileId] });
      qc.invalidateQueries({ queryKey: [STORIES_QUERY_KEY] });
    },
    onError: (err: Error) => toast.error(`Failed to save: ${err.message}`),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (storyFolderId: string) => deleteStoryFolder(storyFolderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORIES_QUERY_KEY] });
      toast.success("Story deleted");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDuplicateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (opts: {
      sourceFileId: string;
      sourceFolderId: string;
      newStoryId: string;
      newFolderName: string;
    }) => duplicateStory(opts.sourceFileId, opts.sourceFolderId, opts.newStoryId, opts.newFolderName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STORIES_QUERY_KEY] });
      toast.success("Story duplicated");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
