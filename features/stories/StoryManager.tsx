"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStories, useDeleteStory, useDuplicateStory, useCreateStory } from "@/hooks/useStories";
import { useSearch } from "@/hooks/useSearch";
import { StoryCard } from "./StoryCard";
import { StoryTable } from "./StoryTable";
import { StoryPreview } from "./StoryPreview";
import { ImportExportMenu } from "./ImportExportMenu";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid, List, Search, Plus, BookOpen, X, RefreshCw, BookMarked } from "lucide-react";
import type { StoryWithMeta } from "@/types/story";
import { ROUTES } from "@/config/app";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { generateStoryId, generateNumericStoryId } from "@/utils/helpers";

export function StoryManager() {
  const { rootFolderId } = useAuth();
  const router = useRouter();

  // Queries
  const { data: stories = [], isLoading, isError, error, refetch } = useStories(rootFolderId);
  const deleteStoryMutation = useDeleteStory();
  const duplicateStoryMutation = useDuplicateStory();
  const createStoryMutation = useCreateStory();

  // State
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [previewStory, setPreviewStory] = useState<StoryWithMeta | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StoryWithMeta | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Search & Filter hook
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    filterOptions,
    clearFilters,
    hasActiveFilters,
    totalCount,
    resultCount,
  } = useSearch(stories);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [query, filters]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedResults = results.slice(startIndex, endIndex);
  const totalPages = Math.ceil(resultCount / itemsPerPage);

  const handleDuplicate = async (story: StoryWithMeta) => {
    const newId = generateNumericStoryId();
    await duplicateStoryMutation.mutateAsync({
      storiesFileId: story.storiesFileId,
      sourceStoryId: story.story_id,
      newStoryId: newId,
      targetFolderId: story.driveFolderId,
      rootFolderId: rootFolderId!,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !rootFolderId) return;
    await deleteStoryMutation.mutateAsync({
      storiesFileId: deleteTarget.storiesFileId,
      storyId: deleteTarget.story_id,
      folderId: deleteTarget.driveFolderId,
      rootFolderId,
    });
    setDeleteOpen(false);
    setDeleteTarget(null);
  };

  const handleImportJSON = async (importedStory: any) => {
    if (!rootFolderId) return;

    // Check for duplicate story ID
    const isDuplicate = stories.some((s) => s.story_id === importedStory.story_id);
    if (isDuplicate) {
      toast.error("Duplicate story_id found in Drive archive.");
      return;
    }

    await createStoryMutation.mutateAsync({
      rootFolderId,
      folderId: rootFolderId, // Imports go to the root folder's stories.json by default
      story: importedStory,
    });
  };

  return (
    <PageLayout title={`Story Manager (Total: ${totalCount})`}>
      <div className="p-6 space-y-6">
        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={viewMode === "grid" ? "bg-accent" : ""}
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={viewMode === "list" ? "bg-accent" : ""}
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground ml-2">
              Showing {resultCount} of {totalCount} stories
            </span>
          </div>

          <div className="flex items-center gap-2 self-end">
            <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading} title="Refresh Stories" className="rounded-xl">
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <ImportExportMenu onImport={handleImportJSON} />
            <Button onClick={() => router.push(ROUTES.newStory)} className="rounded-xl shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Create Story
            </Button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-muted/30 p-4 rounded-2xl border">
          <div className="sm:col-span-3 lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
            <Input
              placeholder="Search by title, writer, country, theme, ATU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <div>
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

          <div>
            <Select
              value={filters.folderName || "ALL"}
              onValueChange={(val) => setFilters((f) => ({ ...f, folderName: val === "ALL" ? undefined : val }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Folders" />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="ALL">All Folders</SelectItem>
                {filterOptions.folders.map((folder) => (
                  <SelectItem key={folder} value={folder}>
                    {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={filters.ageGroup || "ALL"}
              onValueChange={(val) => setFilters((f) => ({ ...f, ageGroup: val === "ALL" ? undefined : val }))}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Age Groups" />
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

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border border-destructive/20 bg-destructive/5">
            <div className="w-16 h-16 rounded-2xl bg-destructive/20 flex items-center justify-center mb-4 text-destructive">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Error Loading Stories</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto whitespace-pre-wrap">
              {error instanceof Error ? error.message : "Unknown error occurred"}
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && totalCount === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border border-dashed border-primary/20">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BookMarked className="w-8 h-8 text-primary opacity-50" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Stories Found</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
              Get started by creating your first story. Your stories will be saved
              as JSON directly in your connected Google Drive folder.
            </p>
            <Button
              onClick={() => router.push("/stories/new")}
              className="gap-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
              Create First Story
            </Button>
          </div>
        )}

        {/* Stories Listing */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-60 rounded-2xl bg-muted animate-pulse border" />
            ))}
          </div>
        ) : results.length === 0 && totalCount > 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl text-center min-h-[300px]">
            <BookOpen className="w-12 h-12 text-muted-foreground/60 mb-3" />
            <p className="font-semibold text-base">No stories match filters</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Try adjusting your query strings or filters.
            </p>
            {hasActiveFilters && (
              <Button variant="secondary" onClick={clearFilters} className="rounded-xl">
                Reset Search
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedResults.map((story) => (
              <StoryCard
                key={story.story_id}
                story={story}
                onDelete={(s) => {
                  setDeleteTarget(s);
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
        ) : (
          <StoryTable
            stories={paginatedResults}
            onDelete={(s) => {
              setDeleteTarget(s);
              setDeleteOpen(true);
            }}
            onDuplicate={handleDuplicate}
            onPreview={(s) => {
              setPreviewStory(s);
              setPreviewOpen(true);
            }}
          />
        )}

        {/* Pagination Controls */}
        {resultCount > 0 && !isLoading && !isError && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, resultCount)} of {resultCount} stories
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">Per page:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(val) => {
                    setItemsPerPage(Number(val));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-20 rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 px-3"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="text-sm font-medium w-16 text-center">
                  {currentPage} / {totalPages || 1}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl h-9 px-3"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Preview Modal */}
      <StoryPreview
        story={previewStory}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Story Archive"
        description="Are you sure you want to delete this story? This will permanently delete the entire story folder, including the story.json file and all associated image assets from your Google Drive."
        confirmLabel="Delete Permanently"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </PageLayout>
  );
}
