"use client";

import { useState, useMemo, useCallback } from "react";
import Fuse, { type IFuseOptions } from "fuse.js";
import type { StoryWithMeta } from "@/types/story";
import { APP_CONFIG } from "@/config/app";

const FUSE_OPTIONS: IFuseOptions<StoryWithMeta> = {
  includeScore: true,
  threshold: 0.35,
  minMatchCharLength: 2,
  keys: [
    { name: "bangla_story_title", weight: 0.3 },
    { name: "bangla_writer_name", weight: 0.2 },
    { name: "origin_country", weight: 0.15 },
    { name: "original_language", weight: 0.1 },
    { name: "bangla_publisher", weight: 0.1 },
    { name: "moral_or_theme", weight: 0.1 },
    { name: "atu_tale_type", weight: 0.05 },
    { name: "bangla_book_name", weight: 0.1 },
    { name: "original_story_book_name", weight: 0.1 },
    { name: "original_story_writer_name", weight: 0.1 },
  ],
};

export interface SearchFilters {
  country?: string;
  language?: string;
  writer?: string;
  publisher?: string;
  ageGroup?: string;
  atu?: string;
  folderName?: string;
}

export function useSearch(stories: StoryWithMeta[]) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});

  const fuse = useMemo(() => new Fuse(stories, FUSE_OPTIONS), [stories]);

  const results = useMemo(() => {
    let filtered = stories;

    // Apply facet filters
    if (filters.country) {
      filtered = filtered.filter(
        (s) => s.origin_country?.toLowerCase() === filters.country!.toLowerCase()
      );
    }
    if (filters.language) {
      filtered = filtered.filter(
        (s) => s.original_language?.toLowerCase() === filters.language!.toLowerCase()
      );
    }
    if (filters.writer) {
      filtered = filtered.filter((s) =>
        s.bangla_writer_name?.toLowerCase().includes(filters.writer!.toLowerCase())
      );
    }
    if (filters.publisher) {
      filtered = filtered.filter((s) =>
        s.bangla_publisher?.toLowerCase().includes(filters.publisher!.toLowerCase())
      );
    }
    if (filters.ageGroup) {
      filtered = filtered.filter((s) => s.target_age_group === filters.ageGroup);
    }
    if (filters.atu) {
      filtered = filtered.filter((s) =>
        s.atu_tale_type?.toLowerCase().includes(filters.atu!.toLowerCase())
      );
    }
    if (filters.folderName) {
      filtered = filtered.filter((s) => s.folderName === filters.folderName);
    }

    // Apply text search
    if (!query.trim()) return filtered;

    const fuseWithFiltered = new Fuse(filtered, FUSE_OPTIONS);
    return fuseWithFiltered.search(query).map((r) => r.item);
  }, [stories, query, filters, fuse]);

  // Derive unique filter options
  const filterOptions = useMemo(() => ({
    countries: [...new Set(stories.map((s) => s.origin_country).filter(Boolean))].sort(),
    languages: [...new Set(stories.map((s) => s.original_language).filter(Boolean))].sort(),
    writers: [...new Set(stories.map((s) => s.bangla_writer_name).filter(Boolean))].sort(),
    publishers: [...new Set(stories.map((s) => s.bangla_publisher).filter(Boolean))].sort(),
    ageGroups: [...new Set(stories.map((s) => s.target_age_group).filter(Boolean))].sort(),
    folders: [...new Set(stories.map((s) => s.folderName).filter((f): f is string => !!f))].sort(),
  }), [stories]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setFilters({});
  }, []);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    filterOptions,
    clearFilters,
    hasActiveFilters: !!query || Object.values(filters).some(Boolean),
    totalCount: stories.length,
    resultCount: results.length,
  };
}
