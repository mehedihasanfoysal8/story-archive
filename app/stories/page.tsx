"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { StoryManager } from "@/features/stories/StoryManager";

export default function Stories() {
  return (
    <AuthGuard>
      <StoryManager />
    </AuthGuard>
  );
}
