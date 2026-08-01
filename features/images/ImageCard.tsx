"use client";

import { useTheme } from "next-themes";
import { Trash2, Edit2, ZoomIn, Calendar, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/services/images";
import { useAuth } from "@/hooks/useAuth";
import { formatBytes, formatDate } from "@/utils/helpers";
import type { DriveFile } from "@/types/drive";
import { useState, useEffect } from "react";

interface ImageCardProps {
  image: DriveFile;
  onDelete: (fileId: string) => void;
  onRename: (fileId: string, currentName: string) => void;
  onPreview: (url: string) => void;
}

export function ImageCard({
  image,
  onDelete,
  onRename,
  onPreview,
}: ImageCardProps) {
  const { accessToken } = useAuth();
  const [useFallback, setUseFallback] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const primaryUrl = image.thumbnailLink
    ? image.thumbnailLink.replace(/=s\d+/, '=s1000')
    : null;
    
  // Use primary URL if available and fallback hasn't been triggered
  const url = (!useFallback && primaryUrl) ? primaryUrl : (objectUrl || "");

  // Fetch Blob fallback
  const fetchFallback = () => {
    if (!accessToken) {
      setImageError(true);
      return;
    }
    setUseFallback(true);
    fetch(`https://www.googleapis.com/drive/v3/files/${image.id}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch image blob");
        return res.blob();
      })
      .then(blob => {
        const blobUrl = URL.createObjectURL(blob);
        setObjectUrl(blobUrl);
      })
      .catch(() => setImageError(true));
  };

  useEffect(() => {
    setUseFallback(false);
    setImageError(false);
    
    // If there's no primary URL available (e.g. newly uploaded image), trigger fallback immediately
    if (!primaryUrl) {
      fetchFallback();
    }
    
    // Cleanup blob url when image changes or unmounts
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [image.id, primaryUrl, accessToken]); // re-run if these change

  const handleError = () => {
    if (!useFallback && primaryUrl) {
      fetchFallback();
    } else {
      setImageError(true);
    }
  };

  return (
    <div className="border rounded-2xl bg-card shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group">
      {/* Visual display area */}
      <div className="relative aspect-square bg-muted flex items-center justify-center border-b overflow-hidden">
        {(!url && !imageError) ? (
          <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        ) : (url && !imageError) ? (
          <img
            src={url}
            alt={image.name}
            onError={handleError}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="text-muted-foreground flex flex-col items-center gap-1">
            <span className="text-xs">Image unavailable</span>
          </div>
        )}

        {/* Hover overlay triggers */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="w-9 h-9 rounded-lg"
            onClick={() => onPreview(url)}
            title="View Full Size"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="w-9 h-9 rounded-lg"
            onClick={() => onRename(image.id, image.name)}
            title="Rename File"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="w-9 h-9 rounded-lg"
            onClick={() => onDelete(image.id)}
            title="Delete Image"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Info footer */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <span className="font-semibold text-xs text-foreground block truncate" title={image.name}>
            {image.name}
          </span>
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" />
              {image.size ? formatBytes(Number(image.size)) : "N/A"}
            </span>
            <span>
              {image.imageMediaMetadata
                ? `${image.imageMediaMetadata.width} × ${image.imageMediaMetadata.height}`
                : "Image Details"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
