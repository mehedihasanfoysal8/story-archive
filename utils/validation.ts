import { z } from "zod";

export const StorySchema = z.object({
  story_id: z.string().min(1, "Story ID is required"),
  bangla_story_title: z.string().min(1, "Story title is required"),
  bangla_book_name: z.string().default(""),
  story_in_bangla: z.string().default(""),
  bangla_writer_name: z.string().default(""),
  bangla_publisher: z.string().default(""),
  bangla_publication_year: z.number().nullable().default(null),
  image_ids: z.array(z.string()).default([]),
  num_images: z.number().nullable().default(null),
  origin_country: z.string().default(""),
  original_story_book_name: z.string().default(""),
  original_story_writer_name: z.string().default(""),
  original_language: z.string().default(""),
  original_story_in_that_language: z.string().default(""),
  original_publication_year: z.number().nullable().default(null),
  source_tradition: z.string().default(""),
  atu_tale_type: z.string().default(""),
  moral_or_theme: z.string().default(""),
  target_age_group: z.string().default(""),
});

export type StorySchemaType = z.infer<typeof StorySchema>;

export const CreateStoryFormSchema = z.object({
  bangla_story_title: z.string().min(1, "Title is required"),
  story_id: z.string().optional().default(""),
  targetFolderId: z.string().optional().default(""),
  country: z.string().optional().default(""),
  collection: z.string().optional().default(""),
  storyFolderName: z.string().optional().default(""),
  bangla_book_name: z.string().optional().default(""),
  story_in_bangla: z.string().optional().default(""),
  bangla_writer_name: z.string().optional().default(""),
  bangla_publisher: z.string().optional().default(""),
  bangla_publication_year: z.coerce.number().nullable().optional(),
  origin_country: z.string().optional().default(""),
  original_story_book_name: z.string().optional().default(""),
  original_story_writer_name: z.string().optional().default(""),
  original_language: z.string().optional().default(""),
  original_story_in_that_language: z.string().optional().default(""),
  original_publication_year: z.coerce.number().nullable().optional(),
  source_tradition: z.string().optional().default(""),
  atu_tale_type: z.string().optional().default(""),
  moral_or_theme: z.string().optional().default(""),
  target_age_group: z.string().optional().default(""),
});

export type CreateStoryFormData = z.infer<typeof CreateStoryFormSchema>;

export const FolderSchema = z.object({
  name: z
    .string()
    .min(1, "Folder name is required")
    .max(100, "Name too long")
    .regex(/^[^/\\:*?"<>|]+$/, "Invalid characters in folder name"),
});

export type FolderFormData = z.infer<typeof FolderSchema>;

export function validateStoryJSON(json: unknown): {
  valid: boolean;
  data?: StorySchemaType;
  errors?: string[];
} {
  const result = StorySchema.safeParse(json);
  if (result.success) {
    return { valid: true, data: result.data };
  }
  return {
    valid: false,
    errors: result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
  };
}
