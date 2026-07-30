"use client";

import { useState } from "react";
import { Folder, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import { cn } from "@/utils/cn";
import type { DriveFolder } from "@/types/drive";

interface FolderTreeItemProps {
  folder: DriveFolder & { children?: DriveFolder[] };
  selectedId: string | null;
  onSelect: (id: string) => void;
  depth?: number;
}

function FolderTreeItem({
  folder,
  selectedId,
  onSelect,
  depth = 0,
}: FolderTreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isSelected = selectedId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-muted/60 transition-colors",
          isSelected && "bg-primary/10 text-primary hover:bg-primary/15"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(folder.id)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="w-4 h-4 flex items-center justify-center text-muted-foreground/75 hover:text-foreground"
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )
          ) : (
            <div className="w-3.5 h-3.5" />
          )}
        </button>

        {isSelected ? (
          <FolderOpen className="w-4 h-4 text-primary flex-shrink-0" />
        ) : (
          <Folder className="w-4 h-4 text-muted-foreground/80 flex-shrink-0" />
        )}

        <span className="truncate flex-1">{folder.name}</span>
      </div>

      {expanded && hasChildren && (
        <div className="space-y-0.5 mt-0.5">
          {folder.children!.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderTreeProps {
  tree: (DriveFolder & { children?: DriveFolder[] })[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function FolderTree({
  tree,
  selectedId,
  onSelect,
  className,
}: FolderTreeProps) {
  if (tree.length === 0) {
    return (
      <div className="text-xs text-muted-foreground/60 p-4 text-center">
        No folder structure loaded
      </div>
    );
  }

  return (
    <div className={cn("space-y-0.5", className)}>
      {tree.map((folder) => (
        <FolderTreeItem
          key={folder.id}
          folder={folder}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
