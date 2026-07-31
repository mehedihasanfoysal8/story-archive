"use client";

import { Calendar, ExternalLink, FileText, User } from "lucide-react";
import { formatRelativeDate } from "@/utils/helpers";
import type { DriveFileWithPath } from "@/types/drive";

interface RecentDriveUpdatesProps {
  files: DriveFileWithPath[];
  onViewAll?: () => void;
}

export function RecentDriveUpdates({ files, onViewAll }: RecentDriveUpdatesProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-2xl bg-card text-center min-h-[300px]">
        <FileText className="w-8 h-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium">No recent file updates</p>
        <p className="text-xs text-muted-foreground mt-1">
          Updated Drive files will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="font-semibold text-lg">Recent File Updates</h3>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">Latest Drive activity</span>
        )}
      </div>

      <div className="divide-y divide-border">
        {files.map((file) => (
          <div key={file.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    file.webViewLink || `https://drive.google.com/open?id=${file.id}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="font-medium text-sm hover:underline block truncate hover:text-primary transition-colors text-left w-full"
              >
                {file.displayPath}
              </button>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {file.lastModifyingUser?.displayName ||
                    file.lastModifyingUser?.emailAddress ||
                    "Unknown user"}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatRelativeDate(file.modifiedTime)}
                </span>
                <span className="flex items-center gap-1 text-primary">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Drive
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
