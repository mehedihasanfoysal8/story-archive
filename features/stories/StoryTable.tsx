"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import Link from "next/link";
import { BookOpen, Edit, Trash2, Copy, FileText, Globe, User, Calendar, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/helpers";
import type { StoryWithMeta } from "@/types/story";
import { ROUTES } from "@/config/app";

interface StoryTableProps {
  stories: StoryWithMeta[];
  onDelete: (storyFolderId: string) => void;
  onDuplicate: (story: StoryWithMeta) => void;
  onPreview: (story: StoryWithMeta) => void;
}

export function StoryTable({
  stories,
  onDelete,
  onDuplicate,
  onPreview,
}: StoryTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: stories.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52, // 52px height row
    overscan: 10,
  });

  if (stories.length === 0) {
    return (
      <div className="text-center py-12 border rounded-2xl bg-card text-muted-foreground text-sm">
        No stories found matching your filter criteria.
      </div>
    );
  }

  return (
    <div className="border rounded-2xl bg-card overflow-hidden shadow-sm flex flex-col h-[600px]">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-muted/40 border-b text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
        <div className="col-span-4">Title</div>
        <div className="col-span-2">Writer</div>
        <div className="col-span-2">Folder</div>
        <div className="col-span-2">Country</div>
        <div className="col-span-1">Modified</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Table Body (Virtualized) */}
      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto no-scrollbar relative"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const story = stories[virtualRow.index];
            if (!story) return null;

            return (
              <div
                key={story.story_id}
                className="absolute top-0 left-0 w-full grid grid-cols-12 gap-4 px-6 items-center border-b hover:bg-muted/30 transition-colors"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="col-span-4 flex items-center gap-2.5 truncate pr-2">
                  <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-semibold text-sm truncate text-foreground">
                    {story.bangla_story_title || "Untitled Story"}
                  </span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground truncate pr-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{story.bangla_writer_name || "—"}</span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground truncate pr-2 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate font-mono text-xs">{story.folderName || "—"}</span>
                </div>
                <div className="col-span-2 text-sm text-muted-foreground truncate pr-2 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{story.origin_country || "—"}</span>
                </div>
                <div className="col-span-1 text-sm text-muted-foreground truncate flex items-center gap-1.5">
                  <span>{formatDate(story.lastModified)}</span>
                </div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-lg"
                    onClick={() => onPreview(story)}
                    title="Preview"
                  >
                    <FileText className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </Button>
                  <Link href={ROUTES.story(story.driveFileId)}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 rounded-lg"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(story.driveFileId)}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
