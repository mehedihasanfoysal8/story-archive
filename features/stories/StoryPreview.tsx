"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/services/images";
import { useAuth } from "@/hooks/useAuth";
import type { StoryWithMeta } from "@/types/story";
import { Globe, User, BookOpen, Clock, Heart, HelpCircle, Eye } from "lucide-react";
import { useState, useEffect } from "react";

interface StoryPreviewProps {
  story: StoryWithMeta | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoryPreview({ story, open, onOpenChange }: StoryPreviewProps) {
  const { accessToken } = useAuth();
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (story && story.image_ids && accessToken) {
      const urls = story.image_ids.map((id) => getImageUrl(id, accessToken));
      setImageUrls(urls);
    } else {
      setImageUrls([]);
    }
  }, [story, accessToken]);

  if (!story) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b pb-4 flex-shrink-0">
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider mb-1">
            <Globe className="w-3.5 h-3.5" />
            <span>{story.origin_country || "Global Tradition"}</span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            {story.bangla_story_title || "Untitled Story"}
          </DialogTitle>
          <DialogDescription className="text-xs flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {story.bangla_writer_name && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Writer: {story.bangla_writer_name}
              </span>
            )}
            {story.bangla_publisher && (
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Publisher: {story.bangla_publisher}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            {/* Story Bangla Body */}
            {story.story_in_bangla && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                  Story Content (Bangla)
                </h4>
                <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap font-sans bg-muted/30 p-4 rounded-xl border border-border">
                  {story.story_in_bangla}
                </p>
              </div>
            )}

            {/* Images Grid */}
            {imageUrls.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-primary" />
                  Media Gallery ({imageUrls.length})
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {imageUrls.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden bg-muted border hover:opacity-95 transition-opacity"
                    >
                      <img
                        src={url}
                        alt={`Story page ${index + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-semibold text-white">
                        {index === 0 ? "Cover" : `Image ${String(index).padStart(2, "0")}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detailed metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-5">
              <div className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground font-semibold">ATU Tale Type:</span>
                <p className="font-medium text-foreground">{story.atu_tale_type || "N/A"}</p>
              </div>
              <div className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground font-semibold">Moral or Theme:</span>
                <p className="font-medium text-foreground">{story.moral_or_theme || "N/A"}</p>
              </div>
              <div className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground font-semibold">Target Age Group:</span>
                <p className="font-medium text-foreground">{story.target_age_group || "N/A"}</p>
              </div>
              <div className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground font-semibold">Source Tradition:</span>
                <p className="font-medium text-foreground">{story.source_tradition || "N/A"}</p>
              </div>
              <div className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground font-semibold">Original Language:</span>
                <p className="font-medium text-foreground">{story.original_language || "N/A"}</p>
              </div>
              <div className="space-y-1 text-sm">
                <span className="text-xs text-muted-foreground font-semibold">Original Book:</span>
                <p className="font-medium text-foreground">{story.original_story_book_name || "N/A"}</p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
