"use client";

import { useQuery } from "@tanstack/react-query";
import { getDriveAbout, parseStorageInfo } from "@/services/drive/storage";
import { ProgressBar } from "@/components/common/ProgressBar";
import { Database, HardDrive, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export function StorageWidget() {
  const { data: about, isLoading, error } = useQuery({
    queryKey: ["drive", "about"],
    queryFn: getDriveAbout,
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  if (isLoading) {
    return (
      <div className="border rounded-2xl bg-card p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-4 w-1/3 bg-muted rounded" />
        <div className="h-8 w-2/3 bg-muted rounded" />
        <div className="h-2 w-full bg-muted rounded-full" />
      </div>
    );
  }

  if (error || !about) {
    return (
      <div className="border rounded-2xl bg-card p-6 shadow-sm flex items-center justify-center gap-3 text-destructive text-sm bg-destructive/5">
        <AlertTriangle className="w-5 h-5" />
        <span>Failed to load Google Drive storage quota info.</span>
      </div>
    );
  }

  const info = parseStorageInfo(about);

  return (
    <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg">Google Drive Storage</h3>
        </div>
        <Database className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <span className="text-3xl font-bold tracking-tight">{info.displayUsed}</span>
          <span className="text-sm text-muted-foreground">used of {info.displayTotal}</span>
        </div>

        <ProgressBar
          value={info.usedPercent}
          color={info.usedPercent > 85 ? "destructive" : info.usedPercent > 70 ? "warning" : "primary"}
          size="md"
        />

        <div className="flex justify-between text-xs text-muted-foreground pt-1">
          <span>{info.usedPercent}% Capacity Used</span>
          <span>{info.displayFree} Free</span>
        </div>
      </div>
    </div>
  );
}
