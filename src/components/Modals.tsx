import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ResolvedColors } from '../theme/useTheme';
import { FlatItem } from './JsonTree';
import { toast } from './Toast';

export interface SheetItem {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  danger?: boolean;
  disabled?: boolean;
  checked?: boolean;
  onPress?: () => void;
}

interface SheetProps {
  visible: boolean;
  title?: string;
  items: SheetItem[];
  onClose: () => void;
  colors: ResolvedColors;
}

export function ActionSheet({ visible, title, items, onClose, colors }: SheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose}>
        <Pressable
          className="rounded-t-3xl p-4 pb-8"
          style={{ backgroundColor: colors.card }}
          onPress={(e) => e.stopPropagation()}
        >
          {title && (
            <View className="mb-3 items-center">
              <View className="mb-3 h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
              <Text className="text-[13px] font-semibold" style={{ color: colors.sub }}>
                {title}
              </Text>
            </View>
          )}
          {items.map((item, i) => (
            <Pressable
              key={i}
              disabled={item.disabled}
              onPress={() => {
                onClose();
                item.onPress?.();
              }}
              className={`flex-row items-center gap-3 rounded-xl px-4 py-3.5 ${
                item.disabled ? 'opacity-40' : ''
              }`}
              style={({ pressed }) => [{ backgroundColor: pressed ? colors.surface : 'transparent' }]}
            >
              {item.icon && (
                <Ionicons
                  name={item.icon}
                  size={20}
                  color={item.danger ? colors.danger : colors.sub}
                />
              )}
              <Text
                className="flex-1 text-[15px] font-medium"
                style={{ color: item.danger ? colors.danger : colors.fg }}
              >
                {item.label}
              </Text>
              {item.checked && (
                <Ionicons name="checkmark" size={18} color={colors.accent} />
              )}
            </Pressable>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface SaveAsProps {
  visible: boolean;
  initialName: string;
  onSave: (name: string) => void;
  onClose: () => void;
  colors: ResolvedColors;
}

export function SaveAsModal({ visible, initialName, onSave, onClose, colors }: SaveAsProps) {
  const [name, setName] = useState(initialName);

  useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      >
        <Pressable className="flex-1" onPress={onClose} />
        <View className="rounded-t-3xl p-5 pb-8" style={{ backgroundColor: colors.card }}>
          <View className="mb-4 items-center">
            <View className="mb-3 h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
            <Text className="text-base font-semibold" style={{ color: colors.fg }}>
              Save As
            </Text>
            <Text className="mt-1 text-[13px]" style={{ color: colors.sub }}>
              The file will be stored in the app's internal storage.
            </Text>
          </View>
          <View
            className="flex-row items-center rounded-xl px-3"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <TextInput
              value={name}
              onChangeText={setName}
              autoFocus
              placeholder="filename"
              placeholderTextColor={colors.muted}
              className="flex-1 py-3 text-[15px]"
              style={{ color: colors.fg, fontFamily: 'JetBrainsMono_400Regular' }}
            />
            <Text style={{ color: colors.sub, fontFamily: 'JetBrainsMono_400Regular' }}>.json</Text>
          </View>
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-[15px] font-medium" style={{ color: colors.sub }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => name.trim().length > 0 && onSave(name.trim())}
              className="flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: colors.accent, opacity: name.trim().length > 0 ? 1 : 0.4 }}
            >
              <Text className="text-[15px] font-semibold" style={{ color: colors.accentFg }}>
                Save
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

interface ConfirmProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  colors: ResolvedColors;
}

export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
  colors,
}: ConfirmProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose}>
        <Pressable
          className="rounded-t-3xl p-5 pb-8"
          style={{ backgroundColor: colors.card }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text className="text-base font-semibold" style={{ color: colors.fg }}>
            {title}
          </Text>
          {message && (
            <Text className="mt-2 text-[14px] leading-5" style={{ color: colors.sub }}>
              {message}
            </Text>
          )}
          <View className="mt-5 flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: colors.surface }}
            >
              <Text className="text-[15px] font-medium" style={{ color: colors.sub }}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onClose();
                onConfirm();
              }}
              className="flex-1 items-center rounded-xl py-3"
              style={{ backgroundColor: danger ? colors.danger : colors.accent }}
            >
              <Text className="text-[15px] font-semibold" style={{ color: '#FFFFFF' }}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

interface ViewerProps {
  visible: boolean;
  item: FlatItem | null;
  colors: ResolvedColors;
  fontSize: number;
  onClose: () => void;
}

export function ValueViewerModal({ visible, item, colors, fontSize, onClose }: ViewerProps) {
  const content = useMemo(() => {
    if (!item) return '';
    if (item.type === 'string') return `"${item.value}"`;
    if (item.closing) return '';
    let s: string;
    try {
      s = JSON.stringify(item.value, null, 2);
    } catch {
      s = String(item.value);
    }
    if (s.length > 500_000) s = s.slice(0, 500_000) + '\n… (truncated)';
    return s;
  }, [item]);

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}>
        <View
          className="h-[70%] rounded-t-3xl"
          style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderBottomWidth: 0 }}
        >
          <View
            className="flex-row items-center justify-between rounded-t-3xl px-4 py-3"
            style={{ backgroundColor: colors.card }}
          >
            <Text
              className="flex-1 pr-3 text-[13px]"
              style={{ color: colors.sub, fontFamily: 'JetBrainsMono_400Regular' }}
              numberOfLines={1}
            >
              {item.path || 'root'}
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => {
                  Clipboard.setStringAsync(content).then(() =>
                    toast.show('Copied to clipboard', 'success')
                  );
                }}
                className="rounded-lg px-2.5 py-1.5"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="copy-outline" size={16} color={colors.sub} />
              </Pressable>
              <Pressable
                onPress={onClose}
                className="rounded-lg px-2 py-1.5"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="close" size={18} color={colors.sub} />
              </Pressable>
            </View>
          </View>
          <ScrollView
            className="flex-1 px-4 py-3"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            <Text
              selectable
              style={{
                color: colors.fg,
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize: Math.max(12, fontSize - 1),
                lineHeight: Math.round(Math.max(12, fontSize - 1) * 1.5),
              }}
            >
              {content}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
