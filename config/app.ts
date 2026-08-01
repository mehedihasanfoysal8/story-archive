export const APP_CONFIG = {
  name: "Story Archive CMS",
  description: "A production-grade CMS for managing story archives on Google Drive",
  version: "1.0.0",
  rootFolderName: "Stories",
  defaultRootFolderId: "16LyBTRX6vJ4Lb3ITq8l9_bXl-cT8MRc5",
  defaultDriveLink: "https://drive.google.com/drive/folders/16LyBTRX6vJ4Lb3ITq8l9_bXl-cT8MRc5?usp=sharing",
  storyFileName: "stories.json",
  coverImageName: "cover.jpg",
  imagePrefix: "image",
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxUploadConcurrency: 3,
  retryAttempts: 3,
  retryDelay: 1000,
  pageSize: 50,
  searchDebounceMs: 300,
  autosaveDebounceMs: 2000,
} as const;

export const DRIVE_FIELDS = {
  file: "id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,webContentLink,thumbnailLink,iconLink,lastModifyingUser(displayName,emailAddress,photoLink,me)",
  fileList: "nextPageToken,files(id,name,mimeType,size,modifiedTime,createdTime,parents,webViewLink,webContentLink,thumbnailLink,iconLink,lastModifyingUser(displayName,emailAddress,photoLink,me))",
  about: "storageQuota,user",
} as const;

export const KEYBOARD_SHORTCUTS = {
  newStory: { key: "n", ctrl: true, shift: true, label: "New Story" },
  save: { key: "s", ctrl: true, label: "Save" },
  search: { key: "k", ctrl: true, label: "Search" },
  undo: { key: "z", ctrl: true, label: "Undo" },
  redo: { key: "y", ctrl: true, label: "Redo" },
  delete: { key: "Delete", label: "Delete Selected" },
  escape: { key: "Escape", label: "Close / Cancel" },
  toggleTheme: { key: "t", ctrl: true, shift: true, label: "Toggle Theme" },
} as const;

export const ROUTES = {
  home: "/",
  dashboard: "/dashboard",
  stories: "/stories",
  newStory: "/stories/new",
  story: (storiesFileId: string, storyId?: string) => 
    storyId ? `/stories/${storiesFileId}__${storyId}` : `/stories/${storiesFileId}`,
  storyPreview: (id: string) => `/stories/${id}/preview`,
  folders: "/folders",
  images: "/images",
  driveOverview: "/drive-overview",
  search: "/search",
  settings: "/settings",
  authCallback: "/auth/callback",
} as const;

export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const AGE_GROUPS = [
  "3-5",
  "6-8",
  "9-12",
  "13-17",
  "18+",
  "All Ages",
] as const;

export const LANGUAGES = [
  "Bengali",
  "English",
  "Arabic",
  "Hindi",
  "Urdu",
  "Persian",
  "French",
  "German",
  "Spanish",
  "Portuguese",
  "Chinese",
  "Japanese",
  "Russian",
] as const;
