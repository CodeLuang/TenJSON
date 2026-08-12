/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        card: 'var(--card)',
        surface: 'var(--surface)',
        border: 'var(--border)',
        fg: 'var(--fg)',
        sub: 'var(--sub)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        'accent-soft': 'var(--accent-soft)',
        'accent-fg': 'var(--accent-fg)',
        key: 'var(--key)',
        str: 'var(--str)',
        num: 'var(--num)',
        lit: 'var(--lit)',
        punct: 'var(--punct)',
        danger: 'var(--danger)',
        success: 'var(--success)',
        warning: 'var(--warning)',
      },
      fontFamily: {
        mono: ['JetBrainsMono_400Regular'],
      },
    },
  },
  plugins: [],
};
