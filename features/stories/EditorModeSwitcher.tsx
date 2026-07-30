"use client";

import { FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorModeSwitcherProps {
  mode: "form" | "json";
  onChange: (mode: "form" | "json") => void;
}

export function EditorModeSwitcher({ mode, onChange }: EditorModeSwitcherProps) {
  return (
    <div className="inline-flex bg-muted p-1 rounded-xl border">
      <Button
        variant={mode === "form" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-lg gap-2 text-xs font-semibold px-3 py-1.5 h-8"
        onClick={() => onChange("form")}
      >
        <FileText className="w-3.5 h-3.5" />
        Form Editor
      </Button>
      <Button
        variant={mode === "json" ? "secondary" : "ghost"}
        size="sm"
        className="rounded-lg gap-2 text-xs font-semibold px-3 py-1.5 h-8"
        onClick={() => onChange("json")}
      >
        <FileJson className="w-3.5 h-3.5" />
        Raw JSON
      </Button>
    </div>
  );
}
