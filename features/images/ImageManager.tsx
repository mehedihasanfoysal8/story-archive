"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useStories } from "@/hooks/useStories";
import { useStoryImages, useUploadImages, useDeleteImage } from "@/hooks/useImages";
import { renameFile } from "@/services/drive/folders";
import { ImageDropzone } from "./ImageDropzone";
import { ImageCard } from "./ImageCard";
import { ImagePreview } from "./ImagePreview";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MultiFileProgress } from "@/components/common/ProgressBar";
import { PageLayout } from "@/components/layout/PageLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Folder, Image as ImageIcon, Grid, Sparkles, RefreshCw, Layers } from "lucide-react";
import toast from "react-hot-toast";

export function ImageManager() {
  const { rootFolderId } = useAuth();

  // Load all stories so we can select which story to edit images for
  const { data: stories = [], isLoading: loadingStories } = useStories(rootFolderId);

  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);

  const selectedStory = stories.find((s) => s.story_id === selectedStoryId);
  const selectedFolderId = selectedStory?.driveFolderId || null;

  // Queries for chosen story folder
  const { data: images = [], isLoading: loadingImages, refetch } = useStoryImages(selectedFolderId, selectedStoryId || undefined);
  const { mutateAsync: uploadImagesMut, progress, isPending: uploading } = useUploadImages(selectedFolderId || "");
  const deleteImageMutation = useDeleteImage(selectedFolderId || "");

  // Local Modal state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const handleUpload = async (files: File[]) => {
    if (!selectedFolderId) return;
    try {
      await uploadImagesMut(files);
      refetch();
    } catch {}
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    await deleteImageMutation.mutateAsync(deleteId);
    setDeleteOpen(false);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameId || !renameName.trim()) return;

    try {
      setRenaming(true);
      await renameFile(renameId, renameName.trim());
      refetch();
      setRenameOpen(false);
      toast.success("Image renamed successfully");
    } catch {
      toast.error("Failed to rename image");
    } finally {
      setRenaming(false);
    }
  };

  // selectedStory is defined above
  return (
    <PageLayout title="Image Manager">
      <div className="p-6 space-y-6">
        {/* Story Selector Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/40 p-4 rounded-2xl border">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Active Story Workspace
            </span>
            {loadingStories ? (
              <div className="h-9 w-64 bg-muted rounded animate-pulse" />
            ) : (
              <Select
                value={selectedStoryId || "NONE"}
                onValueChange={(val) => setSelectedStoryId(val === "NONE" ? null : val)}
              >
                <SelectTrigger className="w-[320px] rounded-xl">
                  <SelectValue placeholder="Select a story..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="NONE">Select a story...</SelectItem>
                  {stories.map((story) => (
                    <SelectItem key={story.story_id} value={story.story_id}>
                      {story.bangla_story_title || story.story_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedFolderId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="rounded-xl self-end"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Images
            </Button>
          )}
        </div>

        {/* Selected Workspace Contents */}
        {!selectedFolderId ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-2xl text-center min-h-[350px]">
            <ImageIcon className="w-12 h-12 text-muted-foreground/50 mb-4 stroke-[1.5]" />
            <p className="font-semibold text-base">No Story Selected</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Please select an active story from the workspace selector above to view its images.
            </p>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Images Grid */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Grid className="w-5 h-5 text-primary" />
                Image Gallery ({images.length})
              </h3>

              {loadingImages ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : images.length === 0 ? (
                <div className="text-center py-12 border rounded-2xl text-muted-foreground text-sm">
                  No images uploaded for this story yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      onDelete={(id) => {
                        setDeleteId(id);
                        setDeleteOpen(true);
                      }}
                      onRename={(id, name) => {
                        setRenameId(id);
                        setRenameName(name);
                        setRenameOpen(true);
                      }}
                      onPreview={(url) => {
                        setPreviewUrl(url);
                        setPreviewOpen(true);
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Preview */}
      <ImagePreview
        url={previewUrl}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Image File"
        description="Are you sure you want to delete this image? This action will permanently remove it from your story folder in Google Drive. This cannot be undone."
        confirmLabel="Delete Permanently"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteImageMutation.isPending}
      />

      {/* Rename Dialog */}
      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Image File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Filename</Label>
              <Input
                value={renameName}
                onChange={(e) => setRenameName(e.target.value)}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={renaming || !renameName.trim()}>
                {renaming ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
