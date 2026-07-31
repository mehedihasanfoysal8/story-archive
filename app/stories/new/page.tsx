"use client";

import { AuthGuard } from "@/features/auth/AuthGuard";
import { CreateStoryPage } from "@/features/stories/CreateStoryPage";

export default function NewStory() {
  return (
    <AuthGuard>
      <CreateStoryPage />
    </AuthGuard>
  );
}
