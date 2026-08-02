"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useFolderContents,
  useFolderTree,
  useCreateFolder,
  useRenameFolder,
  useDeleteFolder,
  useMoveFolder,
  useCreateFile,
  useRenameFile,
  useDeleteFile,
} from "@/hooks/useFolders";
import { getFolderBreadcrumb, listFolderContents } from "@/services/drive/folders";
import { FolderGrid } from "./FolderGrid";
import { FolderTree } from "./FolderTree";
import { CreateFolderDialog } from "./CreateFolderDialog";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { PageLayout } from "@/components/layout/PageLayout";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { FolderPlus, FilePlus, ArrowLeftRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { BreadcrumbItem } from "@/types/drive";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/config/app";
import type { DriveFile } from "@/types/drive";

export function FolderManager() {
  const { rootFolderId } = useAuth();
  const router = useRouter();

  // Navigation state
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loadingCrumbs, setLoadingCrumbs] = useState(false);

  // Set initial currentId to rootFolderId once loaded
  useEffect(() => {
    if (rootFolderId && !currentId) {
      setCurrentId(rootFolderId);
    }
  }, [rootFolderId, currentId]);

  // Folder/file queries & mutations
  const { data: contents, isLoading } = useFolderContents(currentId);
  const { data: tree } = useFolderTree(rootFolderId);

  const createFolderMutation = useCreateFolder(currentId || "");
  const renameFolderMutation = useRenameFolder();
  const deleteFolderMutation = useDeleteFolder();
  const moveFolderMutation = useMoveFolder();

  const createFileMutation = useCreateFile(currentId || "");
  const renameFileMutation = useRenameFile();
  const deleteFileMutation = useDeleteFile();

  // --- Dialog/modal states ---
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [createFileOpen, setCreateFileOpen] = useState(false);

  // Rename (shared for folder & file)
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameIsFolder, setRenameIsFolder] = useState(true);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteIsFolder, setDeleteIsFolder] = useState(true);
  const [checkingFolderContents, setCheckingFolderContents] = useState(false);

  // Move (folder only)
  const [moveOpen, setMoveOpen] = useState(false);

  // Active targets
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeName, setActiveName] = useState("");
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [destinationFolderId, setDestinationFolderId] = useState<string | null>(null);

  // Load Breadcrumbs when currentId changes
  useEffect(() => {
    async function loadCrumbs() {
      if (!currentId || !rootFolderId) return;
      try {
        setLoadingCrumbs(true);
        const crumbs = await getFolderBreadcrumb(currentId, rootFolderId);
        setBreadcrumbs(crumbs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingCrumbs(false);
      }
    }
    loadCrumbs();
  }, [currentId, rootFolderId]);

  // --- Handlers ---

  const handleOpen = (item: DriveFile) => {
    if (item.mimeType === "application/vnd.google-apps.folder") {
      setCurrentId(item.id);
    } else {
      if (item.name === APP_CONFIG.storyFileName) {
        router.push(ROUTES.story(item.id, undefined, item.parents?.[0]));
        return;
      }
      const driveUrl =
        item.webViewLink || `https://drive.google.com/open?id=${item.id}`;
      window.open(driveUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCreateFolder = async (name: string) => {
    await createFolderMutation.mutateAsync(name);
    setCreateFolderOpen(false);
  };

  const handleCreateFile = async (name: string) => {
    await createFileMutation.mutateAsync(name);
    setCreateFileOpen(false);
  };

  const handleRenameSubmit = async (name: string) => {
    if (!activeId) return;
    if (renameIsFolder) {
      await renameFolderMutation.mutateAsync({ id: activeId, name });
    } else {
      const safeName = activeName.endsWith(".docx") && !name.endsWith(".docx")
        ? `${name}.docx`
        : name;
      await renameFileMutation.mutateAsync({ id: activeId, name: safeName });
    }
    setRenameOpen(false);
  };

  /**
   * Delete Handler with strict Child-First Rule:
   * If deleting a folder, check if it contains child items.
   * If child items exist -> BLOCK deletion & alert user to delete children first!
   * If empty -> open confirmation modal.
   */
  const handleDeleteTrigger = async (id: string, isFolder: boolean, name: string) => {
    setActiveId(id);
    setActiveName(name);
    setDeleteIsFolder(isFolder);

    if (isFolder) {
      try {
        setCheckingFolderContents(true);
        const res = await listFolderContents(id, { pageSize: 1 });
        if (res.files && res.files.length > 0) {
          toast.error(`Cannot delete "${name}". This folder contains child items. Please delete all nested files and subfolders first.`, {
            duration: 6000,
            icon: "⚠️",
          });
          return;
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingFolderContents(false);
      }
    }

    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!activeId) return;
    if (deleteIsFolder) {
      await deleteFolderMutation.mutateAsync(activeId);
    } else {
      await deleteFileMutation.mutateAsync(activeId);
    }
    setDeleteOpen(false);
  };

  const handleMoveConfirm = async () => {
    if (!activeId || !destinationFolderId || !targetParentId) return;
    await moveFolderMutation.mutateAsync({
      fileId: activeId,
      newParentId: destinationFolderId,
      currentParentId: targetParentId,
    });
    setMoveOpen(false);
  };

  return (
    <PageLayout title="Folder Manager">
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Left Side Tree View (Desktop only) */}
        <aside className="w-64 border-r bg-card hidden md:flex flex-col p-4 overflow-y-auto no-scrollbar">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Folder Directory
          </h3>
          <ScrollArea className="flex-1">
            <FolderTree
              tree={tree || []}
              selectedId={currentId}
              onSelect={setCurrentId}
            />
          </ScrollArea>
        </aside>

        {/* Right Side Grid View */}
        <main className="flex-1 flex flex-col p-6 overflow-y-auto min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <Breadcrumb
              items={breadcrumbs}
              onItemClick={(item) => setCurrentId(item.id)}
              className="py-1"
            />

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateFolderOpen(true)}
                className="rounded-xl"
              >
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateFileOpen(true)}
                className="rounded-xl border-blue-500/40 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              >
                <FilePlus className="w-4 h-4 mr-2" />
                Add Docs File
              </Button>
            </div>
          </div>

          {/* Directory Contents Grid */}
          <div className="flex-1">
            {isLoading || checkingFolderContents ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <FolderGrid
                items={contents?.files || []}
                currentParentId={currentId || ""}
                onOpen={handleOpen}
                onRename={(id, name, isFolder) => {
                  setActiveId(id);
                  setActiveName(name);
                  setRenameIsFolder(isFolder);
                  setRenameOpen(true);
                }}
                onMove={(id, currentParentId) => {
                  setActiveId(id);
                  setTargetParentId(currentParentId);
                  setDestinationFolderId(null);
                  setMoveOpen(true);
                }}
                onDelete={handleDeleteTrigger}
              />
            )}
          </div>
        </main>
      </div>

      {/* ─── Create Folder Dialog ─── */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        onSubmit={handleCreateFolder}
        title="Create New Folder"
        placeholder="Enter folder name..."
        submitLabel="Create Folder"
      />

      {/* ─── Create Docs File Dialog ─── */}
      <CreateFolderDialog
        open={createFileOpen}
        onOpenChange={setCreateFileOpen}
        onSubmit={handleCreateFile}
        title="Add New Docs File"
        placeholder="e.g. story_notes (.docs auto-appended)"
        submitLabel="Create Docs File"
      />

      {/* ─── Rename Dialog (shared for folder & file) ─── */}
      <CreateFolderDialog
        open={renameOpen}
        onOpenChange={setRenameOpen}
        onSubmit={handleRenameSubmit}
        title={`Rename ${renameIsFolder ? "Folder" : "Docs File"}`}
        initialName={activeName.replace(/\.(docs|doc|json)$/, "")}
        submitLabel="Save"
      />

      {/* ─── Delete Confirmation Dialog ─── */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${deleteIsFolder ? "Folder" : "File"}`}
        description={
          deleteIsFolder
            ? `Are you sure you want to delete the empty folder "${activeName}"? This action cannot be undone.`
            : `Are you sure you want to delete the file "${activeName}"? This action cannot be undone.`
        }
        confirmLabel="Delete Permanently"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        isLoading={deleteFolderMutation.isPending || deleteFileMutation.isPending}
      />

      {/* ─── Move Folder Dialog ─── */}
      <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
              Move Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">
              Select destination folder for <strong>"{activeName}"</strong>:
            </p>
            <div className="border rounded-xl p-3 max-h-[250px] overflow-y-auto bg-muted/40">
              <FolderTree
                tree={tree || []}
                selectedId={destinationFolderId}
                onSelect={setDestinationFolderId}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleMoveConfirm}
              disabled={
                !destinationFolderId ||
                destinationFolderId === activeId ||
                moveFolderMutation.isPending
              }
            >
              Move Here
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
