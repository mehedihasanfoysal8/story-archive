"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/utils/cn";
import type { BreadcrumbItem } from "@/types/drive";

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  onItemClick?: (item: BreadcrumbItem) => void;
}

export function Breadcrumb({ items, className, onItemClick }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <Home className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} className="flex items-center gap-1">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[200px]">
                {item.name}
              </span>
            ) : (
              <button
                onClick={() => onItemClick?.(item)}
                className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px] hover:underline"
              >
                {item.name}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
