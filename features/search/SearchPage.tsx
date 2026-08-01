"use client";

import { useAuth } from "@/hooks/useAuth";
import { useStories } from "@/hooks/useStories";
import { useSearch } from "@/hooks/useSearch";
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Search, X, Globe, User, HelpCircle, BadgeCheck, SlidersHorizontal, BookOpenText } from "lucide-react";
import { StoryCard } from "../stories/StoryCard";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StoryPreview } from "../stories/StoryPreview";
import { useDeleteStory, useDuplicateStory } from "@/hooks/useStories";
import type { StoryWithMeta } from "@/types/story";
import { useState } from "react";

export function SearchPage() {
  const { rootFolderId } = useAuth();
  const { data: stories = [], isLoading } = useStories(rootFolderId);

  // Stories mutation hooks
  const deleteStoryMutation = useDeleteStory();
  const duplicateStoryMutation = useDuplicateStory();

  // Local state for preview/delete operations
  const [previewStory, setPreviewStory] = useState<StoryWithMeta | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState<StoryWithMeta | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Instantly search using client-side hook (Fuse.js)
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    filterOptions,
    clearFilters,
    hasActiveFilters,
    resultCount,
  } = useSearch(stories);

  const handleDuplicate = async (story: StoryWithMeta) => {
    const newId = `${story.story_id}_copy`;
    await duplicateStoryMutation.mutateAsync({
      storiesFileId: story.storiesFileId,
      sourceStoryId: story.story_id,
      newStoryId: newId,
      targetFolderId: story.driveFolderId,
      rootFolderId: rootFolderId!,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!storyToDelete) return;
    await deleteStoryMutation.mutateAsync({
      storiesFileId: storyToDelete.storiesFileId,
      storyId: storyToDelete.story_id,
      folderId: storyToDelete.driveFolderId,
      rootFolderId: rootFolderId!,
    });
    setDeleteOpen(false);
  };

  return (
    <PageLayout title="Global Search">
      <div className="p-6 space-y-6">
        {/* Main Search Bar Header */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-muted-foreground" />
          <Input
            placeholder="Instant search by title, write-ups, traditional themes, ATU, etc..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-11 h-12 text-base rounded-2xl shadow-sm focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2.5 top-2 w-8 h-8 rounded-lg"
              onClick={() => setQuery("")}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Search Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Side Filter Facets panel */}
          <aside className="border rounded-2xl bg-card p-5 shadow-sm space-y-5 h-fit lg:col-span-1">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                Faceted Filters
              </span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-primary font-semibold hover:underline">
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Origin Country</label>
                <Select
                  value={filters.country || "ALL"}
                  onValueChange={(val) => setFilters((f) => ({ ...f, country: val === "ALL" ? undefined : val }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Countries</SelectItem>
                    {filterOptions.countries.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Original Language</label>
                <Select
                  value={filters.language || "ALL"}
                  onValueChange={(val) => setFilters((f) => ({ ...f, language: val === "ALL" ? undefined : val }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Languages</SelectItem>
                    {filterOptions.languages.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Target Age Group</label>
                <Select
                  value={filters.ageGroup || "ALL"}
                  onValueChange={(val) => setFilters((f) => ({ ...f, ageGroup: val === "ALL" ? undefined : val }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="All Ages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Age Groups</SelectItem>
                    {filterOptions.ageGroups.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </aside>

          {/* Results Main Area */}
          <main className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
              <span>Instant Search Results ({resultCount})</span>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-60 rounded-2xl bg-muted animate-pulse border" />
                ))}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl text-center min-h-[300px]">
                <BookOpenText className="w-10 h-10 text-muted-foreground/60 mb-3" />
                <p className="font-semibold text-sm">No stories found</p>
                <p className="text-xs text-muted-foreground mt-1">Adjust search tags or reset filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {results.map((story) => (
                  <StoryCard
                    key={story.story_id}
                    story={story}
                    onDelete={() => {
                      setStoryToDelete(story);
                      setDeleteOpen(true);
                    }}
                    onDuplicate={handleDuplicate}
                    onPreview={(s) => {
                      setPreviewStory(s);
                      setPreviewOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Preview Dialog */}
      <StoryPreview
        story={previewStory}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Story"
        description="Are you sure you want to delete this story? This will permanently remove it from the file and delete associated images."
        confirmLabel="Delete Permanently"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteStoryMutation.isPending}
      />
    </PageLayout>
  );
}
