"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateStory } from "@/hooks/useStories";
import { uploadFile } from "@/services/drive/files";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FolderPicker } from "@/components/common/FolderPicker";
import { ImageDropzone } from "../images/ImageDropzone";
import { BookOpen, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EMPTY_STORY, type Story } from "@/types/story";
import { generateNumericStoryId } from "@/utils/helpers";
import { AGE_GROUPS, LANGUAGES, APP_CONFIG, ROUTES } from "@/config/app";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// --- Interfaces ---

interface NamedFile {
  file: File;
  /** The user-given ID/name for this image, e.g. "story_0001_img_01" */
  imageId: string;
}

interface CreateStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- Zod Schema ---

const schema = z.object({
  bangla_story_title: z.string().min(1, "Title is required"),
  story_id: z.string().min(1, "Story ID is required"),
  targetFolderId: z.string().min(1, "Please select a target folder"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .refine((v) => v.endsWith(".json"), { message: "File name must end with .json" }),
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

type FormData = z.infer<typeof schema>;

// --- Component ---

export function CreateStoryModal({ open, onOpenChange }: CreateStoryModalProps) {
  const { rootFolderId } = useAuth();
  const router = useRouter();
  const createStoryMutation = useCreateStory();

  const [activeTab, setActiveTab] = useState("bangla");
  const [namedFiles, setNamedFiles] = useState<NamedFile[]>([]);
  const [storyId, setStoryId] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      bangla_story_title: "",
      story_id: "",
      targetFolderId: "",
      fileName: "",
      bangla_book_name: "",
      story_in_bangla: "",
      bangla_writer_name: "",
      bangla_publisher: "",
      origin_country: "",
      original_story_book_name: "",
      original_story_writer_name: "",
      original_language: "",
      original_story_in_that_language: "",
      source_tradition: "",
      atu_tale_type: "",
      moral_or_theme: "",
      target_age_group: "",
    },
  });

  // Auto-generate a unique story ID on open
  useEffect(() => {
    if (open) {
      const id = generateNumericStoryId();
      setStoryId(id);
      setValue("story_id", id);
    }
  }, [open, setValue]);

  const watchTitle = watch("bangla_story_title");
  const watchLang = watch("original_language");
  const watchAge = watch("target_age_group");
  const watchFolderId = watch("targetFolderId");
  const watchFileName = watch("fileName");

  // When story_id or title changes, auto-suggest a fileName
  useEffect(() => {
    if (storyId && !watchFileName) {
      setValue("fileName", `${storyId}.json`);
    }
  }, [storyId, watchFileName, setValue]);

  // Generate image IDs based on storyId & index
  const buildDefaultImageId = useCallback(
    (idx: number) => `${storyId}_img_${String(idx + 1).padStart(2, "0")}`,
    [storyId]
  );

  const handleImageAdd = (files: File[]) => {
    setNamedFiles((prev) => {
      const newItems: NamedFile[] = files.map((file, i) => ({
        file,
        imageId: buildDefaultImageId(prev.length + i),
      }));
      return [...prev, ...newItems];
    });
    toast.success(`${files.length} image(s) added`);
  };

  const updateImageId = (idx: number, newId: string) => {
    setNamedFiles((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, imageId: newId } : item))
    );
  };

  const removeImage = (idx: number) => {
    setNamedFiles((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // Re-assign default IDs for remaining items if they still have auto-generated names
      return next;
    });
  };

  // Ensure fileName always ends with .json
  const handleFileNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\.json$/, "").trim();
    setValue("fileName", val ? `${val}.json` : "");
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setNamedFiles([]);
    setStoryId("");
  };

  const onSubmit = async (data: any) => {
    if (!rootFolderId) return;

    try {
      const imageIds = namedFiles.map((nf) => nf.imageId);

      // Build story JSON
      const storyData: Story = {
        ...EMPTY_STORY,
        story_id: data.story_id,
        bangla_story_title: data.bangla_story_title,
        bangla_book_name: data.bangla_book_name || "",
        story_in_bangla: data.story_in_bangla || "",
        bangla_writer_name: data.bangla_writer_name || "",
        bangla_publisher: data.bangla_publisher || "",
        bangla_publication_year: data.bangla_publication_year || null,
        image_ids: imageIds,
        num_images: imageIds.length || null,
        origin_country: data.origin_country || "",
        original_story_book_name: data.original_story_book_name || "",
        original_story_writer_name: data.original_story_writer_name || "",
        original_language: data.original_language || "",
        original_story_in_that_language: data.original_story_in_that_language || "",
        original_publication_year: data.original_publication_year || null,
        source_tradition: data.source_tradition || "",
        atu_tale_type: data.atu_tale_type || "",
        moral_or_theme: data.moral_or_theme || "",
        target_age_group: data.target_age_group || "",
      };

      // Create story: direct placement in selected folder with given filename
      const result = await createStoryMutation.mutateAsync({
        rootFolderId,
        targetFolderId: data.targetFolderId,
        fileName: data.fileName,
        story: storyData,
      });

      // Upload images with user-given names
      if (namedFiles.length > 0) {
        for (const nf of namedFiles) {
          const ext = nf.file.name.split(".").pop()?.toLowerCase() || "jpg";
          const driveFileName = `${nf.imageId}.${ext}`;
          await uploadFile(driveFileName, nf.file, result.storyFolderId, nf.file.type);
        }

        // Update story.json with populated image_ids
        const { updateStory } = await import("@/services/stories");
        await updateStory(result.storyFileId, storyData);
      }

      handleClose();
      router.push(ROUTES.story(result.storyFileId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl flex flex-col p-0 overflow-hidden" style={{ maxHeight: "90vh" }}>
        <DialogHeader className="px-6 pt-5 pb-4 border-b flex-shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Create New Story
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 flex flex-col min-h-0"
          style={{ overflow: "hidden" }}
        >
          {/* === Location Bar (Sticky) === */}
          <div className="bg-muted/30 px-6 py-3 border-b flex-shrink-0 space-y-3">
            {/* Row 1: Folder Picker + File Name */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Target Folder *
                </Label>
                <FolderPicker
                  value={watchFolderId || ""}
                  onChange={(id) => setValue("targetFolderId", id)}
                />
                {errors.targetFolderId && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.targetFolderId.message}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  File Name * (.json)
                </Label>
                <div className="relative">
                  <Input
                    value={(watchFileName || "").replace(/\.json$/, "")}
                    onChange={handleFileNameChange}
                    placeholder={`${storyId}`}
                    className="pr-14 rounded-xl h-11 text-xs font-mono"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                    .json
                  </span>
                </div>
                {errors.fileName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.fileName.message}
                  </p>
                )}
              </div>
            </div>

            {/* Row 2: Story ID (auto-generated, readonly) */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Story ID:</Label>
              <code className="text-xs font-mono bg-muted/60 border px-2.5 py-1 rounded-lg text-foreground">
                {storyId}
              </code>
              <span className="text-[10px] text-muted-foreground">(auto-generated, unique)</span>
            </div>
          </div>

          {/* === Scrollable Tab Content === */}
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full rounded-none border-b bg-muted/20 sticky top-0 z-10">
                <TabsTrigger value="bangla" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Bangla
                </TabsTrigger>
                <TabsTrigger value="original" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Original
                </TabsTrigger>
                <TabsTrigger value="metadata" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Metadata
                </TabsTrigger>
                <TabsTrigger value="images" className="text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <ImageIcon className="w-3.5 h-3.5 mr-1" />
                  Images {namedFiles.length > 0 && `(${namedFiles.length})`}
                </TabsTrigger>
              </TabsList>

              {/* --- Tab 1: Bangla --- */}
              <TabsContent value="bangla" className="p-6 space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="bangla_story_title">Bangla Story Title *</Label>
                    <Input
                      id="bangla_story_title"
                      placeholder="e.g. ক্ষীরের পুতুল"
                      {...register("bangla_story_title")}
                      autoFocus
                    />
                    {errors.bangla_story_title && (
                      <p className="text-xs text-destructive">{errors.bangla_story_title.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Writer / Adapter</Label>
                    <Input placeholder="e.g. অবনীন্দ্রনাথ ঠাকুর" {...register("bangla_writer_name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Book / Anthology Name</Label>
                    <Input placeholder="e.g. ছোটদের সেরা গল্প" {...register("bangla_book_name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Publisher</Label>
                    <Input placeholder="e.g. আনন্দ পাবলিশার্স" {...register("bangla_publisher")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Publication Year</Label>
                    <Input type="number" placeholder="e.g. 1995" {...register("bangla_publication_year")} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Story in Bangla (Full Text)</Label>
                    <Textarea
                      placeholder="পুরো গল্পের বাংলা টেক্সট এখানে লিখুন..."
                      className="min-h-[160px] resize-y"
                      {...register("story_in_bangla")}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* --- Tab 2: Original --- */}
              <TabsContent value="original" className="p-6 space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Original Language</Label>
                    <Select
                      value={watchLang || "_none"}
                      onValueChange={(v) => setValue("original_language", v === "_none" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">— Select Language —</SelectItem>
                        {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Original Author</Label>
                    <Input placeholder="e.g. Hans Christian Andersen" {...register("original_story_writer_name")} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Original Book / Collection Title</Label>
                    <Input placeholder="e.g. Fairy Tales" {...register("original_story_book_name")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Original Publication Year</Label>
                    <Input type="number" placeholder="e.g. 1837" {...register("original_publication_year")} />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Story in Original Language</Label>
                    <Textarea
                      placeholder="Original language text..."
                      className="min-h-[160px] resize-y"
                      {...register("original_story_in_that_language")}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* --- Tab 3: Metadata --- */}
              <TabsContent value="metadata" className="p-6 space-y-4 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Origin Country</Label>
                    <Input placeholder="e.g. Bangladesh" {...register("origin_country")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Source Tradition / Category</Label>
                    <Input placeholder="e.g. Folk Tales" {...register("source_tradition")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>ATU Tale Type</Label>
                    <Input placeholder="e.g. ATU 300" {...register("atu_tale_type")} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target Age Group</Label>
                    <Select
                      value={watchAge || "_none"}
                      onValueChange={(v) => setValue("target_age_group", v === "_none" ? "" : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">— Select Age Group —</SelectItem>
                        {AGE_GROUPS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label>Moral / Central Theme</Label>
                    <Textarea placeholder="e.g. Honesty is the best policy..." {...register("moral_or_theme")} />
                  </div>
                </div>
              </TabsContent>

              {/* --- Tab 4: Images --- */}
              <TabsContent value="images" className="p-6 space-y-4 mt-0">
                <ImageDropzone onUpload={handleImageAdd} />

                {namedFiles.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Attached Images — Set Image ID for each
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      The Image ID becomes the Drive filename + entry in <code>image_ids</code> array.
                      e.g. <code className="bg-muted px-1 rounded">{storyId}_img_01</code> → saved as <code className="bg-muted px-1 rounded">{storyId}_img_01.jpg</code>
                    </p>
                    <div className="space-y-2">
                      {namedFiles.map((nf, idx) => {
                        const ext = nf.file.name.split(".").pop()?.toLowerCase() || "jpg";
                        return (
                          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                            <img
                              src={URL.createObjectURL(nf.file)}
                              alt={nf.file.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                  <Input
                                    value={nf.imageId}
                                    onChange={(e) => updateImageId(idx, e.target.value.trim())}
                                    className="h-8 text-xs font-mono pr-14"
                                    placeholder={buildDefaultImageId(idx)}
                                  />
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">.{ext}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeImage(idx)}
                                  className="w-8 h-8 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                Drive file: <code>{nf.imageId}.{ext}</code> · Original: {nf.file.name} ({(nf.file.size / 1024).toFixed(0)} KB)
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {namedFiles.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2">
                    Images are optional. If none uploaded, <code>image_ids</code> will be empty.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* === Footer === */}
          <DialogFooter className="px-6 py-4 border-t bg-card flex-shrink-0 flex items-center gap-2">
            <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl">
              {isSubmitting ? "Creating & Uploading..." : "Create Story"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
