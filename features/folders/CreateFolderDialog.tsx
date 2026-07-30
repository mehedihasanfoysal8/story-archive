"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FolderSchema, type FolderFormData } from "@/utils/validation";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
  title?: string;
  initialName?: string;
  placeholder?: string;
  submitLabel?: string;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onSubmit,
  title = "Create Folder",
  initialName = "",
  placeholder = "Enter name...",
  submitLabel = "Save",
}: CreateFolderDialogProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FolderFormData>({
    resolver: zodResolver(FolderSchema),
    defaultValues: { name: initialName },
  });

  useEffect(() => {
    if (open) {
      setValue("name", initialName);
    } else {
      reset();
    }
  }, [open, initialName, setValue, reset]);

  const onFormSubmit = async (data: FolderFormData) => {
    await onSubmit(data.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="folder-name">Name</Label>
            <Input
              id="folder-name"
              placeholder={placeholder}
              {...register("name")}
              autoFocus
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
