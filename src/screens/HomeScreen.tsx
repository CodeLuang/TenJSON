import { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useFilesStore, RecentFile } from '../store/filesStore';
import { useEditorStore } from '../store/editorStore';
import { useTheme } from '../theme/useTheme';
import { ConfirmSheet } from '../components/Modals';
import { toast } from '../components/Toast';
import {
  copyIntoAppStorage,
  deleteFile,
  fileExists,
  listAppFiles,
  readFileText,
} from '../utils/fileOps';
import { formatDate, formatSize } from '../utils/format';
import { validateJson } from '../utils/json';

const TEMPLATES: Record<string, string> = {
  object: '{\n  \n}',
  array: '[\n  \n]',
};

type Nav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors, accentValue } = useTheme();
  const insets = useSafeAreaInsets();
  const recent = useFilesStore((s) => s.recent);
  const [fabOpen, setFabOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<RecentFile | null>(null);

  useFocusEffect(
    useCallback(() => {
      const files = listAppFiles();
      const merged = new Map<string, RecentFile>();
      for (const f of useFilesStore.getState().recent) merged.set(f.uri, f);
      for (const f of files) merged.set(f.uri, f);
      const list = [...merged.values()]
        .filter((f) => fileExists(f.uri))
        .sort((a, b) => b.modifiedAt - a.modifiedAt)
        .slice(0, 30);
      useFilesStore.setState({ recent: list });
    }, [])
  );

  const openRecent = async (f: RecentFile) => {
    if (!fileExists(f.uri)) {
      useFilesStore.getState().removeRecent(f.uri);
      toast.show('File no longer exists', 'error');
      return;
    }
    let text: string;
    try {
      text = await readFileText(f.uri);
    } catch {
      toast.show('Failed to read file', 'error');
      return;
    }
    const valid = text.trim().length === 0 || validateJson(text).valid;
    useEditorStore.getState().openDoc({ uri: f.uri, name: f.name, text });
    useEditorStore.getState().setMode(valid ? 'tree' : 'raw');
    navigation.navigate('Editor');
  };

  const browse = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain'],
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      let text: string;
      try {
        text = await readFileText(asset.uri);
      } catch {
        toast.show('Could not read that file', 'error');
        return;
      }
      if (text.trim().length === 0) {
        toast.show('File is empty', 'error');
        return;
      }
      const { uri, name } = await copyIntoAppStorage(asset.uri, asset.name);
      useFilesStore.getState().upsertRecent({
        name,
        uri,
        size: text.length,
        modifiedAt: Date.now(),
      });
      const valid = validateJson(text).valid;
      useEditorStore.getState().openDoc({ uri, name, text });
      useEditorStore.getState().setMode(valid ? 'tree' : 'raw');
      navigation.navigate('Editor');
    } catch {
      toast.show('Could not open file picker', 'error');
    }
  };

  const newFile = (template: 'object' | 'array') => {
    setFabOpen(false);
    useEditorStore.getState().openDoc({
      uri: null,
      name: 'untitled.json',
      text: TEMPLATES[template],
    });
    navigation.navigate('Editor');
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteFile(pendingDelete.uri);
    useFilesStore.getState().removeRecent(pendingDelete.uri);
    toast.show('File deleted', 'success');
    setPendingDelete(null);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="flex-row items-center justify-between px-5 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <View className="flex-row items-center gap-2">
          <View
            className="h-8 w-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: accentValue }}
          >
            <Text className="text-[15px] font-bold text-white">{'{ }'}</Text>
          </View>
          <Text className="text-[22px] font-bold" style={{ color: colors.fg }}>
            TenJSON
          </Text>
        </View>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          className="h-10 w-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="settings-outline" size={20} color={colors.sub} />
        </Pressable>
      </View>

      <Text
        className="px-5 text-[13px] font-medium"
        style={{ color: colors.muted }}
      >
        Recent Files
      </Text>

      {recent.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-3 px-10">
          <Ionicons name="folder-open-outline" size={44} color={colors.muted} />
          <Text className="text-center text-[15px] font-medium" style={{ color: colors.sub }}>
            No files yet
          </Text>
          <Text className="text-center text-[13px] leading-5" style={{ color: colors.muted }}>
            Browse your device storage or create a new JSON file to get started.
          </Text>
          <Pressable
            onPress={browse}
            className="mt-2 flex-row items-center gap-2 rounded-xl px-5 py-3"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="folder-outline" size={18} color={colors.accent} />
            <Text className="text-[15px] font-semibold" style={{ color: colors.fg }}>
              Browse files
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={recent}
          keyExtractor={(f) => f.uri}
          className="mt-1 flex-1"
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openRecent(item)}
              onLongPress={() => setPendingDelete(item)}
              className="mx-1 mb-1 flex-row items-center gap-3 rounded-xl px-3 py-3"
              style={({ pressed }) => [
                { backgroundColor: pressed ? colors.surface : 'transparent' },
              ]}
            >
              <View
                className="h-9 w-9 items-center justify-center rounded-lg"
                style={{ backgroundColor: colors.accent + '1A' }}
              >
                <Ionicons name="documents-outline" size={18} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text
                  className="text-[15px] font-medium"
                  style={{ color: colors.fg, fontFamily: 'JetBrainsMono_400Regular' }}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text className="mt-0.5 text-[12px]" style={{ color: colors.muted }}>
                  {formatSize(item.size)} · {formatDate(item.modifiedAt)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.muted} />
            </Pressable>
          )}
        />
      )}

      <Pressable
        onPress={browse}
        className="mx-5 flex-row items-center justify-center gap-2 rounded-2xl py-3.5"
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: 'dashed',
          marginBottom: insets.bottom + 12,
        }}
      >
        <Ionicons name="folder-open-outline" size={18} color={colors.accent} />
        <Text className="text-[15px] font-semibold" style={{ color: colors.fg }}>
          Browse device storage
        </Text>
      </Pressable>

      {fabOpen && (
        <Pressable
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
          onPress={() => setFabOpen(false)}
        />
      )}
      <View className="absolute bottom-6 right-5 items-end">
        {fabOpen && (
          <View className="mb-3 w-56 rounded-2xl p-1.5 shadow-lg" style={{ backgroundColor: colors.card }}>
            <Pressable
              onPress={() => newFile('object')}
              className="flex-row items-center gap-3 rounded-xl px-3 py-3"
              style={({ pressed }) => [{ backgroundColor: pressed ? colors.surface : 'transparent' }]}
            >
              <Ionicons name="document-text-outline" size={18} color={colors.accent} />
              <Text className="text-[14px] font-medium" style={{ color: colors.fg }}>
                New JSON object {'{}'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => newFile('array')}
              className="flex-row items-center gap-3 rounded-xl px-3 py-3"
              style={({ pressed }) => [{ backgroundColor: pressed ? colors.surface : 'transparent' }]}
            >
              <Ionicons name="list-outline" size={18} color={colors.accent} />
              <Text className="text-[14px] font-medium" style={{ color: colors.fg }}>
                New JSON array {'[]'}
              </Text>
            </Pressable>
          </View>
        )}
        <Pressable
          onPress={() => setFabOpen((v) => !v)}
          className="h-14 w-14 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: colors.accent }}
        >
          <Ionicons
            name={fabOpen ? 'close' : 'add'}
            size={28}
            color={colors.accentFg}
          />
        </Pressable>
      </View>

      <ConfirmSheet
        visible={pendingDelete !== null}
        title="Delete file?"
        message={`"${pendingDelete?.name}" will be permanently removed from this device.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
        colors={colors}
      />
    </View>
  );
}
