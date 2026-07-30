"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { SettingsPage } from "@/features/settings/SettingsPage";

export default function Settings() {
  return (
    <AuthGuard>
      <SettingsPage />
    </AuthGuard>
  );
}
