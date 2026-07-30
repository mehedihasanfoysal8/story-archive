"use client";

import { useEffect } from "react";

type ShortcutHandler = (e: KeyboardEvent) => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  preventDefault?: boolean;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault !== false) e.preventDefault();
          shortcut.handler(e);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

export function useGlobalShortcuts(handlers: {
  onSearch?: () => void;
  onNewStory?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onEscape?: () => void;
}) {
  useKeyboardShortcuts([
    ...(handlers.onSearch ? [{ key: "k", ctrl: true, handler: handlers.onSearch }] : []),
    ...(handlers.onNewStory ? [{ key: "n", ctrl: true, shift: true, handler: handlers.onNewStory }] : []),
    ...(handlers.onSave ? [{ key: "s", ctrl: true, handler: handlers.onSave }] : []),
    ...(handlers.onUndo ? [{ key: "z", ctrl: true, handler: handlers.onUndo }] : []),
    ...(handlers.onRedo ? [{ key: "y", ctrl: true, handler: handlers.onRedo }] : []),
    ...(handlers.onEscape ? [{ key: "Escape", handler: handlers.onEscape, preventDefault: false }] : []),
  ]);
}
