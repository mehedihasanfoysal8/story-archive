"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateStory } from "@/hooks/useStories";
import { uploadFile } from "@/services/drive/files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FolderPicker } from "@/components/common/FolderPicker";
import { ImageDropzone } from "../images/ImageDropzone";
import { BookOpen, X, Image as ImageIcon, AlertCircle, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { EMPTY_STORY, type Story } from "@/types/story";
import { AGE_GROUPS, LANGUAGES, ROUTES } from "@/config/app";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { PageLayout } from "@/components/layout/PageLayout";

interface NamedFile {
  file: File;
  imageId: string;
}

const schema = z.object({
  story_id: z
    .string()
    .min(1, "Story ID is required")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, underscores and hyphens allowed"),
  targetFolderId: z.string().min(1, "Please select a target folder"),
  bangla_story_title: z.string().min(1, "Title is required"),
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

export function CreateStoryPage() {
  const { rootFolderId } = useAuth();
  const router = useRouter();
  const createStoryMutation = useCreateStory();

  const [activeTab, setActiveTab] = useState("bangla");
  const [namedFiles, setNamedFiles] = useState<NamedFile[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      story_id: "",
      bangla_story_title: "",
      targetFolderId: "",
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

  const watchLang = watch("original_language");
  const watchAge = watch("target_age_group");
  const watchFolderId = watch("targetFolderId");
  const watchStoryId = watch("story_id");

  const buildDefaultImageId = useCallback(
    (idx: number) => `${watchStoryId || "story"}_img_${String(idx + 1).padStart(2, "0")}`,
    [watchStoryId]
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
    setNamedFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClose = () => {
    router.back();
  };

  const onSubmit = async (data: FormData) => {
    if (!rootFolderId) return;

    try {
      const imageIds = namedFiles.map((nf) => nf.imageId);

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

      // Add to stories.json array in the selected folder
      const storiesFileId = await createStoryMutation.mutateAsync({
        folderId: data.targetFolderId,
        rootFolderId,
        story: storyData,
      });

      // Upload image files to the same folder
      if (namedFiles.length > 0) {
        for (const nf of namedFiles) {
          const ext = nf.file.name.split(".").pop()?.toLowerCase() || "jpg";
          const driveFileName = `${nf.imageId}.${ext}`;
          await uploadFile(driveFileName, nf.file, data.targetFolderId, nf.file.type);
        }
        toast.success(`${namedFiles.length} image(s) uploaded.`);
      }

      // Reset form, keep folder selection for convenience
      const savedFolderId = data.targetFolderId;
      reset();
      setValue("targetFolderId", savedFolderId);
      setNamedFiles([]);
      setActiveTab("bangla");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to create story");
    }
  };

  return (
    <PageLayout title="Create New Story">
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-2">
          <Button variant="ghost" onClick={handleClose} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2 text-xl font-bold">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Create New Story</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          {/* Top config: Story ID + Folder */}
          <div className="bg-muted/30 px-6 py-4 border-b space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              {/* Story ID — user provides */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Story ID *
                </Label>
                <Input
                  {...register("story_id")}
                  placeholder="e.g. story_0001 or bangla_lalkambal"
                  className="font-mono rounded-xl text-sm bg-background"
                />
                {errors.story_id && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.story_id.message}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground">
                  Only letters, numbers, underscores, hyphens. Must be unique.
                </p>
              </div>

              {/* Target Folder */}
              <div className="space-y-1.5">
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
                <p className="text-[10px] text-muted-foreground">
                  Story will be added to <code>stories.json</code> in this folder.
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-4 w-full rounded-none border-b bg-muted/20">
                <TabsTrigger value="bangla" className="text-sm py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Bangla
                </TabsTrigger>
                <TabsTrigger value="original" className="text-sm py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Original
                </TabsTrigger>
                <TabsTrigger value="metadata" className="text-sm py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  Metadata
                </TabsTrigger>
                <TabsTrigger value="images" className="text-sm py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Images {namedFiles.length > 0 && `(${namedFiles.length})`}
                </TabsTrigger>
              </TabsList>

              <div className="min-h-[400px]">
                {/* Bangla Tab */}
                <TabsContent value="bangla" className="p-6 space-y-4 m-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5 col-span-2">
                      <Label htmlFor="bangla_story_title">Bangla Story Title *</Label>
                      <Input
                        id="bangla_story_title"
                        placeholder="e.g. ক্ষীরের পুতুল"
                        {...register("bangla_story_title")}
                        className="text-lg bg-background"
                        autoFocus
                      />
                      {errors.bangla_story_title && (
                        <p className="text-xs text-destructive">{errors.bangla_story_title.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>Writer / Adapter</Label>
                      <Input placeholder="e.g. অবনীন্দ্রনাথ ঠাকুর" className="bg-background" {...register("bangla_writer_name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Book / Anthology Name</Label>
                      <Input placeholder="e.g. ছোটদের সেরা গল্প" className="bg-background" {...register("bangla_book_name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Publisher</Label>
                      <Input placeholder="e.g. আনন্দ পাবলিশার্স" className="bg-background" {...register("bangla_publisher")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Publication Year</Label>
                      <Input type="number" placeholder="e.g. 1995" className="bg-background" {...register("bangla_publication_year")} />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Story in Bangla (Full Text)</Label>
                      <Textarea
                        placeholder="পুরো গল্পের বাংলা টেক্সট এখানে লিখুন..."
                        className="min-h-[250px] resize-y bg-background text-base"
                        {...register("story_in_bangla")}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Original Tab */}
                <TabsContent value="original" className="p-6 space-y-4 m-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label>Original Language</Label>
                      <Select
                        value={watchLang || "_none"}
                        onValueChange={(v) => setValue("original_language", v === "_none" ? "" : v)}
                      >
                        <SelectTrigger className="bg-background">
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
                      <Input placeholder="e.g. Hans Christian Andersen" className="bg-background" {...register("original_story_writer_name")} />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Original Book / Collection Title</Label>
                      <Input placeholder="e.g. Fairy Tales" className="bg-background" {...register("original_story_book_name")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Original Publication Year</Label>
                      <Input type="number" placeholder="e.g. 1837" className="bg-background" {...register("original_publication_year")} />
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label>Story in Original Language</Label>
                      <Textarea
                        placeholder="Original language text..."
                        className="min-h-[250px] resize-y bg-background text-base"
                        {...register("original_story_in_that_language")}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Metadata Tab */}
                <TabsContent value="metadata" className="p-6 space-y-4 m-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label>Origin Country</Label>
                      <Input placeholder="e.g. Bangladesh" className="bg-background" {...register("origin_country")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Source Tradition / Category</Label>
                      <Input placeholder="e.g. Folk Tales" className="bg-background" {...register("source_tradition")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>ATU Tale Type</Label>
                      <Input placeholder="e.g. ATU 300" className="bg-background" {...register("atu_tale_type")} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Target Age Group</Label>
                      <Select
                        value={watchAge || "_none"}
                        onValueChange={(v) => setValue("target_age_group", v === "_none" ? "" : v)}
                      >
                        <SelectTrigger className="bg-background">
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
                      <Textarea placeholder="e.g. Honesty is the best policy..." className="bg-background min-h-[100px]" {...register("moral_or_theme")} />
                    </div>
                  </div>
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="p-6 space-y-4 m-0">
                  <ImageDropzone onUpload={handleImageAdd} />
                  {namedFiles.length > 0 && (
                    <div className="space-y-3 mt-6">
                      <Label className="text-sm font-semibold uppercase text-muted-foreground">
                        Attached Images — Set Image ID for each
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        The Image ID will be saved in <code>image_ids</code> and the file will be uploaded to the same folder as <code>stories.json</code>.
                      </p>
                      <div className="space-y-3">
                        {namedFiles.map((nf, idx) => {
                          const ext = nf.file.name.split(".").pop()?.toLowerCase() || "jpg";
                          return (
                            <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border bg-background">
                              <img
                                src={URL.createObjectURL(nf.file)}
                                alt={nf.file.name}
                                className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border"
                              />
                              <div className="flex-1 w-full space-y-2">
                                <div className="flex items-center gap-2">
                                  <div className="relative flex-1">
                                    <Input
                                      value={nf.imageId}
                                      onChange={(e) => updateImageId(idx, e.target.value.trim())}
                                      className="h-10 text-sm font-mono pr-14"
                                      placeholder={buildDefaultImageId(idx)}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">.{ext}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-destructive hover:bg-destructive/10 transition-colors flex-shrink-0"
                                  >
                                    <X className="w-5 h-5" />
                                  </button>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  Original: {nf.file.name} ({(nf.file.size / 1024).toFixed(0)} KB)
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-end gap-3 mt-auto">
            <Button type="button" variant="outline" onClick={handleClose} className="rounded-xl px-6">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl px-8 shadow-md">
              {isSubmitting ? "Creating..." : "Create Story"}
            </Button>
          </div>
        </form>
      </div>
    </PageLayout>
  );
}
