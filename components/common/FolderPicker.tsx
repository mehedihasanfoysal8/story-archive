"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFolderTree } from "@/hooks/useFolders";
import { Search, Folder, ChevronRight, FolderOpen, Check, Home, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/cn";
import type { DriveFolder } from "@/types/drive";

type TreeFolder = DriveFolder & { children?: TreeFolder[] };

interface FolderPickerProps {
  value: string; // selected folder ID
  onChange: (folderId: string, folderName?: string) => void;
  className?: string;
}

// Flatten tree for quick global search
function flattenTreeWithPaths(
  folders: TreeFolder[],
  parentPath = "Root"
): { id: string; name: string; path: string; rawFolder: TreeFolder }[] {
  let result: { id: string; name: string; path: string; rawFolder: TreeFolder }[] = [];

  for (const folder of folders) {
    const currentPath = `${parentPath} / ${folder.name}`;
    result.push({
      id: folder.id,
      name: folder.name,
      path: currentPath,
      rawFolder: folder,
    });

    if (folder.children && folder.children.length > 0) {
      result = result.concat(flattenTreeWithPaths(folder.children, currentPath));
    }
  }

  return result;
}

export function FolderPicker({ value, onChange, className }: FolderPickerProps) {
  const { rootFolderId } = useAuth();
  const { data: tree = [], isLoading } = useFolderTree(rootFolderId);

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Navigation path stack for cascading view: [{ id: rootFolderId, name: "Root", children: tree }]
  const [navHistory, setNavHistory] = useState<{ id: string; name: string; children: TreeFolder[] }[]>([]);

  // Current folder level children
  const currentLevel = useMemo(() => {
    if (navHistory.length === 0) {
      return { id: rootFolderId || "", name: "Root Storage", children: tree };
    }
    return navHistory[navHistory.length - 1];
  }, [navHistory, tree, rootFolderId]);

  // Flattened tree for search
  const flatFolders = useMemo(() => flattenTreeWithPaths(tree), [tree]);

  // Filtered list when searching
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return flatFolders.filter(
      (f) => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q)
    );
  }, [searchQuery, flatFolders]);

  // Selected folder display name
  const selectedDisplay = useMemo(() => {
    if (!value || value === rootFolderId) return "/ (Root Storage Folder)";
    const match = flatFolders.find((f) => f.id === value);
    return match ? match.path : "Selected Folder";
  }, [value, rootFolderId, flatFolders]);

  const handleSelectFolder = (id: string, name?: string) => {
    onChange(id, name);
    setOpen(false);
  };

  const drillIntoFolder = (folder: TreeFolder) => {
    setNavHistory((prev) => [
      ...prev,
      { id: folder.id, name: folder.name, children: folder.children || [] },
    ]);
  };

  const navigateBack = () => {
    setNavHistory((prev) => prev.slice(0, prev.length - 1));
  };

  const resetToRoot = () => {
    setNavHistory([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between rounded-xl h-11 bg-background text-left font-normal truncate",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate text-xs font-medium">
            <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="truncate">{selectedDisplay}</span>
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-60 flex-shrink-0" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[400px] p-0 rounded-2xl shadow-xl border overflow-hidden" style={{ zIndex: 9999 }}>
        {/* Search Header */}
        <div className="p-3 border-b bg-muted/30 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search folders (e.g. folder 1.2)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl text-xs bg-background"
            />
          </div>

          {/* Cascading Breadcrumb Bar (when not searching) */}
          {!searchQuery && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={resetToRoot}
                className="flex items-center gap-1 hover:text-foreground font-semibold flex-shrink-0"
              >
                <Home className="w-3.5 h-3.5" />
                Root
              </button>
              {navHistory.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-1 flex-shrink-0">
                  <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
                  <button
                    type="button"
                    onClick={() => setNavHistory((prev) => prev.slice(0, idx + 1))}
                    className="hover:text-foreground font-semibold truncate max-w-[90px]"
                  >
                    {item.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Picker Content Body */}
        <div className="max-h-64 overflow-y-auto p-2 space-y-1">
          {searchQuery ? (
            /* Search Results Mode */
            searchResults.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No matching folders found.
              </div>
            ) : (
              searchResults.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectFolder(item.id, item.name)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs hover:bg-accent transition-colors group",
                    value === item.id && "bg-primary/10 text-primary font-semibold"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="truncate">
                      <span className="font-semibold block truncate">{item.name}</span>
                      <span className="text-[10px] text-muted-foreground block truncate">{item.path}</span>
                    </div>
                  </div>
                  {value === item.id && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                </button>
              ))
            )
          ) : (
            /* Cascading Drill-Down Mode */
            <>
              {/* Option to select current level folder */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border text-xs mb-2">
                <span className="truncate text-muted-foreground font-medium">
                  Select: <span className="text-foreground font-semibold">{currentLevel.name}</span>
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-xs rounded-lg px-2.5"
                  onClick={() => handleSelectFolder(currentLevel.id, currentLevel.name)}
                >
                  Select Here
                </Button>
              </div>

              {navHistory.length > 0 && (
                <button
                  type="button"
                  onClick={navigateBack}
                  className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs hover:bg-accent text-muted-foreground font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to previous folder
                </button>
              )}

              {isLoading ? (
                <div className="space-y-1.5 p-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-8 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : currentLevel.children.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No subfolders inside this level.
                </div>
              ) : (
                currentLevel.children.map((folder) => {
                  const hasSubfolders = folder.children && folder.children.length > 0;
                  const isSelected = value === folder.id;

                  return (
                    <div
                      key={folder.id}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-xl hover:bg-accent/60 text-xs transition-colors group",
                        isSelected && "bg-primary/10 text-primary font-semibold"
                      )}
                    >
                      {/* Click folder name to select it */}
                      <button
                        type="button"
                        onClick={() => handleSelectFolder(folder.id, folder.name)}
                        className="flex-1 flex items-center gap-2 text-left min-w-0 py-1"
                      >
                        <Folder className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="truncate">{folder.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-1 flex-shrink-0" />}
                      </button>

                      {/* Click chevron to drill deeper */}
                      {hasSubfolders && (
                        <button
                          type="button"
                          onClick={() => drillIntoFolder(folder)}
                          className="px-2 py-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-[10px]"
                          title="Open subfolders"
                        >
                          <span>({folder.children!.length})</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
