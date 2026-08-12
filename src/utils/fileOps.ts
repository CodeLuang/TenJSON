import { Directory, File, Paths } from 'expo-file-system';
import { RecentFile } from '../store/filesStore';
import { stripExtension } from './format';

export const APP_DIR_NAME = 'tenjson';

export function appDir(): Directory {
  return new Directory(Paths.document, APP_DIR_NAME);
}

export function ensureAppDir(): Directory {
  const dir = appDir();
  dir.create({ idempotent: true, intermediates: true });
  return dir;
}

export async function readFileText(uri: string): Promise<string> {
  const f = new File(uri);
  return f.text();
}

export function readFileTextSync(uri: string): string {
  const f = new File(uri);
  return f.textSync();
}

export async function copyIntoAppStorage(uri: string, name: string): Promise<{ uri: string; name: string }> {
  const dir = ensureAppDir();
  const src = new File(uri);
  let targetName = name;
  let target: File | null = new File(dir, targetName);
  let counter = 1;
  while (target.exists) {
    targetName = `${stripExtension(name)} (${counter})${name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''}`;
    target = new File(dir, targetName);
    counter++;
  }
  src.copy(target);
  return { uri: target.uri, name: targetName };
}

export function createJsonFile(name: string, text: string): { uri: string; name: string } {
  const dir = ensureAppDir();
  let finalName = name.endsWith('.json') ? name : `${name}.json`;
  let target = new File(dir, finalName);
  let counter = 1;
  while (target.exists) {
    finalName = `${stripExtension(name)} (${counter}).json`;
    target = new File(dir, finalName);
    counter++;
  }
  target.create();
  target.write(text);
  return { uri: target.uri, name: finalName };
}

export function writeFile(uri: string, text: string): void {
  const f = new File(uri);
  f.write(text);
}

export function listAppFiles(): RecentFile[] {
  const dir = appDir();
  if (!dir.exists) return [];
  const out: RecentFile[] = [];
  for (const item of dir.list()) {
    if (item instanceof File && item.extension === '.json') {
      const info = item.info();
      out.push({
        name: item.name,
        uri: item.uri,
        size: info.size ?? 0,
        modifiedAt: info.modificationTime ?? 0,
      });
    }
  }
  out.sort((a, b) => b.modifiedAt - a.modifiedAt);
  return out;
}

export function fileExists(uri: string): boolean {
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}

export function deleteFile(uri: string): void {
  const f = new File(uri);
  if (f.exists) f.delete();
}
