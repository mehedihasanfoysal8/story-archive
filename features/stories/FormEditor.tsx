"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StorySchema } from "@/utils/validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AGE_GROUPS, LANGUAGES } from "@/config/app";
import { useEffect, useRef } from "react";
import type { Story } from "@/types/story";

interface FormEditorProps {
  value: Story;
  onChange: (value: Story) => void;
}

export function FormEditor({ value, onChange }: FormEditorProps) {
  // Keep onChange stable via ref
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Story>({
    resolver: zodResolver(StorySchema) as any,
    defaultValues: value,
  });

  // Subscribe to form changes — fires only when values actually change
  useEffect(() => {
    const subscription = watch((data) => {
      onChangeRef.current(data as Story);
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const watchedValues = watch();

  return (
    <form className="space-y-6 max-w-4xl mx-auto pb-12">
      <Tabs defaultValue="bangla" className="w-full">
        <TabsList className="grid grid-cols-3 w-full rounded-none border-b bg-muted/20">
          <TabsTrigger value="bangla" className="text-sm py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Bangla
          </TabsTrigger>
          <TabsTrigger value="original" className="text-sm py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Original
          </TabsTrigger>
          <TabsTrigger value="metadata" className="text-sm py-3 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Metadata
          </TabsTrigger>
        </TabsList>

        <div className="min-h-[400px]">
          {/* Bangla Tab */}
          <TabsContent value="bangla" className="p-6 space-y-4 m-0 border rounded-b-2xl bg-card shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="fe_bangla_story_title">Bangla Story Title *</Label>
                <Input
                  id="fe_bangla_story_title"
                  placeholder="e.g. ক্ষীরের পুতুল"
                  {...register("bangla_story_title")}
                  className="text-lg bg-background"
                />
                {errors.bangla_story_title && (
                  <p className="text-xs text-destructive">{errors.bangla_story_title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_bangla_writer_name">Writer / Adapter</Label>
                <Input id="fe_bangla_writer_name" placeholder="e.g. অবনীন্দ্রনাথ ঠাকুর" className="bg-background" {...register("bangla_writer_name")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_bangla_book_name">Book / Anthology Name</Label>
                <Input id="fe_bangla_book_name" placeholder="e.g. ছোটদের সেরা গল্প" className="bg-background" {...register("bangla_book_name")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_bangla_publisher">Publisher</Label>
                <Input id="fe_bangla_publisher" placeholder="e.g. আনন্দ পাবলিশার্স" className="bg-background" {...register("bangla_publisher")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_bangla_publication_year">Publication Year</Label>
                <Input
                  id="fe_bangla_publication_year"
                  type="number"
                  placeholder="e.g. 1995"
                  className="bg-background"
                  value={watchedValues.bangla_publication_year ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue("bangla_publication_year", val ? Number(val) : null);
                  }}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="fe_story_in_bangla">Story in Bangla (Full Text)</Label>
                <Textarea
                  id="fe_story_in_bangla"
                  placeholder="পুরো গল্পের বাংলা টেক্সট এখানে লিখুন..."
                  className="min-h-[250px] resize-y bg-background text-base"
                  {...register("story_in_bangla")}
                />
              </div>
            </div>
          </TabsContent>

          {/* Original Tab */}
          <TabsContent value="original" className="p-6 space-y-4 m-0 border rounded-b-2xl bg-card shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="fe_original_language">Original Language</Label>
                <Select
                  value={watchedValues.original_language || "_none"}
                  onValueChange={(val) => setValue("original_language", val === "_none" ? "" : val)}
                >
                  <SelectTrigger id="fe_original_language" className="bg-background">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Select Language —</SelectItem>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_original_story_writer_name">Original Author</Label>
                <Input id="fe_original_story_writer_name" placeholder="e.g. Hans Christian Andersen" className="bg-background" {...register("original_story_writer_name")} />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="fe_original_story_book_name">Original Book / Collection Title</Label>
                <Input id="fe_original_story_book_name" placeholder="e.g. Fairy Tales" className="bg-background" {...register("original_story_book_name")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_original_publication_year">Original Publication Year</Label>
                <Input
                  id="fe_original_publication_year"
                  type="number"
                  placeholder="e.g. 1837"
                  className="bg-background"
                  value={watchedValues.original_publication_year ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue("original_publication_year", val ? Number(val) : null);
                  }}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="fe_original_story_in_that_language">Story in Original Language</Label>
                <Textarea
                  id="fe_original_story_in_that_language"
                  placeholder="Original language text..."
                  className="min-h-[250px] resize-y bg-background text-base"
                  {...register("original_story_in_that_language")}
                />
              </div>
            </div>
          </TabsContent>

          {/* Metadata Tab */}
          <TabsContent value="metadata" className="p-6 space-y-4 m-0 border rounded-b-2xl bg-card shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="fe_origin_country">Origin Country</Label>
                <Input id="fe_origin_country" placeholder="e.g. Bangladesh" className="bg-background" {...register("origin_country")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_source_tradition">Source Tradition / Category</Label>
                <Input id="fe_source_tradition" placeholder="e.g. Folk Tales" className="bg-background" {...register("source_tradition")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_atu_tale_type">ATU Tale Type</Label>
                <Input id="fe_atu_tale_type" placeholder="e.g. ATU 300" className="bg-background" {...register("atu_tale_type")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="fe_target_age_group">Target Age Group</Label>
                <Select
                  value={watchedValues.target_age_group || "_none"}
                  onValueChange={(val) => setValue("target_age_group", val === "_none" ? "" : val)}
                >
                  <SelectTrigger id="fe_target_age_group" className="bg-background">
                    <SelectValue placeholder="Select age group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— Select Age Group —</SelectItem>
                    {AGE_GROUPS.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="fe_moral_or_theme">Moral / Central Theme</Label>
                <Textarea id="fe_moral_or_theme" placeholder="e.g. Honesty is the best policy..." className="bg-background min-h-[100px]" {...register("moral_or_theme")} />
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </form>
  );
}
