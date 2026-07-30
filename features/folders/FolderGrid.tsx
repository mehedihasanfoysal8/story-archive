"use client";

import { Folder, ChevronRight, FileText, FileJson, Calendar, MoreVertical, Edit3, Trash2, CornerDownRight } from "lucide-react";
import { FolderContextMenu } from "./FolderContextMenu";
import { formatRelativeDate } from "@/utils/helpers";
import type { DriveFile } from "@/types/drive";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface FolderGridProps {
  items: DriveFile[];
  onOpen: (id: string, name: string, mimeType: string) => void;
  onRename: (id: string, name: string, isFolder: boolean) => void;
  onMove: (id: string, currentParentId: string) => void;
  onDelete: (id: string, isFolder: boolean, name: string) => void;
  currentParentId: string;
}

export function FolderGrid({
  items,
  onOpen,
  onRename,
  onMove,
  onDelete,
  currentParentId,
}: FolderGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed rounded-2xl text-muted-foreground">
        <Folder className="w-8 h-8 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">This folder is empty</p>
        <p className="text-xs mt-1">Use "New Folder" or "Add File" above to add content.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => {
        const isFolder = item.mimeType === "application/vnd.google-apps.folder";
        const isJson = item.name.endsWith(".json");
        const isDocx = item.mimeType === "application/vnd.google-apps.document" || item.name.endsWith(".docx") || item.name.endsWith(".doc") || item.name.endsWith(".docs");

        return (
          <FolderContextMenu
            key={item.id}
            isFolder={isFolder}
            onOpen={() => onOpen(item.id, item.name, item.mimeType)}
            onRename={() => onRename(item.id, item.name, isFolder)}
            onMove={isFolder ? () => onMove(item.id, currentParentId) : undefined}
            onDelete={() => onDelete(item.id, isFolder, item.name)}
          >
            <div
              className="flex items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/40 select-none cursor-pointer group transition-all relative"
              onClick={() => onOpen(item.id, item.name, item.mimeType)}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform ${isFolder
                  ? "bg-primary/10 text-primary"
                  : isDocx
                    ? "bg-blue-500/10 text-blue-600"
                    : "bg-emerald-500/10 text-emerald-600"
                  }`}
              >
                {isFolder ? (
                  <Folder className="w-5 h-5 fill-primary/10" />
                ) : isJson ? (
                  <FileJson className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <span className="font-semibold line-clamp-2 text-sm block group-hover:text-primary transition-colors">
                  {item.name}
                </span>
                <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {formatRelativeDate(item.modifiedTime)}
                </span>
              </div>

              {/* Action Dropdown Button (Visible on card) */}
              <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-lg opacity-70 hover:opacity-100 group-hover:bg-muted"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 rounded-xl">
                    <DropdownMenuItem onClick={() => onOpen(item.id, item.name, item.mimeType)}>
                      {isFolder ? <Folder className="w-4 h-4 mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                      Open {isFolder ? "Folder" : "File"}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => onRename(item.id, item.name, isFolder)}>
                      <Edit3 className="w-4 h-4 mr-2 text-muted-foreground" />
                      Rename
                    </DropdownMenuItem>

                    {isFolder && (
                      <DropdownMenuItem onClick={() => onMove(item.id, currentParentId)}>
                        <CornerDownRight className="w-4 h-4 mr-2 text-muted-foreground" />
                        Move Folder
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      onClick={() => onDelete(item.id, isFolder, item.name)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete {isFolder ? "Folder" : "File"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {isFolder && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            </div>
          </FolderContextMenu>
        );
      })}
    </div>
  );
}
