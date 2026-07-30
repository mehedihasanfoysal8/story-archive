"use client";

import { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { FolderOpen, FileText, Edit3, Trash, CornerDownRight } from "lucide-react";

interface ItemContextMenuProps {
  children: ReactNode;
  isFolder: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  /** Only used for folders */
  onMove?: () => void;
}

export function FolderContextMenu({
  children,
  isFolder,
  onOpen,
  onRename,
  onDelete,
  onMove,
}: ItemContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-52 rounded-xl">
        <ContextMenuItem onClick={onOpen}>
          {isFolder ? (
            <FolderOpen className="w-4 h-4 mr-2 text-muted-foreground" />
          ) : (
            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
          )}
          {isFolder ? "Open Folder" : "Open File"}
        </ContextMenuItem>

        <ContextMenuSeparator />

        <ContextMenuItem onClick={onRename}>
          <Edit3 className="w-4 h-4 mr-2 text-muted-foreground" />
          Rename
        </ContextMenuItem>

        {isFolder && onMove && (
          <ContextMenuItem onClick={onMove}>
            <CornerDownRight className="w-4 h-4 mr-2 text-muted-foreground" />
            Move Folder
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash className="w-4 h-4 mr-2" />
          Delete {isFolder ? "Folder" : "File"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
