"use client";

import { useDropzone } from "react-dropzone";
import { useEffect, useRef, useState } from "react";
import { UploadCloud, ClipboardPaste } from "lucide-react";
import { validateImage } from "@/services/images";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

interface ImageDropzoneProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
}

export function ImageDropzone({ onUpload, disabled = false }: ImageDropzoneProps) {
  const [pasteFlash, setPasteFlash] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const processFiles = (files: File[]) => {
    const validFiles: File[] = [];
    for (const file of files) {
      const val = validateImage(file);
      if (val.valid) {
        validFiles.push(file);
      } else {
        toast.error(`${file.name}: ${val.error}`);
      }
    }
    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    onDrop: (acceptedFiles) => {
      processFiles(acceptedFiles);
    },
  });

  // Clipboard paste support (Ctrl+V anywhere on the page)
  useEffect(() => {
    if (disabled) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            // Give it a readable filename with timestamp
            const ext = item.type.split("/")[1] ?? "png";
            const named = new File(
              [file],
              `pasted-image-${Date.now()}.${ext}`,
              { type: item.type }
            );
            imageFiles.push(named);
          }
        }
      }

      if (imageFiles.length > 0) {
        // Trigger flash animation
        setPasteFlash(true);
        setTimeout(() => setPasteFlash(false), 600);
        processFiles(imageFiles);
        toast.success(
          imageFiles.length === 1
            ? "Pasted 1 image from clipboard!"
            : `Pasted ${imageFiles.length} images from clipboard!`
        );
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [disabled, onUpload]);

  return (
    <div
      ref={containerRef}
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer select-none transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5 scale-[0.99]"
          : pasteFlash
          ? "border-green-500 bg-green-500/10 scale-[0.99]"
          : "border-border hover:border-primary/50 hover:bg-muted/40",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center mb-1 transition-all duration-200",
          pasteFlash
            ? "bg-green-500/20 text-green-500"
            : "bg-primary/10 text-primary"
        )}
      >
        {pasteFlash ? (
          <ClipboardPaste className="w-6 h-6" />
        ) : (
          <UploadCloud className="w-6 h-6" />
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold">
          {isDragActive
            ? "Drop images here..."
            : pasteFlash
            ? "Image pasted!"
            : "Drag & drop images here"}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports JPEG, PNG, WEBP, and GIF up to 10MB per file
        </p>
        <p className="text-xs text-muted-foreground/70 flex items-center justify-center gap-1 pt-0.5">
          <ClipboardPaste className="w-3 h-3" />
          Or press{" "}
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-muted border border-border rounded">
            Ctrl+V
          </kbd>{" "}
          to paste from clipboard
        </p>
      </div>
    </div>
  );
}
