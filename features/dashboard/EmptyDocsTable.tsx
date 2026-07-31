"use client";

import { FileText, ExternalLink } from "lucide-react";
import { formatRelativeDate } from "@/utils/helpers";
import type { DriveFileWithPath } from "@/types/drive";

interface EmptyDocsTableProps {
  docs: DriveFileWithPath[];
  onViewAll?: () => void;
}

export function EmptyDocsTable({ docs, onViewAll }: EmptyDocsTableProps) {
  if (docs.length === 0) {
    return (
      <div className="border rounded-2xl bg-card p-6 shadow-sm text-center min-h-[180px] flex flex-col items-center justify-center">
        <FileText className="w-8 h-8 text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium">No empty docs found</p>
        <p className="text-xs text-muted-foreground mt-1">
          Every Google Docs story file has content.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-2xl bg-card p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-4">
        <h3 className="font-semibold text-lg">Empty Docs</h3>
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All
          </button>
        ) : (
          <span className="text-xs text-muted-foreground">{docs.length} excluded</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground border-b">
              <th className="pb-2 font-medium">File Name</th>
              <th className="pb-2 font-medium">Last Modified</th>
              <th className="pb-2 font-medium text-right">Open</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {docs.map((doc) => (
              <tr key={doc.id}>
                <td className="py-3 pr-4 font-medium max-w-[260px] truncate">
                  {doc.displayPath}
                </td>
                <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                  {formatRelativeDate(doc.modifiedTime)}
                </td>
                <td className="py-3 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    onClick={() =>
                      window.open(
                        doc.webViewLink || `https://drive.google.com/open?id=${doc.id}`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Open
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
