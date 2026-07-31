"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { readStory, updateStory } from "@/services/stories";
import { useUndoRedo } from "@/hooks/useUndoRedo";
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
  fileId: string;
}

export function StoryEditor({ fileId }: StoryEditorProps) {
  const [mode, setMode] = useState<"form" | "json">("form");
  const [localStory, setLocalStory] = useState<Story | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Query story from Drive
  const { data: initialStory, isLoading, error, refetch } = useQuery({
    queryKey: ["stories", "single", fileId],
    queryFn: () => readStory(fileId),
    staleTime: 1000 * 60,
  });

  // Set local story once loaded
  useEffect(() => {
    if (initialStory && !localStory) {
      setLocalStory(initialStory);
    }
  }, [initialStory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Undo/Redo
  const {
    value: undoStory,
    set: setUndoStory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<Story | null>(null);

  useEffect(() => {
    if (initialStory && !undoStory) {
      setUndoStory(initialStory);
    }
  }, [initialStory]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mutation to save
  const saveMutation = useMutation({
    mutationFn: (updated: Story) => updateStory(fileId, updated),
    onSuccess: () => {
      setIsDirty(false);
      toast.success("Saved to Google Drive");
    },
    onError: (err: Error) => {
      toast.error(`Save failed: ${err.message}`);
    },
  });

  // Debounced autosave ref (unused now — manual save only)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle changes from sub-editors — just update local state, no autosave
  const handleLocalChange = useCallback((updated: Story) => {
    setLocalStory(updated);
    setUndoStory(updated);
    setIsDirty(true);
  }, [setUndoStory]);

  // Undo/Redo syncs local story
  const handleUndo = useCallback(() => {
    undo();
    if (undoStory) setLocalStory(undoStory);
  }, [undo, undoStory]);

  const handleRedo = useCallback(() => {
    redo();
    if (undoStory) setLocalStory(undoStory);
  }, [redo, undoStory]);

  // Manual save
  const handleManualSave = useCallback(() => {
    if (localStory) {
      saveMutation.mutate(localStory);
    }
  }, [localStory, saveMutation]);

  // Cleanup (kept for safety)
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Global shortcuts
  useGlobalShortcuts({
    onSave: handleManualSave,
    onUndo: handleUndo,
    onRedo: handleRedo,
  });

  // Loading skeleton
  if (isLoading) {
    return (
      <PageLayout title="Story Editor">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
          <div className="h-10 w-full bg-muted animate-pulse rounded-xl" />
          <div className="h-96 w-full bg-muted animate-pulse rounded-2xl" />
        </div>
      </PageLayout>
    );
  }

  // Error state — still shows navigation!
  if (error) {
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
          <p className="text-sm text-muted-foreground">
            {error?.message || "Verify your Google permissions or try refreshing."}
          </p>
          <Button onClick={() => refetch()} className="rounded-xl">
            Retry Load
          </Button>
        </div>
      </PageLayout>
    );
  }

  // Use localStory for editing; fall back to initialStory while loading
  const story = localStory || initialStory;

  if (!story) {
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
          <h2 className="text-xl font-bold">Story not found</h2>
          <p className="text-sm text-muted-foreground">This story could not be loaded from Drive.</p>
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
              {story.bangla_story_title || "Untitled Story"}
            </h2>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>{story.story_id}</span>
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
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2 border-r pr-2">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
              <Undo className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={handleRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
              <Redo className="w-4 h-4" />
            </Button>
          </div>

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
            className={`rounded-xl shadow-md transition-all ${isDirty ? "bg-primary text-primary-foreground animate-pulse-subtle" : "opacity-70"}`}
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
          <FormEditor key={fileId} value={story} onChange={handleLocalChange} />
        ) : (
          <JsonEditor value={story} onChange={handleLocalChange} />
        )}
      </div>
    </PageLayout>
  );
}
