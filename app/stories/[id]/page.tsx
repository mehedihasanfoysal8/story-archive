"use client";

import { use } from "react";
import { AuthGuard } from "@/features/auth/AuthGuard";
import { StoryEditor } from "@/features/stories/StoryEditor";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function StoryEditorPage({ params }: PageProps) {
  const resolvedParams = use(params);
  // id = "{storiesFileId}__{storyId}"
  return (
    <AuthGuard>
      <StoryEditor encodedId={decodeURIComponent(resolvedParams.id)} />
    </AuthGuard>
  );
}
