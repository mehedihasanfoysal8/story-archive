"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImagePreviewProps {
  url: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImagePreview({ url, open, onOpenChange }: ImagePreviewProps) {
  if (!url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-black/95 border-none p-0 overflow-hidden flex items-center justify-center h-[80vh]">
        <img
          src={url}
          alt="Preview"
          className="max-w-full max-h-full object-contain select-none"
        />
      </DialogContent>
    </Dialog>
  );
}
