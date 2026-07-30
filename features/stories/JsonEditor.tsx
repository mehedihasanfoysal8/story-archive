"use client";

import MonacoEditor from "@monaco-editor/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import type { Story } from "@/types/story";

interface JsonEditorProps {
  value: Story;
  onChange: (value: Story) => void;
}

export function JsonEditor({ value, onChange }: JsonEditorProps) {
  const { theme } = useTheme();
  const [code, setCode] = useState("");

  // Sync string code when value object changes
  useEffect(() => {
    try {
      const stringified = JSON.stringify(value, null, 2);
      setCode((current) => {
        // Prevent infinite loops if they represent identical object structures
        try {
          if (JSON.stringify(JSON.parse(current)) === JSON.stringify(value)) {
            return current;
          }
        } catch {}
        return stringified;
      });
    } catch (e) {
      console.error("Stringify failed in JSON editor:", e);
    }
  }, [value]);

  const handleEditorChange = (val: string | undefined) => {
    if (!val) return;
    setCode(val);

    try {
      const parsed = JSON.parse(val);
      onChange(parsed);
    } catch {
      // Don't propagate syntax errors up to form immediately to let user finish typing
    }
  };

  return (
    <div className="border rounded-2xl overflow-hidden h-[600px] shadow-inner bg-black">
      <MonacoEditor
        height="100%"
        language="json"
        value={code}
        onChange={handleEditorChange}
        theme={theme === "dark" ? "vs-dark" : "light"}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
        }}
      />
    </div>
  );
}
