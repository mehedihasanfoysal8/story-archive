"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { readStoriesArray, updateStory } from "@/services/stories";
import { driveGet } from "@/services/drive/client";
import { useGlobalShortcuts } from "@/hooks/useKeyboardShortcuts";
import { FormEditor } from "./FormEditor";
import { JsonEditor } from "./JsonEditor";
import { EditorModeSwitcher } from "./EditorModeSwitcher";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Undo, Redo, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import { APP_CONFIG, ROUTES } from "@/config/app";
import toast from "react-hot-toast";
import type { Story } from "@/types/story";

interface StoryEditorProps {
  /** URL-encoded param: "{storiesFileId}__{storyId}" */
  encodedId: string;
}

export function StoryEditor({ encodedId }: StoryEditorProps) {
  // Parse the encoded ID
  const separatorIdx = encodedId.indexOf("__");
  const storiesFileId = separatorIdx !== -1 ? encodedId.slice(0, separatorIdx) : encodedId;
  const storyId = separatorIdx !== -1 ? encodedId.slice(separatorIdx + 2) : "";

  const [mode, setMode] = useState<"form" | "json">("form");
  const [localStory, setLocalStory] = useState<Story | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load story on mount
  useEffect(() => {
    if (!storiesFileId) {
      setLoadError("Invalid story URL.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const load = async () => {
      const stories = await readStoriesArray(storiesFileId);
      if (stories.length === 0) throw new Error("No stories found in this file.");

      // If storyId is in URL, find that specific story
      // Otherwise (legacy single-file URL), use the first story
      const found = storyId
        ? stories.find((s) => s.story_id === storyId)
        : stories[0];

      if (!found) throw new Error(`Story "${storyId}" not found in file.`);

      // Also get folderId so we can manage images
      const fileMeta = await driveGet<{ parents: string[] }>(`/files/${storiesFileId}?fields=parents`);
      const parentFolderId = fileMeta.parents?.[0] || null;

      return { story: found, folderId: parentFolderId };
    };

    load()
      .then((res) => {
        setLocalStory(res.story);
        setFolderId(res.folderId);
        setIsLoading(false);
      })
      .catch((err) => {
        setLoadError(err.message || "Failed to load story.");
        setIsLoading(false);
      });
  }, [storiesFileId, storyId]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (updated: Story) => updateStory(storiesFileId, updated, folderId),
    onSuccess: () => {
      setIsDirty(false);
      toast.success("Story saved to Google Drive!");
    },
    onError: (err: Error) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle local form changes — no autosave
  const handleLocalChange = useCallback((updated: Story) => {
    setLocalStory(updated);
    setIsDirty(true);
  }, []);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (localStory) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveMutation.mutate(localStory);
    }
  }, [localStory, saveMutation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Global shortcuts
  useGlobalShortcuts({ onSave: handleManualSave });

  // Loading skeleton
  if (isLoading) {
    return (
      <PageLayout title="Story Editor">
        <div className="border-b bg-card py-4 px-6 flex items-center gap-3">
          <Link href={ROUTES.stories}>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground animate-pulse">Loading story...</span>
        </div>
        <div className="p-6 space-y-4 max-w-4xl mx-auto">
          <div className="h-10 w-full bg-muted animate-pulse rounded-xl" />
          <div className="h-96 w-full bg-muted animate-pulse rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (loadError || !localStory) {
    return (
      <PageLayout title="Story Editor">
        <div className="border-b bg-card py-4 px-6 flex items-center gap-3">
          <Link href={ROUTES.stories}>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <span className="font-semibold text-muted-foreground">Back to Stories</span>
        </div>
        <div className="p-12 text-center max-w-md mx-auto space-y-4">
          <h2 className="text-xl font-bold text-destructive">Failed to Load Story</h2>
          <p className="text-sm text-muted-foreground">{loadError}</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Story Editor">
      {/* Action bar */}
      <div className="border-b bg-card py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={ROUTES.stories}>
            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-base line-clamp-1">
              {localStory.bangla_story_title || "Untitled Story"}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="font-mono">{localStory.story_id}</span>
              {saveMutation.isPending ? (
                <span className="text-primary flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Saving...
                </span>
              ) : isDirty ? (
                <span className="text-amber-500">Unsaved changes</span>
              ) : (
                <span className="text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <EditorModeSwitcher mode={mode} onChange={setMode} />

          <Link href={ROUTES.images}>
            <Button variant="outline" size="sm" className="rounded-xl ml-1">
              <ImageIcon className="w-4 h-4 mr-2" />
              Images
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={saveMutation.isPending || !isDirty}
            className={`rounded-xl shadow-md transition-all ${
              isDirty ? "bg-primary text-primary-foreground" : "opacity-60"
            }`}
            id="save-story-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : isDirty ? "Update Story" : "Saved"}
          </Button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="p-6">
        {mode === "form" ? (
          <FormEditor key={storyId} value={localStory} onChange={handleLocalChange} folderId={folderId} />
        ) : (
          <JsonEditor value={localStory} onChange={handleLocalChange} />
        )}
      </div>
    </PageLayout>
  );
}
