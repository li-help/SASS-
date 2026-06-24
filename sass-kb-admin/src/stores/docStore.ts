import { create } from 'zustand';
import type { Editor } from '@tiptap/react';

interface DocState {
  editor: Editor | null;
  isSaving: boolean;
  lastSavedAt: Date | null;
  currentVersion: number;
  setEditor: (editor: Editor | null) => void;
  setIsSaving: (saving: boolean) => void;
  setLastSavedAt: (date: Date) => void;
  setCurrentVersion: (version: number) => void;
}

export const useDocStore = create<DocState>((set) => ({
  editor: null,
  isSaving: false,
  lastSavedAt: null,
  currentVersion: 1,
  setEditor: (editor) => set({ editor }),
  setIsSaving: (saving) => set({ isSaving: saving }),
  setLastSavedAt: (date) => set({ lastSavedAt: date }),
  setCurrentVersion: (version) => set({ currentVersion: version }),
}));
