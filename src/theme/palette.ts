import { vars } from 'nativewind';

export type AppearanceMode = 'light' | 'dark' | 'system';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange';

export interface Accent {
  name: AccentColor;
  label: string;
  value: string;
}

export const ACCENTS: Accent[] = [
  { name: 'blue', label: 'Blue', value: '#3B82F6' },
  { name: 'purple', label: 'Purple', value: '#8B5CF6' },
  { name: 'green', label: 'Green', value: '#10B981' },
  { name: 'orange', label: 'Orange', value: '#F97316' },
];

export const ACCENT_VALUE: Record<AccentColor, string> = {
  blue: '#3B82F6',
  purple: '#8B5CF6',
  green: '#10B981',
  orange: '#F97316',
};

export type ThemeVars = Record<string, string>;

function buildVars(isDark: boolean, accent: string): ThemeVars {
  return {
    '--background': isDark ? '#0D1117' : '#FFFFFF',
    '--card': isDark ? '#161B22' : '#F6F8FA',
    '--surface': isDark ? '#1F242E' : '#ECEEF1',
    '--border': isDark ? '#30363D' : '#E4E7EB',
    '--fg': isDark ? '#E6EDF3' : '#1F2328',
    '--sub': isDark ? '#9DA7B3' : '#57606A',
    '--muted': isDark ? '#6E7681' : '#8C959F',
    '--accent': accent,
    '--accent-soft': isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
    '--accent-fg': '#FFFFFF',
    '--key': isDark ? '#9CDCFE' : '#0451A5',
    '--str': isDark ? '#CE9178' : '#A31515',
    '--num': isDark ? '#B5CEA8' : '#098658',
    '--lit': isDark ? '#569CD6' : '#0000FF',
    '--punct': isDark ? '#D4D4D4' : '#000000',
    '--danger': isDark ? '#F85149' : '#D1242F',
    '--success': isDark ? '#3FB950' : '#1A7F37',
    '--warning': isDark ? '#D29922' : '#9A6700',
  };
}

export function makeThemeVars(isDark: boolean, accent: AccentColor): ThemeVars {
  return buildVars(isDark, ACCENT_VALUE[accent]);
}

export function styleVars(v: ThemeVars) {
  return vars(v);
}
