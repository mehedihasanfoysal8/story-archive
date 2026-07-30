"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StorySchema, type StorySchemaType } from "@/utils/validation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { AGE_GROUPS, LANGUAGES } from "@/config/app";
import { useEffect } from "react";

import type { Story } from "@/types/story";

interface FormEditorProps {
  value: Story;
  onChange: (value: Story) => void;
}

export function FormEditor({ value, onChange }: FormEditorProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<Story>({
    resolver: zodResolver(StorySchema) as any,
    defaultValues: value,
  });

  // Watch all fields and trigger updates
  const watchedValues = watch();

  useEffect(() => {
    // Notify parent of state changes (for undo/redo, autosave)
    onChange(watchedValues as Story);
  }, [watchedValues]);

  return (
    <form className="space-y-6 max-w-4xl mx-auto pb-12">
      <Accordion type="multiple" defaultValue={["bangla", "original", "classification"]}>
        {/* Bangla Details Accordion */}
        <AccordionItem value="bangla" className="border rounded-2xl bg-card p-4 shadow-sm mb-4">
          <AccordionTrigger className="hover:no-underline font-bold text-base px-2">
            Bangla Story Metadata
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="bangla_story_title">Bangla Story Title *</Label>
                <Input
                  id="bangla_story_title"
                  {...register("bangla_story_title")}
                />
                {errors.bangla_story_title && (
                  <p className="text-xs text-destructive">{errors.bangla_story_title.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bangla_writer_name">Bangla Writer Name</Label>
                <Input id="bangla_writer_name" {...register("bangla_writer_name")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bangla_book_name">Bangla Book Name</Label>
                <Input id="bangla_book_name" {...register("bangla_book_name")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bangla_publisher">Bangla Publisher</Label>
                <Input id="bangla_publisher" {...register("bangla_publisher")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bangla_publication_year">Bangla Publication Year</Label>
                <Input
                  id="bangla_publication_year"
                  type="number"
                  placeholder="e.g. 1995"
                  value={watchedValues.bangla_publication_year ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue("bangla_publication_year", val ? Number(val) : null);
                  }}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="story_in_bangla">Story in Bangla</Label>
                <Textarea
                  id="story_in_bangla"
                  className="min-h-[160px]"
                  {...register("story_in_bangla")}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Original Language details */}
        <AccordionItem value="original" className="border rounded-2xl bg-card p-4 shadow-sm mb-4">
          <AccordionTrigger className="hover:no-underline font-bold text-base px-2">
            Original Translation Metadata
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="original_language">Original Language</Label>
                <Select
                  value={watchedValues.original_language || "ALL"}
                  onValueChange={(val) => setValue("original_language", val === "ALL" ? "" : val)}
                >
                  <SelectTrigger id="original_language">
                    <SelectValue placeholder="Select Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Select Language</SelectItem>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="original_story_writer_name">Original Writer Name</Label>
                <Input id="original_story_writer_name" {...register("original_story_writer_name")} />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="original_story_book_name">Original Book Title</Label>
                <Input id="original_story_book_name" {...register("original_story_book_name")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="original_publication_year">Original Publication Year</Label>
                <Input
                  id="original_publication_year"
                  type="number"
                  value={watchedValues.original_publication_year ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setValue("original_publication_year", val ? Number(val) : null);
                  }}
                />
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="original_story_in_that_language">Story in Original Language</Label>
                <Textarea
                  id="original_story_in_that_language"
                  className="min-h-[160px]"
                  {...register("original_story_in_that_language")}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Classification Details */}
        <AccordionItem value="classification" className="border rounded-2xl bg-card p-4 shadow-sm mb-4">
          <AccordionTrigger className="hover:no-underline font-bold text-base px-2">
            Classification & Folkloric Metadata
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-4 px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="origin_country">Origin Country</Label>
                <Input id="origin_country" {...register("origin_country")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="source_tradition">Source Tradition / Folklore Category</Label>
                <Input id="source_tradition" {...register("source_tradition")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="atu_tale_type">ATU (Aarne-Thompson-Uther) Classification Type</Label>
                <Input id="atu_tale_type" placeholder="e.g. ATU 300" {...register("atu_tale_type")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="target_age_group">Target Age Group</Label>
                <Select
                  value={watchedValues.target_age_group || "ALL"}
                  onValueChange={(val) => setValue("target_age_group", val === "ALL" ? "" : val)}
                >
                  <SelectTrigger id="target_age_group">
                    <SelectValue placeholder="Select Age Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Select Age Group</SelectItem>
                    {AGE_GROUPS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="moral_or_theme">Moral Lesson or Aesthetic Theme</Label>
                <Textarea id="moral_or_theme" {...register("moral_or_theme")} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </form>
  );
}
