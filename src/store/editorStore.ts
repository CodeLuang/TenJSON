import { create } from 'zustand';
import { ValidationResult } from '../utils/json';

export type EditorMode = 'tree' | 'raw';

export const HISTORY_LIMIT = 60;
const COALESCE_MS = 1200;

interface HistoryEntry {
  t: number;
  text: string;
}

interface EditorState {
  uri: string | null;
  name: string;
  text: string;
  savedText: string;
  dirty: boolean;
  history: HistoryEntry[];
  future: string[];
  mode: EditorMode;
  validation: ValidationResult | null;
  openDoc: (p: { uri: string | null; name: string; text: string }) => void;
  setText: (text: string) => void;
  setMode: (mode: EditorMode) => void;
  undo: () => void;
  redo: () => void;
  markSaved: (uri: string, text: string) => void;
  setValidation: (v: ValidationResult | null) => void;
  close: () => void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  uri: null,
  name: '',
  text: '',
  savedText: '',
  dirty: false,
  history: [],
  future: [],
  mode: 'tree',
  validation: null,

  openDoc: ({ uri, name, text }) =>
    set({
      uri,
      name,
      text,
      savedText: text,
      dirty: false,
      history: [],
      future: [],
      mode: 'tree',
      validation: null,
    }),

  setText: (text) => {
    const s = get();
    if (text === s.text) return;
    const now = Date.now();
    let history = s.history;
    const last = history[history.length - 1];
    if (last && now - last.t < COALESCE_MS) {
      history = [...history.slice(0, -1), { t: now, text: s.text }];
    } else {
      history = [...history, { t: now, text: s.text }];
      if (history.length > HISTORY_LIMIT) history = history.slice(-HISTORY_LIMIT);
    }
    set({
      text,
      history,
      future: [],
      dirty: text !== s.savedText,
    });
  },

  setMode: (mode) => set({ mode }),

  undo: () => {
    const s = get();
    if (s.history.length === 0) return;
    const last = s.history[s.history.length - 1];
    set({
      text: last.text,
      history: s.history.slice(0, -1),
      future: [s.text, ...s.future].slice(0, HISTORY_LIMIT),
      dirty: last.text !== s.savedText,
    });
  },

  redo: () => {
    const s = get();
    if (s.future.length === 0) return;
    const next = s.future[0];
    const now = Date.now();
    set({
      text: next,
      history: [...s.history, { t: now, text: s.text }].slice(-HISTORY_LIMIT),
      future: s.future.slice(1),
      dirty: next !== s.savedText,
    });
  },

  markSaved: (uri, text) =>
    set({ uri, savedText: text, text, dirty: false }),

  setValidation: (validation) => set({ validation }),

  close: () =>
    set({
      uri: null,
      name: '',
      text: '',
      savedText: '',
      dirty: false,
      history: [],
      future: [],
      mode: 'tree',
      validation: null,
    }),
}));
