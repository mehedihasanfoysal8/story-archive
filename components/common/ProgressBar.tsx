"use client";

import { cn } from "@/utils/cn";

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "destructive";
  animated?: boolean;
}

const colorMap = {
  primary: "bg-primary",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  destructive: "bg-destructive",
};

const sizeMap = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function ProgressBar({
  value,
  className,
  showLabel = false,
  size = "md",
  color = "primary",
  animated = true,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className={cn("w-full bg-muted rounded-full overflow-hidden", sizeMap[size])}>
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            colorMap[color],
            animated && clamped < 100 && "animate-pulse"
          )}
          style={{ width: `${clamped}%` }}
          role="progressbar"
          aria-valuenow={clamped}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

interface MultiFileProgressProps {
  files: { fileName: string; progress: number; status: string; error?: string }[];
}

export function MultiFileProgress({ files }: MultiFileProgressProps) {
  return (
    <div className="space-y-2">
      {files.map((file, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground truncate max-w-[200px]">{file.fileName}</span>
            <span
              className={cn(
                "font-medium",
                file.status === "complete" && "text-emerald-500",
                file.status === "error" && "text-destructive",
                file.status === "uploading" && "text-primary"
              )}
            >
              {file.status === "error"
                ? "Failed"
                : file.status === "complete"
                ? "Done"
                : `${file.progress}%`}
            </span>
          </div>
          <ProgressBar
            value={file.progress}
            size="sm"
            color={
              file.status === "error"
                ? "destructive"
                : file.status === "complete"
                ? "success"
                : "primary"
            }
            animated={file.status === "uploading"}
          />
        </div>
      ))}
    </div>
  );
}
