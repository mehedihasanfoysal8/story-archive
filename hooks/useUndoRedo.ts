"use client";

import { useCallback, useReducer } from "react";

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

type UndoRedoAction<T> =
  | { type: "SET"; payload: T }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: T };

function undoRedoReducer<T>(
  state: UndoRedoState<T>,
  action: UndoRedoAction<T>
): UndoRedoState<T> {
  switch (action.type) {
    case "SET":
      return {
        past: [...state.past.slice(-49), state.present], // Keep last 50
        present: action.payload,
        future: [],
      };
    case "UNDO":
      if (state.past.length === 0) return state;
      return {
        past: state.past.slice(0, -1),
        present: state.past[state.past.length - 1],
        future: [state.present, ...state.future],
      };
    case "REDO":
      if (state.future.length === 0) return state;
      return {
        past: [...state.past, state.present],
        present: state.future[0],
        future: state.future.slice(1),
      };
    case "RESET":
      return { past: [], present: action.payload, future: [] };
    default:
      return state;
  }
}

export function useUndoRedo<T>(initialValue: T) {
  const [state, dispatch] = useReducer(undoRedoReducer<T>, {
    past: [],
    present: initialValue,
    future: [],
  });

  const set = useCallback((value: T) => {
    dispatch({ type: "SET", payload: value });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const reset = useCallback((value: T) => {
    dispatch({ type: "RESET", payload: value });
  }, []);

  return {
    value: state.present,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    historyCount: state.past.length,
  };
}
