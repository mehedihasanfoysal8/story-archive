"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFolderContents, useGetOrCreateRootFolder } from "@/hooks/useFolders";
import { listFolderContents, createFolder } from "@/services/drive/folders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FolderPlus, LogOut, CheckCircle2, ChevronRight, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";
import { extractFolderIdFromUrl } from "@/utils/helpers";
import toast from "react-hot-toast";

export function DrivePermissionModal() {
  const { logout, setRootFolderId, accessToken } = useAuth();
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [customFolderId, setCustomFolderId] = useState("");
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadRootFolders() {
      if (!accessToken) return;
      try {
        setLoading(true);
        // List folders in Drive root
        const res = await listFolderContents("root", { foldersOnly: true });
        setFolders(res.files.map((f) => ({ id: f.id, name: f.name })));
      } catch (err) {
        console.error(err);
        toast.error("Failed to load root folders from Google Drive");
      } finally {
        setLoading(false);
      }
    }
    loadRootFolders();
  }, [accessToken]);

  const handleSelect = (id: string) => {
    setRootFolderId(id);
    toast.success("Root storage folder selected successfully");
    window.location.reload();
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const extractedId = extractFolderIdFromUrl(customFolderId);
    if (!extractedId) return;
    try {
      setLoading(true);
      const { getFile } = await import("@/services/drive/folders");
      const folder = await getFile(extractedId);
      if (folder.mimeType === "application/vnd.google-apps.folder") {
        handleSelect(folder.id);
      } else {
        toast.error("Provided link/ID is not a folder");
      }
    } catch {
      toast.error("Could not find a folder with this ID in your Google Drive");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      setCreating(true);
      const folder = await createFolder(newFolderName.trim(), "root");
      handleSelect(folder.id);
    } catch (err) {
      toast.error("Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-grid relative p-4">
      {/* Background Blurs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-card border rounded-2xl p-6 shadow-2xl relative z-10 space-y-6"
      >
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              Configure Google Drive Storage
            </h2>
            <p className="text-sm text-muted-foreground">
              Select or create a root folder in your Drive to store stories and media assets.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="text-muted-foreground">
            <LogOut className="w-4 h-4 mr-1.5" />
            Sign Out
          </Button>
        </div>

        {/* Existing root folders selection */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Choose Existing Folder
          </h3>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-11 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : folders.length === 0 ? (
            <div className="text-center p-4 border border-dashed rounded-xl text-sm text-muted-foreground">
              No folders found at the root of your Drive. Create one below!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => handleSelect(folder.id)}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-accent text-left text-sm group transition-all"
                >
                  <span className="flex items-center gap-2 font-medium truncate">
                    <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                    {folder.name}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="border-t my-6" />

        {/* Option to create a new folder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <form onSubmit={handleCreateFolder} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FolderPlus className="w-3.5 h-3.5" />
              Create New Folder
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Stories Archive"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                disabled={creating}
              />
              <Button type="submit" disabled={creating || !newFolderName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>

          {/* Option to paste ID */}
          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Paste Custom Folder ID
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="Folder ID from URL"
                value={customFolderId}
                onChange={(e) => setCustomFolderId(e.target.value)}
                disabled={loading}
              />
              <Button type="submit" variant="secondary" disabled={loading || !customFolderId.trim()}>
                Verify
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
