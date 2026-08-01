"use client";

import { useState } from "react";
import { useStoryImages, useUploadImages, useDeleteImage } from "@/hooks/useImages";
import { renameFile } from "@/services/drive/folders";
import { ImageDropzone } from "./ImageDropzone";
import { ImageCard } from "./ImageCard";
import { ImagePreview } from "./ImagePreview";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { MultiFileProgress } from "@/components/common/ProgressBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Grid, Layers, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

interface StoryImageManagerProps {
  folderId: string;
  storyId?: string;
}

export function StoryImageManager({ folderId, storyId }: StoryImageManagerProps) {
  const { data: images = [], isLoading, refetch } = useStoryImages(folderId, storyId);
  const { mutateAsync: uploadImagesMut, progress, isPending: uploading } = useUploadImages(folderId);
  const deleteImageMutation = useDeleteImage(folderId);

  // Modals
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const handleUpload = async (files: File[]) => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Images
        </Button>
      </div>

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

      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Grid className="w-5 h-5 text-primary" />
          Gallery ({images.length})
        </h3>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 border rounded-2xl text-muted-foreground text-sm">
            No images uploaded yet.
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

      <ImagePreview url={previewUrl} open={previewOpen} onOpenChange={setPreviewOpen} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete Image File"
        description="Are you sure you want to delete this image? This action will permanently remove it from Google Drive."
        confirmLabel="Delete Permanently"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteImageMutation.isPending}
      />

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rename Image File</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Filename</Label>
              <Input value={renameName} onChange={(e) => setRenameName(e.target.value)} autoFocus />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={renaming || !renameName.trim()}>
                {renaming ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
