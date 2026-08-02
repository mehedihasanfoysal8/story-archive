"use client";

import Link from "next/link";
import { BookOpen, Calendar, Globe, User } from "lucide-react";
import { formatRelativeDate } from "@/utils/helpers";
import type { StoryWithMeta } from "@/types/story";
import { ROUTES } from "@/config/app";

interface RecentStoriesProps {
  stories: StoryWithMeta[];
}

export function RecentStories({ stories }: RecentStoriesProps) {
  const sorted = [...stories]
    .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
    .slice(0, 5);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-2xl bg-card text-center min-h-[300px]">
        <BookOpen className="w-8 h-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium">No recent stories</p>
        <p className="text-xs text-muted-foreground mt-1">Start by creating your first story folder and file.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="font-semibold text-lg">Recent Stories</h3>
        <Link
          href={ROUTES.stories}
          className="text-xs font-semibold text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="divide-y divide-border">
        {sorted.map((story) => (
          <div key={story.story_id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <Link
                href={ROUTES.story(story.storiesFileId, story.story_id, story.driveFolderId)}
                className="font-medium text-sm hover:underline block truncate hover:text-primary transition-colors"
              >
                {story.bangla_story_title || "Untitled Story"}
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                {story.bangla_writer_name && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {story.bangla_writer_name}
                  </span>
                )}
                {story.origin_country && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    {story.origin_country}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatRelativeDate(story.lastModified)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
