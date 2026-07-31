"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { DriveOverviewPage } from "@/features/drive-overview/DriveOverviewPage";

export default function DriveOverviewRoute() {
  return (
    <AuthGuard>
      <DriveOverviewPage />
    </AuthGuard>
  );
}
