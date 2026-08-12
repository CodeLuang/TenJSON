import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandStorage } from './storage';

export interface RecentFile {
  name: string;
  uri: string;
  size: number;
  modifiedAt: number;
}

interface FilesState {
  recent: RecentFile[];
  upsertRecent: (f: RecentFile) => void;
  removeRecent: (uri: string) => void;
}

export const useFilesStore = create<FilesState>()(
  persist(
    (set) => ({
      recent: [],
      upsertRecent: (f) =>
        set((s) => ({
          recent: [f, ...s.recent.filter((r) => r.uri !== f.uri)].slice(0, 30),
        })),
      removeRecent: (uri) =>
        set((s) => ({ recent: s.recent.filter((r) => r.uri !== uri) })),
    }),
    {
      name: 'recent-files',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
