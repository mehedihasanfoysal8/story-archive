"use client";

import { useAuth } from "@/hooks/useAuth";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";
import { HardDrive, Monitor, Sun, Moon, Keyboard, ShieldAlert, LogOut, RefreshCw, CheckCircle2 } from "lucide-react";
import { KEYBOARD_SHORTCUTS } from "@/config/app";
import { useState } from "react";
import toast from "react-hot-toast";

import { extractFolderIdFromUrl } from "@/utils/helpers";

export function SettingsPage() {
  const { logout, rootFolderId, setRootFolderId } = useAuth();
  const { theme, setTheme } = useTheme();

  const [folderIdInput, setFolderIdInput] = useState(rootFolderId || "");
  const [updatingFolder, setUpdatingFolder] = useState(false);

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    const extractedId = extractFolderIdFromUrl(folderIdInput);
    if (!extractedId) return;

    try {
      setUpdatingFolder(true);
      const { getFile } = await import("@/services/drive/folders");
      const folder = await getFile(extractedId);
      if (folder.mimeType === "application/vnd.google-apps.folder") {
        setRootFolderId(folder.id);
        toast.success("Root storage folder updated successfully");
      } else {
        toast.error("Provided link/ID is not a folder");
      }
    } catch {
      toast.error("Could not find a folder with this ID in your Google Drive");
    } finally {
      setUpdatingFolder(false);
    }
  };

  return (
    <PageLayout title="Settings">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Drive Storage settings */}
        <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-primary" />
            Google Drive Connection
          </h3>
          <p className="text-sm text-muted-foreground">
            Current storage folder mapped for saving stories, JSON metadata schemas, and images:
          </p>
          <form onSubmit={handleUpdateFolder} className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  value={folderIdInput}
                  onChange={(e) => setFolderIdInput(e.target.value)}
                  placeholder="Paste Google Drive Folder ID"
                />
              </div>
              <Button type="submit" disabled={updatingFolder || folderIdInput === rootFolderId}>
                {updatingFolder ? "Verifying..." : "Update Root Folder"}
              </Button>
            </div>
          </form>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            <span>Changing the root folder ID will redirect you to reload Drive statistics.</span>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Monitor className="w-5 h-5 text-primary" />
            Theme Preferences
          </h3>
          <p className="text-sm text-muted-foreground">
            Choose the visual experience that suits your environment:
          </p>
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-accent text-center transition-all ${
                theme === "light" ? "border-primary bg-primary/5" : ""
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500 mb-2" />
              <span className="text-xs font-semibold">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-accent text-center transition-all ${
                theme === "dark" ? "border-primary bg-primary/5" : ""
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400 mb-2" />
              <span className="text-xs font-semibold">Dark</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center justify-center p-4 border rounded-xl hover:bg-accent text-center transition-all ${
                theme === "system" ? "border-primary bg-primary/5" : ""
              }`}
            >
              <Monitor className="w-5 h-5 text-muted-foreground mb-2" />
              <span className="text-xs font-semibold">System</span>
            </button>
          </div>
        </div>

        {/* Keyboard Shortcuts Reference */}
        <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            Keyboard Shortcuts Cheat Sheet
          </h3>
          <div className="divide-y pt-2">
            {Object.entries(KEYBOARD_SHORTCUTS).map(([key, item]) => (
              <div key={key} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <kbd className="px-2 py-1 rounded bg-muted border font-mono text-xs shadow-sm">
                  {"ctrl" in item && "⌘"}
                  {"shift" in item && " + Shift"}
                  {" + "}
                  {item.key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone / Logout */}
        <div className="border border-destructive/20 rounded-2xl bg-destructive/5 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-destructive flex items-center gap-2">
            Danger Zone
          </h3>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-xs text-muted-foreground max-w-lg">
              Sign out from Google OAuth session and clear credentials, root mappings, and metadata caching on this machine.
            </p>
            <Button variant="destructive" onClick={logout} className="rounded-xl">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out Session
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
