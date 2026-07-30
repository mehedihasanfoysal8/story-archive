"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { SearchPage } from "@/features/search/SearchPage";

export default function Search() {
  return (
    <AuthGuard>
      <SearchPage />
    </AuthGuard>
  );
}
