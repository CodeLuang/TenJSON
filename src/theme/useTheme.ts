import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import { makeThemeVars, ACCENT_VALUE, AccentColor, ThemeVars } from './palette';

export interface ResolvedColors {
  background: string;
  card: string;
  surface: string;
  border: string;
  fg: string;
  sub: string;
  muted: string;
  accent: string;
  accentFg: string;
  key: string;
  str: string;
  num: string;
  lit: string;
  punct: string;
  danger: string;
  success: string;
  warning: string;
}

const COLOR_KEYS: (keyof ResolvedColors)[] = [
  'background',
  'card',
  'surface',
  'border',
  'fg',
  'sub',
  'muted',
  'accent',
  'accentFg',
  'key',
  'str',
  'num',
  'lit',
  'punct',
  'danger',
  'success',
  'warning',
];

const VAR_TO_KEY: Record<string, keyof ResolvedColors> = {
  '--background': 'background',
  '--card': 'card',
  '--surface': 'surface',
  '--border': 'border',
  '--fg': 'fg',
  '--sub': 'sub',
  '--muted': 'muted',
  '--accent': 'accent',
  '--accent-fg': 'accentFg',
  '--key': 'key',
  '--str': 'str',
  '--num': 'num',
  '--lit': 'lit',
  '--punct': 'punct',
  '--danger': 'danger',
  '--success': 'success',
  '--warning': 'warning',
};

export function resolveColors(v: ThemeVars): ResolvedColors {
  const out = {} as ResolvedColors;
  for (const key of COLOR_KEYS) out[key] = '#000000';
  for (const [varname, key] of Object.entries(VAR_TO_KEY)) {
    out[key] = v[varname] ?? out[key];
  }
  return out;
}

export function useTheme() {
  const appearance = useSettingsStore((s) => s.appearance);
  const accent = useSettingsStore((s) => s.accent);
  const systemScheme = useColorScheme();

  const isDark =
    appearance === 'system' ? systemScheme === 'dark' : appearance === 'dark';

  const vars = makeThemeVars(isDark, accent);
  const colors = resolveColors(vars);

  return {
    isDark,
    accent: accent as AccentColor,
    accentValue: ACCENT_VALUE[accent as AccentColor],
    vars,
    colors,
  };
}
