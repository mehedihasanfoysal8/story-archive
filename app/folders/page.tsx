"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { FolderManager } from "@/features/folders/FolderManager";

export default function Folders() {
  return (
    <AuthGuard>
      <FolderManager />
    </AuthGuard>
  );
}
