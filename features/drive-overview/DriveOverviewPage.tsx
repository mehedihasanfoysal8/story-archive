"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, ExternalLink, FileText, User } from "lucide-react";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { getDashboardSummary } from "@/services/dashboard";
import { formatRelativeDate } from "@/utils/helpers";
import type { DriveFileWithPath } from "@/types/drive";

type DriveOverviewTab = "recent" | "empty" | "non-empty";

const PAGE_SIZE = 10;

const TAB_TITLES: Record<DriveOverviewTab, string> = {
  recent: "Recent Uploads",
  empty: "Empty Docs",
  "non-empty": "Non-empty Docs",
};

function getTab(value: string | null): DriveOverviewTab {
  if (value === "empty" || value === "non-empty" || value === "recent") {
    return value;
  }
  return "recent";
}

function openDriveFile(file: DriveFileWithPath) {
  window.open(
    file.webViewLink || `https://drive.google.com/open?id=${file.id}`,
    "_blank",
    "noopener,noreferrer"
  );
}

function FileTable({
  files,
  page,
  setPage,
  emptyLabel,
}: {
  files: DriveFileWithPath[];
  page: number;
  setPage: (page: number) => void;
  emptyLabel: string;
}) {
  const pageCount = Math.max(1, Math.ceil(files.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageFiles = files.slice(start, start + PAGE_SIZE);

  if (files.length === 0) {
    return (
      <div className="border border-dashed rounded-2xl p-12 text-center text-muted-foreground">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-medium">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b bg-muted/40">
              <th className="px-4 py-3 font-medium min-w-[320px]">File Path</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Updated By</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">Last Modified</th>
              <th className="px-4 py-3 font-medium text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pageFiles.map((file) => (
              <tr key={file.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium max-w-[520px]">
                  <button
                    type="button"
                    onClick={() => openDriveFile(file)}
                    className="text-left hover:text-primary hover:underline line-clamp-2"
                  >
                    {file.displayPath}
                  </button>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {file.lastModifyingUser?.displayName ||
                      file.lastModifyingUser?.emailAddress ||
                      "Unknown user"}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatRelativeDate(file.modifiedTime)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8"
                    onClick={() => openDriveFile(file)}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 border-t bg-muted/20">
        <span className="text-xs text-muted-foreground">
          Showing {start + 1}-{Math.min(start + PAGE_SIZE, files.length)} of {files.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-xs text-muted-foreground min-w-16 text-center">
            {safePage} / {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={safePage >= pageCount}
            onClick={() => setPage(safePage + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DriveOverviewPage() {
  const { rootFolderId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = getTab(searchParams.get("tab"));
  const [pages, setPages] = useState<Record<DriveOverviewTab, number>>({
    recent: 1,
    empty: 1,
    "non-empty": 1,
  });

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ["dashboard", "summary", rootFolderId],
    queryFn: () => getDashboardSummary(rootFolderId!),
    enabled: !!rootFolderId,
    staleTime: 1000 * 60 * 5,
  });

  const lists = useMemo(
    () => ({
      recent: summary?.recentFiles || [],
      empty: summary?.emptyDocs || [],
      "non-empty": summary?.nonEmptyDocs || [],
    }),
    [summary]
  );

  const handleTabChange = (value: string) => {
    const tab = getTab(value);
    router.replace(`/drive-overview?tab=${tab}`);
  };

  const setPage = (tab: DriveOverviewTab, page: number) => {
    setPages((current) => ({ ...current, [tab]: page }));
  };

  return (
    <PageLayout title="Drive Overview">
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Drive File Overview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Review recent uploads, empty docs, and non-empty Google Docs from the connected archive.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-10 w-96 bg-muted rounded-xl animate-pulse" />
            <div className="h-[420px] bg-muted rounded-2xl animate-pulse" />
          </div>
        ) : error ? (
          <div className="border rounded-2xl p-8 text-sm text-destructive bg-destructive/5">
            Failed to load Drive overview. Please check Google Drive access.
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
            <TabsList className="grid w-full max-w-2xl grid-cols-3">
              <TabsTrigger value="recent">
                Recent Uploads ({lists.recent.length})
              </TabsTrigger>
              <TabsTrigger value="empty">
                Empty Docs ({lists.empty.length})
              </TabsTrigger>
              <TabsTrigger value="non-empty">
                Non-empty Docs ({lists["non-empty"].length})
              </TabsTrigger>
            </TabsList>

            {(Object.keys(TAB_TITLES) as DriveOverviewTab[]).map((tab) => (
              <TabsContent key={tab} value={tab} className="mt-0">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{TAB_TITLES[tab]}</h3>
                  <span className="text-xs text-muted-foreground">
                    {lists[tab].length} files
                  </span>
                </div>
                <FileTable
                  files={lists[tab]}
                  page={pages[tab]}
                  setPage={(page) => setPage(tab, page)}
                  emptyLabel={`No ${TAB_TITLES[tab].toLowerCase()} found.`}
                />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </PageLayout>
  );
}
