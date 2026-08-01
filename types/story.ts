export interface Story {
  story_id: string;
  bangla_story_title: string;
  bangla_book_name: string;
  story_in_bangla: string;
  bangla_writer_name: string;
  bangla_publisher: string;
  bangla_publication_year: number | null;
  image_ids: string[];
  num_images: number | null;
  origin_country: string;
  original_story_book_name: string;
  original_story_writer_name: string;
  original_language: string;
  original_story_in_that_language: string;
  original_publication_year: number | null;
  source_tradition: string;
  atu_tale_type: string;
  moral_or_theme: string;
  target_age_group: string;
}

export type StoryFormData = Omit<Story, "story_id" | "image_ids" | "num_images">;

export interface StoryWithMeta extends Story {
  /** Drive file ID of the stories.json that contains this story */
  storiesFileId: string;
  driveFolderId: string;
  folderName?: string;
  coverImageId?: string;
  folderPath: string[];
  lastModified: string;
  country?: string;
  collection?: string;
}

export interface StoryFolder {
  id: string;
  name: string;
  parentId: string;
  country: string;
  collection: string;
  storyId: string;
  driveId: string;
}

export const EMPTY_STORY: Story = {
  story_id: "",
  bangla_story_title: "",
  bangla_book_name: "",
  story_in_bangla: "",
  bangla_writer_name: "",
  bangla_publisher: "",
  bangla_publication_year: null,
  image_ids: [],
  num_images: null,
  origin_country: "",
  original_story_book_name: "",
  original_story_writer_name: "",
  original_language: "",
  original_story_in_that_language: "",
  original_publication_year: null,
  source_tradition: "",
  atu_tale_type: "",
  moral_or_theme: "",
  target_age_group: "",
};
