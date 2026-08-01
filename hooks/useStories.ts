"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStoriesWithMeta, addStoryToFolder, updateStory, deleteStoryFromFile, duplicateStory } from "@/services/stories";
import type { Story, StoryWithMeta } from "@/types/story";
import toast from "react-hot-toast";

export const STORIES_QUERY_KEY = "stories";

// ---------------------------------------------------------------------------
// List all stories
// ---------------------------------------------------------------------------
export function useStories(rootFolderId: string | null) {
  return useQuery({
    queryKey: [STORIES_QUERY_KEY, rootFolderId],
    queryFn: () => fetchStoriesWithMeta(rootFolderId!),
    enabled: !!rootFolderId,
    staleTime: 0,
    gcTime: 1000 * 60 * 2,
  });
}

// ---------------------------------------------------------------------------
// Create (add to array)
// ---------------------------------------------------------------------------
export interface CreateStoryVars {
  folderId: string;
  rootFolderId: string;
  story: Story;
}

export function useCreateStory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ folderId, story }: CreateStoryVars) =>
      addStoryToFolder({ folderId, story }),

    onSuccess: (storiesFileId, variables) => {
      // Optimistically inject into cache so it shows immediately
      const newStory: StoryWithMeta = {
        ...variables.story,
        storiesFileId,
        driveFolderId: variables.folderId,
        lastModified: new Date().toISOString(),
        folderPath: [],
      };

      qc.setQueryData<StoryWithMeta[]>(
        [STORIES_QUERY_KEY, variables.rootFolderId],
        (old) => {
          if (!old) return [newStory];
          // Don't add if already present
          if (old.some((s) => s.story_id === newStory.story_id)) return old;
          return [newStory, ...old];
        }
      );

      toast.success("Story created successfully!");
    },

    onError: (err: Error) => toast.error(`Failed to create story: ${err.message}`),
  });
}

// ---------------------------------------------------------------------------
// Update (replace entry in array)
// ---------------------------------------------------------------------------
export interface UpdateStoryVars {
  storiesFileId: string;
  folderId?: string | null;
  story: Story;
}

export function useUpdateStory() {
  return useMutation({
    mutationFn: ({ storiesFileId, folderId, story }: UpdateStoryVars) =>
      updateStory(storiesFileId, story, folderId),
    onError: (err: Error) => toast.error(`Save failed: ${err.message}`),
  });
}

// ---------------------------------------------------------------------------
// Delete (remove from array + delete images)
// ---------------------------------------------------------------------------
export interface DeleteStoryVars {
  storiesFileId: string;
  storyId: string;
  folderId: string;
  rootFolderId: string;
}

export function useDeleteStory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ storiesFileId, storyId, folderId }: DeleteStoryVars) =>
      deleteStoryFromFile(storiesFileId, storyId, folderId),

    onSuccess: (_, variables) => {
      qc.setQueryData<StoryWithMeta[]>(
        [STORIES_QUERY_KEY, variables.rootFolderId],
        (old) => old?.filter((s) => s.story_id !== variables.storyId) ?? []
      );
      toast.success("Story deleted.");
    },

    onError: (err: Error) => toast.error(`Delete failed: ${err.message}`),
  });
}

// ---------------------------------------------------------------------------
// Duplicate
// ---------------------------------------------------------------------------
export interface DuplicateStoryVars {
  storiesFileId: string;
  sourceStoryId: string;
  newStoryId: string;
  targetFolderId: string;
  rootFolderId: string;
}

export function useDuplicateStory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ storiesFileId, sourceStoryId, newStoryId, targetFolderId }: DuplicateStoryVars) =>
      duplicateStory(storiesFileId, sourceStoryId, newStoryId, targetFolderId),

    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: [STORIES_QUERY_KEY, variables.rootFolderId] });
      toast.success("Story duplicated!");
    },

    onError: (err: Error) => toast.error(`Duplicate failed: ${err.message}`),
  });
}
