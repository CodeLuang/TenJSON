import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AccentColor, AppearanceMode } from '../theme/palette';
import { zustandStorage } from './storage';

interface SettingsState {
  appearance: AppearanceMode;
  accent: AccentColor;
  wordWrap: boolean;
  fontSize: number;
  setAppearance: (a: AppearanceMode) => void;
  setAccent: (a: AccentColor) => void;
  setWordWrap: (w: boolean) => void;
  setFontSize: (s: number) => void;
}

export const MIN_FONT = 12;
export const MAX_FONT = 20;

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      appearance: 'system',
      accent: 'blue',
      wordWrap: true,
      fontSize: 14,
      setAppearance: (appearance) => set({ appearance }),
      setAccent: (accent) => set({ accent }),
      setWordWrap: (wordWrap) => set({ wordWrap }),
      setFontSize: (fontSize) =>
        set({ fontSize: Math.min(MAX_FONT, Math.max(MIN_FONT, fontSize)) }),
    }),
    {
      name: 'settings',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
