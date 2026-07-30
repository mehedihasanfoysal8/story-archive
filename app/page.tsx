"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export default function Home() {
  return (
    <AuthGuard>
      <DashboardPage />
    </AuthGuard>
  );
}
