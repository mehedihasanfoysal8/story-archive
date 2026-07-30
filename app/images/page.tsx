"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { ImageManager } from "@/features/images/ImageManager";

export default function Images() {
  return (
    <AuthGuard>
      <ImageManager />
    </AuthGuard>
  );
}
