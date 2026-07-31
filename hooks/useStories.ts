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
    staleTime: 0, // Always refetch from Drive on page visit
    gcTime: 1000 * 60 * 2, // Keep unused cache for 2 min only
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
    onSuccess: (data, variables) => {
      import("@/lib/auth/storage").then(({ pendingStoryStorage }) => {
        pendingStoryStorage.addPending(data.storyFileId);
      });
      
      const newStory: StoryWithMeta = {
        ...variables.story,
        driveFileId: data.storyFileId,
        driveFolderId: data.storyFolderId,
        lastModified: new Date().toISOString(),
        folderPath: [],
      };
      
      qc.setQueryData<StoryWithMeta[]>([STORIES_QUERY_KEY, variables.rootFolderId], (old) => {
        if (!old) return [newStory];
        if (old.some(s => s.story_id === newStory.story_id)) return old;
        return [newStory, ...old];
      });
      
      // Deliberately skipping invalidateQueries here.
      // Drive's search index takes a few minutes to update.
      // We manually injected it into the cache, so invalidating now 
      // would fetch stale data from Drive and overwrite our optimistic update!
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
