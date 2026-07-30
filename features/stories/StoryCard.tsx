"use client";

import Link from "next/link";
import { BookOpen, User, Calendar, Globe, Trash2, Edit2, Copy, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/utils/helpers";
import { getImageUrl } from "@/services/images";
import { useAuth } from "@/hooks/useAuth";
import type { StoryWithMeta } from "@/types/story";
import { ROUTES } from "@/config/app";
import Image from "next/image";
import { useState, useEffect } from "react";

interface StoryCardProps {
  story: StoryWithMeta;
  onDelete: (storyFolderId: string) => void;
  onDuplicate: (story: StoryWithMeta) => void;
  onPreview: (story: StoryWithMeta) => void;
}

export function StoryCard({
  story,
  onDelete,
  onDuplicate,
  onPreview,
}: StoryCardProps) {
  const { accessToken } = useAuth();
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // If there are image_ids, we try to load the first image as cover.
  // Alternatively, the story list logic fetch will find cover.jpg file id.
  useEffect(() => {
    if (story.image_ids && story.image_ids.length > 0 && accessToken) {
      setCoverUrl(getImageUrl(story.image_ids[0], accessToken));
    }
  }, [story.image_ids, accessToken]);

  return (
    <div className="border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] bg-muted w-full overflow-hidden border-b flex items-center justify-center">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={story.bangla_story_title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-muted-foreground/60">
            <BookOpen className="w-8 h-8 stroke-[1.5]" />
            <span className="text-[10px] uppercase tracking-wider font-semibold">No Cover</span>
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-lg shadow"
            onClick={() => onPreview(story)}
            title="Preview Story"
          >
            <FileText className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="w-8 h-8 rounded-lg shadow"
            onClick={() => onDuplicate(story)}
            title="Duplicate Story"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Info Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {story.origin_country || "Unknown Country"}
          </span>
          <h4 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {story.bangla_story_title || "Untitled Story"}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {story.story_in_bangla || "No description / content available."}
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex flex-wrap gap-y-1.5 gap-x-3 text-xs text-muted-foreground border-t pt-3">
            {story.bangla_writer_name && (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <User className="w-3.5 h-3.5" />
                {story.bangla_writer_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatRelativeDate(story.lastModified)}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              href={ROUTES.story(story.driveFileId)}
              className="flex-1"
            >
              <Button size="sm" className="w-full rounded-xl" variant="outline">
                <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                Edit Story
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="w-9 h-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete(story.driveFolderId)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
