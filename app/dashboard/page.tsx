"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardPage />
    </AuthGuard>
  );
}
