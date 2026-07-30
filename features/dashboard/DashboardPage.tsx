"use client";

import { useAuth } from "@/hooks/useAuth";
import { useStories } from "@/hooks/useStories";
import { StatsCard } from "./StatsCard";
import { RecentStories } from "./RecentStories";
import { StorageWidget } from "./StorageWidget";
import { BookOpen, Globe, FolderTree, Image as ImageIcon, Sparkles, FolderUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";
import { useMemo } from "react";
import { ROUTES } from "@/config/app";

export function DashboardPage() {
  const { rootFolderId } = useAuth();
  const { data: stories, isLoading } = useStories(rootFolderId);
  const router = useRouter();

  const stats = useMemo(() => {
    if (!stories) return { storiesCount: 0, countriesCount: 0, collectionsCount: 0, imagesCount: 0 };

    const countries = new Set<string>();
    const collections = new Set<string>();
    let totalImages = 0;

    stories.forEach((story) => {
      if (story.origin_country) countries.add(story.origin_country);
      // Derive collection from folder path or standard fields
      if (story.source_tradition) collections.add(story.source_tradition);
      totalImages += story.image_ids?.length || 0;
    });

    return {
      storiesCount: stories.length,
      countriesCount: countries.size,
      collectionsCount: collections.size,
      imagesCount: totalImages,
    };
  }, [stories]);

  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="p-6 space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
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
              You are connected directly to your Google Drive storage. All changes sync in real-time.
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
              onClick={() => router.push(ROUTES.stories)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Stories"
            value={stats.storiesCount}
            description="Active story json files"
            icon={<BookOpen className="w-5 h-5" />}
          />
          <StatsCard
            title="Countries"
            value={stats.countriesCount}
            description="Unique origin countries"
            icon={<Globe className="w-5 h-5" />}
          />
          <StatsCard
            title="Collections"
            value={stats.collectionsCount}
            description="Unique traditions/genres"
            icon={<FolderTree className="w-5 h-5" />}
          />
          <StatsCard
            title="Total Images"
            value={stats.imagesCount}
            description="Story covers and pages"
            icon={<ImageIcon className="w-5 h-5" />}
          />
        </div>

        {/* Detailed widgets grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentStories stories={stories || []} />
          </div>
          <div>
            <StorageWidget />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
