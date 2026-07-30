"use client";

import { useRef } from "react";
import { Download, Upload, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadJSON, readFileAsText, parseJSON } from "@/utils/helpers";
import { validateStoryJSON } from "@/utils/validation";
import type { Story } from "@/types/story";
import toast from "react-hot-toast";

interface ImportExportMenuProps {
  onImport: (story: Story) => Promise<void>;
  storyData?: unknown;
  fileName?: string;
}

export function ImportExportMenu({
  onImport,
  storyData,
  fileName = "story",
}: ImportExportMenuProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    if (!storyData) {
      toast.error("No story data available to export");
      return;
    }
    downloadJSON(storyData, `${fileName}.json`);
    toast.success("JSON exported successfully");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await readFileAsText(file);
      const { data, error } = parseJSON(text);

      if (error || !data) {
        toast.error(`Invalid JSON: ${error}`);
        return;
      }

      const val = validateStoryJSON(data);
      if (!val.valid || !val.data) {
        toast.error(`Schema validation failed:\n${val.errors?.join("\n")}`);
        return;
      }

      await onImport(val.data as Story);
      toast.success("JSON imported successfully");
    } catch (err) {
      toast.error(`Import failed: ${(err as Error).message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="rounded-xl">
            <FileJson className="w-4 h-4 mr-2" />
            JSON Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4 mr-2 text-muted-foreground" />
            Import JSON
          </DropdownMenuItem>
          {!!storyData && (
            <DropdownMenuItem onClick={handleExport}>
              <Download className="w-4 h-4 mr-2 text-muted-foreground" />
              Export JSON
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
