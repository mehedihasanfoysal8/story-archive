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

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Queries for chosen story folder
  const { data: images = [], isLoading: loadingImages, refetch } = useStoryImages(selectedFolderId);
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

  const selectedStory = stories.find((s) => s.driveFolderId === selectedFolderId);

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
                value={selectedFolderId || "NONE"}
                onValueChange={(val) => setSelectedFolderId(val === "NONE" ? null : val)}
              >
                <SelectTrigger className="w-[320px] rounded-xl">
                  <SelectValue placeholder="Select a story folder..." />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  <SelectItem value="NONE">Select a story...</SelectItem>
                  {stories.map((story) => (
                    <SelectItem key={story.driveFolderId} value={story.driveFolderId}>
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
              Please select an active story from the workspace selector above to upload and manage its images.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Upload Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ImageDropzone onUpload={handleUpload} disabled={uploading} />
              </div>
              <div>
                <div className="border rounded-2xl p-5 bg-card shadow-sm h-full space-y-4">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    Upload Status
                  </h4>
                  {progress.length > 0 ? (
                    <MultiFileProgress files={progress} />
                  ) : (
                    <p className="text-xs text-muted-foreground pt-4 text-center">
                      Ready for files. Drop them in the panel or click to upload.
                    </p>
                  )}
                </div>
              </div>
            </div>

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
