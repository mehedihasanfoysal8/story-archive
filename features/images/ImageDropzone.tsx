"use client";

import { useDropzone } from "react-dropzone";
import { UploadCloud, Image, FileImage } from "lucide-react";
import { validateImage } from "@/services/images";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";

interface ImageDropzoneProps {
  onUpload: (files: File[]) => void;
  disabled?: boolean;
}

export function ImageDropzone({ onUpload, disabled = false }: ImageDropzoneProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    onDrop: (acceptedFiles) => {
      const validFiles: File[] = [];
      for (const file of acceptedFiles) {
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
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer select-none transition-all duration-200",
        isDragActive
          ? "border-primary bg-primary/5 scale-[0.99]"
          : "border-border hover:border-primary/50 hover:bg-muted/40",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      <input {...getInputProps()} />

      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-1">
        <UploadCloud className="w-6 h-6" />
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm font-semibold">
          {isDragActive ? "Drop images here..." : "Drag & drop images here"}
        </p>
        <p className="text-xs text-muted-foreground">
          Supports JPEG, PNG, WEBP, and GIF up to 10MB per file
        </p>
      </div>
    </div>
  );
}
