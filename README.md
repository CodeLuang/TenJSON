# TenJSON - JSON Viewer Mobile

A JSON Tool app for reading, creating, and editing JSON files on Android.

<p align="center">
  <picture>
    <img src="https://res.cloudinary.com/gxqkxg67/image/upload/v1786593505/1.jpg" width=250 />
  </picture>
  <picture>
    <img src="https://res.cloudinary.com/gxqkxg67/image/upload/v1786593581/2.jpg" width=250 />
  </picture>
  <picture>
    <img src="https://res.cloudinary.com/gxqkxg67/image/upload/v1786593599/3.jpg" width=250 />
  </picture>
</p>

## ✨ Features

- **Open JSON** - Browse device storage using the system document picker (SAF). No storage permission needed! Files are imported into the app and displayed as a collapsible **Tree View** with VS Code-style indent guides.
- **New File** - Quickly create new JSON files using the FAB (Floating Action Button) with `{}` object or `[]` array templates.
- **Edit** - Edit JSON using either the Tree View or Raw Text Editor. The editor features **real-time syntax highlighting** (custom tokenizer) and **red error underlines** with exact line:column indicators from a built-in JSON validator.
- **Undo / Redo** - Supports coalesced history with up to 60 steps.
- **Appearance** - Switch between **Light**, **Dark**, or **System** themes instantly via runtime CSS variables.
- **Accent Colors** - Choose from Blue, Purple, Green, or Orange accents applied to buttons, toggles, icons, and highlights.
- **Editor Settings** - Toggle word wrap and adjust font size (12–20).
- **Edge Cases** - Files larger than 1.5 MB automatically fall back to plain text mode (no heavy highlighting). Files over 10 MB force Raw Mode. Invalid JSON is blocked from saving with a toast notification and jump-to-error functionality.

## 🛠️ Tech Stack

| Concern | Choice |
| :--- | :--- |
| **Framework** | Expo SDK 57 (React Native 0.86, New Architecture) |
| **State Management** | Zustand v5 (persisted via MMKV) |
| **Local Storage** | react-native-mmkv v4 (`createMMKV`, nitro) with automatic `expo-sqlite/kv-store` fallback |
| **File Handling** | `expo-file-system` (new `File`/`Directory` API), `expo-document-picker` |
| **Styling** | NativeWind v4 (Tailwind) with runtime CSS-variable theming (`vars()`) |
| **Syntax Highlighting** | Custom line-based JSON tokenizer + FlatList-virtualized tree (no heavy third-party libs) |
| **Font** | JetBrains Mono |

## 📦 Setup

```sh
# Install dependencies
npm install

# Start the development server
npx expo start
