import { StateStorage } from 'zustand/middleware';
import { SQLiteStorage } from 'expo-sqlite/kv-store';

/**
 * Primary backend: react-native-mmkv v4 (nitro) — fast sync storage,
 * only available in development builds (not Expo Go).
 */
interface MMKVLike {
  getString?: (key: string) => string | null | undefined;
  set?: (key: string, value: string) => void;
  remove?: (key: string) => boolean;
}

/**
 * Fallback backend: expo-sqlite/kv-store — bundled in Expo Go,
 * exposes the same sync read/write semantics.
 */
interface SQLiteKVLike {
  getItemSync?: (key: string) => string | null;
  setItemSync?: (key: string, value: string) => void;
  removeItemSync?: (key: string) => boolean;
}

let backend: (MMKVLike & SQLiteKVLike) | null = null;
let initialized = false;

function getBackend(): (MMKVLike & SQLiteKVLike) | null {
  if (initialized) return backend;
  initialized = true;

  try {
    const { createMMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv');
    const kv = createMMKV({ id: 'tenjson-storage' });
    kv.set('__tenjson_probe__', '1');
    const ok = kv.getString('__tenjson_probe__') === '1';
    kv.remove('__tenjson_probe__');
    if (ok) {
      backend = kv as MMKVLike & SQLiteKVLike;
      return backend;
    }
    console.warn('[TenJSON] MMKV probe failed, falling back to expo-sqlite KV store.');
  } catch (e) {
    console.warn(
      '[TenJSON] MMKV unavailable (needs a development build), falling back to expo-sqlite KV store:',
      e instanceof Error ? e.message : String(e)
    );
  }

  try {
    backend = new SQLiteStorage('tenjson-storage') as unknown as MMKVLike & SQLiteKVLike;
  } catch (e) {
    console.warn('[TenJSON] No persistent storage available:', e instanceof Error ? e.message : String(e));
    backend = null;
  }
  return backend;
}

export const zustandStorage: StateStorage = {
  getItem: (name) => {
    const b = getBackend();
    if (!b) return null;
    if (b.getString) return b.getString(name) ?? null;
    return b.getItemSync!(name);
  },
  setItem: (name, value) => {
    const b = getBackend();
    if (!b) return;
    if (b.set) {
      b.set(name, value);
      return;
    }
    b.setItemSync!(name, value);
  },
  removeItem: (name) => {
    const b = getBackend();
    if (!b) return;
    if (b.remove) {
      b.remove(name);
      return;
    }
    b.removeItemSync!(name);
  },
};
