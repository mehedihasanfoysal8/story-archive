"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/services/dashboard";
import { StatsCard } from "./StatsCard";
import { RecentDriveUpdates } from "./RecentDriveUpdates";
import { EmptyDocsTable } from "./EmptyDocsTable";
import { StorageWidget } from "./StorageWidget";
import {
  BookOpen,
  FileWarning,
  Image as ImageIcon,
  Sparkles,
  FolderUp,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { ROUTES } from "@/config/app";

export function DashboardPage() {
  const { rootFolderId } = useAuth();
  const { data: summary, isLoading } = useQuery({
    queryKey: ["dashboard", "summary", rootFolderId],
    queryFn: () => getDashboardSummary(rootFolderId!),
    enabled: !!rootFolderId,
    staleTime: 1000 * 60 * 5,
  });
  const router = useRouter();
  const goToDriveOverview = (tab: "recent" | "empty" | "non-empty") => {
    router.push(`${ROUTES.driveOverview}?tab=${tab}`);
  };

  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="p-6 space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-28 bg-muted animate-pulse rounded-2xl"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-80 bg-muted animate-pulse rounded-2xl" />
            <div className="h-80 bg-muted animate-pulse rounded-2xl" />
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-purple-500/5 to-transparent p-6 rounded-2xl border">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Welcome to Story Archive CMS
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              You are connected directly to your Google Drive storage. All
              changes sync in real-time.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => router.push(ROUTES.folders)}
              variant="outline"
              size="sm"
              className="rounded-xl"
            >
              <FolderUp className="w-4 h-4 mr-2" />
              Folder Explorer
            </Button>
            <Button
              onClick={() => router.push(ROUTES.newStory)}
              size="sm"
              className="rounded-xl shadow-md"
              id="new-story-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Story
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatsCard
            title="Total Documents"
            value={
              (summary?.nonEmptyDocs.length || 0) +
              (summary?.emptyDocs.length || 0)
            }
            description="All Google Docs files"
            icon={<BookOpen className="w-5 h-5" />}
            // onClick={() => goToDriveOverview("non-empty")}
          />

          <StatsCard
            title="Story Documents"
            value={summary?.totalStories || 0}
            description="Google Docs containing stories"
            icon={<BookOpen className="w-5 h-5" />}
            onClick={() => goToDriveOverview("non-empty")}
          />

          <StatsCard
            title="Empty Documents"
            value={summary?.emptyDocs.length || 0}
            description="Google Docs without content"
            icon={<FileWarning className="w-5 h-5" />}
            onClick={() => goToDriveOverview("empty")}
          />
          <StatsCard
            title="Total Images"
            value={summary?.totalImages || 0}
            description="Image files in Drive archive"
            icon={<ImageIcon className="w-5 h-5" />}
          />
          <StatsCard
            title="Recent Updates"
            value={summary?.recentFiles.length || 0}
            description="Latest modified Drive files"
            icon={<FolderUp className="w-5 h-5" />}
            onClick={() => goToDriveOverview("recent")}
          />
        </div>

        {/* Detailed widgets grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentDriveUpdates
              files={(summary?.recentFiles || []).slice(0, 5)}
              onViewAll={() => goToDriveOverview("recent")}
            />
          </div>
          <div>
            <StorageWidget />
          </div>
        </div>

        <EmptyDocsTable
          docs={(summary?.emptyDocs || []).slice(0, 10)}
          onViewAll={() => goToDriveOverview("empty")}
        />
      </div>
    </PageLayout>
  );
}
