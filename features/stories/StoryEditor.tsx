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
import { ArrowLeft, Save, Undo, Redo, Sparkles, Image as ImageIcon, ExternalLink, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { APP_CONFIG, ROUTES } from "@/config/app";
import toast from "react-hot-toast";
import type { Story } from "@/types/story";

interface StoryEditorProps {
  fileId: string;
}

export function StoryEditor({ fileId }: StoryEditorProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"form" | "json">("form");

  // Query story from Drive
  const { data: initialStory, isLoading, error, refetch } = useQuery({
    queryKey: ["stories", "single", fileId],
    queryFn: () => readStory(fileId),
    staleTime: 1000 * 60,
  });

  // Undo/Redo tracking state
  const {
    value: story,
    set: setStory,
    undo,
    redo,
    reset: resetUndoRedo,
    canUndo,
    canRedo,
  } = useUndoRedo<Story | null>(null);

  // Mutation to save changes to Google Drive
  const saveMutation = useMutation({
    mutationFn: (updated: Story) => updateStory(fileId, updated),
    onSuccess: () => {
      toast.success("Changes saved successfully to Google Drive");
    },
    onError: (err: Error) => {
      toast.error(`Autosave failed: ${err.message}`);
    },
  });

  // Ref to track latest changes for autosave
  const activeStoryRef = useRef<Story | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDirtyRef = useRef(false);

  // Initialize undo/redo once story is loaded
  useEffect(() => {
    if (initialStory && !story) {
      resetUndoRedo(initialStory);
      activeStoryRef.current = initialStory;
    }
  }, [initialStory, story, resetUndoRedo]);

  // Handle local state updates from sub-editors
  const handleLocalChange = useCallback((updated: Story) => {
    setStory(updated);
    activeStoryRef.current = updated;
    isDirtyRef.current = true;

    // Trigger debounced autosave
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      if (activeStoryRef.current && isDirtyRef.current) {
        saveMutation.mutate(activeStoryRef.current);
        isDirtyRef.current = false;
      }
    }, APP_CONFIG.autosaveDebounceMs);
  }, [setStory, saveMutation]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Manual save trigger
  const handleManualSave = useCallback(() => {
    if (story) {
      saveMutation.mutate(story);
      isDirtyRef.current = false;
    }
  }, [story, saveMutation]);

  // Register global hotkeys
  useGlobalShortcuts({
    onSave: handleManualSave,
    onUndo: undo,
    onRedo: redo,
    onEscape: () => router.push(ROUTES.stories),
  });

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

  if (error || !story) {
    return (
      <PageLayout title="Story Editor">
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

  return (
    <PageLayout title="Story Editor">
      {/* Editor top action bar */}
      <div className="border-b bg-card py-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 z-20 shadow-sm">
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
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Saving to Drive...
                </span>
              ) : isDirtyRef.current ? (
                <span className="text-amber-500">Unsaved changes locally</span>
              ) : (
                <span className="text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced with Drive
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 mr-2 border-r pr-2">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8"
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <EditorModeSwitcher mode={mode} onChange={setMode} />

          {/* Media Links */}
          <Link href={ROUTES.images}>
            <Button variant="outline" size="sm" className="rounded-xl ml-1">
              <ImageIcon className="w-4 h-4 mr-2" />
              Manage Images
            </Button>
          </Link>

          <Button
            size="sm"
            onClick={handleManualSave}
            disabled={saveMutation.isPending}
            className="rounded-xl shadow-md"
            id="save-story-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Code
          </Button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="p-6">
        {mode === "form" ? (
          <FormEditor value={story} onChange={handleLocalChange} />
        ) : (
          <JsonEditor value={story} onChange={handleLocalChange} />
        )}
      </div>
    </PageLayout>
  );
}
