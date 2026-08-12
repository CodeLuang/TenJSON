import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  StyleProp,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, usePreventRemove } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useEditorStore } from '../store/editorStore';
import { useSettingsStore } from '../store/settingsStore';
import { useFilesStore } from '../store/filesStore';
import { useTheme } from '../theme/useTheme';
import { SegmentedControl } from '../components/SegmentedControl';
import { SyntaxLines, SyntaxColors } from '../components/SyntaxLines';
import { JsonTree } from '../components/JsonTree';
import { ActionSheet, ConfirmSheet, SaveAsModal, SheetItem } from '../components/Modals';
import { toast } from '../components/Toast';
import { createJsonFile, writeFile } from '../utils/fileOps';
import { formatJson, tryParseJson, validateJson, ValidationResult } from '../utils/json';

const VALIDATE_LIMIT = 1_500_000;
const TREE_LIMIT = 10_000_000;

type Nav = NativeStackNavigationProp<RootStackParamList, 'Editor'>;

interface RawEditorProps {
  text: string;
  onChange: (t: string) => void;
  fontSize: number;
  wordWrap: boolean;
  highlight: boolean;
  error: ValidationResult | null;
  colors: ReturnType<typeof useTheme>['colors'];
  accent: string;
  scrollToErrorSignal: number;
}

function RawEditor({
  text,
  onChange,
  fontSize,
  wordWrap,
  highlight,
  error,
  colors,
  accent,
  scrollToErrorSignal,
}: RawEditorProps) {
  const vScroll = useRef<ScrollView>(null);
  const hScroll = useRef<ScrollView>(null);
  const [charWidth, setCharWidth] = useState(8);
  const lineHeight = Math.round(fontSize * 1.55);
  const paddingH = 16;
  const paddingV = 12;

  const scrollToError = useCallback(() => {
    if (!error || !error.line) return;
    const y = Math.max(0, (error.line - 1) * lineHeight - 60);
    if (wordWrap) {
      vScroll.current?.scrollTo({ y, animated: true });
    } else {
      hScroll.current?.scrollTo({ y, animated: true });
    }
  }, [error, lineHeight, wordWrap]);

  useEffect(() => {
    if (scrollToErrorSignal > 0) scrollToError();
  }, [scrollToErrorSignal, scrollToError]);

  const maxLineLen = useMemo(() => {
    let m = 0;
    for (const l of text.split('\n')) m = Math.max(m, l.length);
    return m;
  }, [text]);

  const syntaxColors: SyntaxColors = {
    key: colors.key,
    str: colors.str,
    num: colors.num,
    lit: colors.lit,
    punct: colors.punct,
    error: colors.danger,
  };

  const common = {
    fontFamily: 'JetBrainsMono_400Regular' as const,
    fontSize,
    lineHeight,
    paddingHorizontal: paddingH,
    paddingVertical: paddingV,
    textAlignVertical: 'top' as const,
    margin: 0,
  };

  const contentWidth = maxLineLen * charWidth + paddingH * 2 + 8;

  const textInput = (
    <TextInput
      multiline
      value={text}
      onChangeText={onChange}
      autoCapitalize="none"
      autoCorrect={false}
      spellCheck={false}
      autoComplete="off"
      scrollEnabled={false}
      selectionColor={colors.accent + '40'}
      style={
        wordWrap
          ? { ...common, color: highlight ? 'transparent' : colors.fg }
          : {
              ...common,
              color: colors.fg,
              minWidth: contentWidth,
              minHeight: 600,
            }
      }
    />
  );

  const overlay =
    highlight && wordWrap ? (
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          paddingHorizontal: paddingH,
          paddingVertical: paddingV,
        }}
      >
        <SyntaxLines text={text} fontSize={fontSize} colors={syntaxColors} />
        {error && error.line !== undefined && (
          <View
            style={{
              position: 'absolute',
              left: paddingH,
              right: paddingH,
              top: paddingV + (error.line - 1) * lineHeight + lineHeight - 1.5,
              height: 2,
              backgroundColor: colors.danger,
              opacity: 0.9,
            }}
          />
        )}
      </View>
    ) : null;

  const charProbeStyle: StyleProp<TextStyle> = {
    position: 'absolute',
    opacity: 0,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize,
  };

  return (
    <View className="flex-1">
      {wordWrap ? (
        <ScrollView
          ref={vScroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={{ position: 'relative', minHeight: '100%' }}>
            {textInput}
            {overlay}
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          ref={hScroll}
          horizontal
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={{ minWidth: contentWidth }}>{textInput}</View>
          </ScrollView>
        </ScrollView>
      )}
      <Text
        style={charProbeStyle}
        onTextLayout={(e) => {
          if (e.nativeEvent.lines.length > 0) {
            const w = e.nativeEvent.lines[0].width;
            if (w > 0) setCharWidth(w / 10);
          }
        }}
      >
        0123456789
      </Text>
    </View>
  );
}

export function EditorScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors, accentValue } = useTheme();
  const fontSize = useSettingsStore((s) => s.fontSize);
  const wordWrap = useSettingsStore((s) => s.wordWrap);

  const uri = useEditorStore((s) => s.uri);
  const name = useEditorStore((s) => s.name);
  const text = useEditorStore((s) => s.text);
  const dirty = useEditorStore((s) => s.dirty);
  const mode = useEditorStore((s) => s.mode);
  const validation = useEditorStore((s) => s.validation);
  const historyLen = useEditorStore((s) => s.history.length);
  const futureLen = useEditorStore((s) => s.future.length);

  const setText = useEditorStore((s) => s.setText);
  const setMode = useEditorStore((s) => s.setMode);
  const setValidation = useEditorStore((s) => s.setValidation);
  const markSaved = useEditorStore((s) => s.markSaved);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);

  const [menuOpen, setMenuOpen] = useState(false);
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [parsing, setParsing] = useState(true);
  const [parsed, setParsed] = useState<{ ok: boolean; value: unknown }>({
    ok: false,
    value: null,
  });
  const [scrollToErrorSignal, setScrollToErrorSignal] = useState(0);
  const pendingAction = useRef<(() => void) | null>(null);

  const sizeBytes = useMemo(() => {
    let bytes = 0;
    for (let i = 0; i < text.length; i++) bytes += text.charCodeAt(i) < 128 ? 1 : 2;
    return bytes;
  }, [text]);

  const bigFile = sizeBytes > VALIDATE_LIMIT;
  const rawOnly = sizeBytes > TREE_LIMIT;
  const treeEnabled = !rawOnly && parsed.ok;

  useEffect(() => {
    if (bigFile || text.length === 0) {
      setValidation(null);
      return;
    }
    const t = setTimeout(() => setValidation(validateJson(text)), 300);
    return () => clearTimeout(t);
  }, [text, bigFile, setValidation]);

  useEffect(() => {
    if (mode !== 'tree') return;
    setParsing(true);
    const t = setTimeout(() => {
      setParsed(tryParseJson(text));
      setParsing(false);
    }, 40);
    return () => clearTimeout(t);
  }, [text, mode]);

  useEffect(() => {
    if (rawOnly && mode === 'tree') setMode('raw');
  }, [rawOnly, mode, setMode]);

  const save = useCallback(() => {
    const s = useEditorStore.getState();
    if (s.text.length === 0) {
      toast.show('Nothing to save', 'error');
      return;
    }
    const v = useEditorStore.getState().validation;
    if (!bigFile && v && !v.valid) {
      toast.show(`Invalid JSON — ${v.error}`, 'error');
      setMode('raw');
      setScrollToErrorSignal((n) => n + 1);
      return;
    }
    if (!s.uri) {
      setSaveAsOpen(true);
      return;
    }
    try {
      writeFile(s.uri, s.text);
      markSaved(s.uri, s.text);
      useFilesStore.getState().upsertRecent({
        name: s.name,
        uri: s.uri,
        size: s.text.length,
        modifiedAt: Date.now(),
      });
      toast.show('Saved', 'success');
    } catch {
      toast.show('Failed to save file', 'error');
    }
  }, [bigFile, markSaved, setMode]);

  const saveAs = useCallback(
    (fileName: string) => {
      try {
        const { uri: newUri, name: newName } = createJsonFile(fileName, text);
        markSaved(newUri, text);
        useFilesStore.getState().upsertRecent({
          name: newName,
          uri: newUri,
          size: text.length,
          modifiedAt: Date.now(),
        });
        setSaveAsOpen(false);
        toast.show('Saved to app storage', 'success');
      } catch {
        toast.show('Failed to save file', 'error');
      }
    },
    [text, markSaved]
  );

  const format = useCallback(() => {
    const formatted = formatJson(text);
    if (formatted === null) {
      toast.show('Cannot format — invalid JSON', 'error');
      return;
    }
    setText(formatted);
    toast.show('Formatted', 'success');
  }, [text, setText]);

  const copyAll = useCallback(() => {
    Clipboard.setStringAsync(text).then(() => toast.show('JSON copied', 'success'));
  }, [text]);

  usePreventRemove(dirty, ({ data }) => {
    pendingAction.current = () => navigation.dispatch(data.action);
    setDiscardOpen(true);
  });

  const lineCount = useMemo(() => text.split('\n').length, [text]);

  const menuItems: SheetItem[] = [
    { label: 'Format JSON', icon: 'sparkles-outline', onPress: format },
    { label: 'Copy JSON', icon: 'copy-outline', onPress: copyAll },
    { label: 'Save As…', icon: 'save-outline', onPress: () => setSaveAsOpen(true) },
    {
      label: 'Toggle word wrap',
      icon: 'swap-horizontal-outline',
      checked: wordWrap,
      onPress: () => useSettingsStore.getState().setWordWrap(!wordWrap),
    },
  ];

  const headerBtn = (
    icon: keyof typeof Ionicons.glyphMap,
    onPress: () => void,
    disabled = false
  ) => (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="h-9 w-9 items-center justify-center rounded-full"
      style={{ backgroundColor: colors.surface, opacity: disabled ? 0.35 : 1 }}
    >
      <Ionicons name={icon} size={18} color={colors.sub} />
    </Pressable>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View
          className="flex-row items-center justify-between px-2 pb-2"
          style={{ paddingTop: insets.top + 6 }}
        >
          <View className="flex-1 flex-row items-center">
            <Pressable
              onPress={() => navigation.goBack()}
              className="h-9 w-9 items-center justify-center rounded-full"
            >
              <Ionicons name="chevron-back" size={22} color={colors.sub} />
            </Pressable>
            <View className="flex-1 pr-2">
              <Text
                className="text-[14px] font-semibold"
                style={{ color: colors.fg, fontFamily: 'JetBrainsMono_400Regular' }}
                numberOfLines={1}
              >
                {name}
              </Text>
              <View className="flex-row items-center gap-1">
                {dirty ? (
                  <>
                    <View
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: colors.warning }}
                    />
                    <Text className="text-[11px]" style={{ color: colors.warning }}>
                      Unsaved
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                    <Text className="text-[11px]" style={{ color: colors.muted }}>
                      Saved
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
          <View className="flex-row items-center gap-1.5 pr-1">
            {headerBtn('arrow-undo-outline', undo, historyLen === 0)}
            {headerBtn('arrow-redo-outline', redo, futureLen === 0)}
            <Pressable
              onPress={save}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.accent, opacity: dirty ? 1 : 0.6 }}
            >
              <Ionicons name="checkmark" size={19} color={colors.accentFg} />
            </Pressable>
            <Pressable
              onPress={() => setMenuOpen(true)}
              className="h-9 w-9 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.surface }}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.sub} />
            </Pressable>
          </View>
        </View>

        <View className="px-4 pb-2">
          {rawOnly ? (
            <View
              className="flex-row items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ backgroundColor: colors.warning + '1A' }}
            >
              <Ionicons name="warning-outline" size={16} color={colors.warning} />
              <Text className="flex-1 text-[12px]" style={{ color: colors.warning }}>
                Large file — showing plain text mode without syntax highlighting.
              </Text>
            </View>
          ) : (
            <SegmentedControl
              size="sm"
              options={[
                { label: 'Tree', value: 'tree' },
                { label: 'Raw', value: 'raw' },
              ]}
              value={mode}
              onChange={setMode}
            />
          )}
        </View>

        {mode === 'raw' && validation && !validation.valid && (
          <Pressable
            onPress={() => setScrollToErrorSignal((n) => n + 1)}
            className="mx-4 mb-2 flex-row items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ backgroundColor: colors.danger + '1A' }}
          >
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text className="flex-1 text-[12px]" style={{ color: colors.danger }}>
              {validation.line} : {validation.column} — {validation.error}
            </Text>
            <Ionicons name="arrow-down-circle-outline" size={16} color={colors.danger} />
          </Pressable>
        )}

        <View className="flex-1">
          {mode === 'tree' ? (
            treeEnabled ? (
              parsing ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" color={colors.accent} />
                </View>
              ) : (
                <JsonTree parsed={parsed} colors={colors} fontSize={fontSize} />
              )
            ) : (
              <View className="flex-1 items-center justify-center gap-2 p-8">
                <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
                <Text className="text-center text-sm" style={{ color: colors.sub }}>
                  {rawOnly
                    ? 'File is too large for the tree view. Use Raw mode.'
                    : 'This file is not valid JSON. Switch to Raw mode to edit.'}
                </Text>
                {!rawOnly && (
                  <Pressable
                    onPress={() => setMode('raw')}
                    className="mt-2 rounded-xl px-4 py-2.5"
                    style={{ backgroundColor: colors.accent }}
                  >
                    <Text className="text-[14px] font-semibold" style={{ color: colors.accentFg }}>
                      Open in Raw mode
                    </Text>
                  </Pressable>
                )}
              </View>
            )
          ) : (
            <RawEditor
              text={text}
              onChange={setText}
              fontSize={fontSize}
              wordWrap={wordWrap}
              highlight={!bigFile}
              error={validation}
              colors={colors}
              accent={accentValue}
              scrollToErrorSignal={scrollToErrorSignal}
            />
          )}
        </View>

        <View
          className="flex-row items-center justify-between px-4"
          style={{
            paddingBottom: Math.max(insets.bottom, 6),
            paddingTop: 6,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: colors.border,
          }}
        >
          <Text className="text-[11px]" style={{ color: colors.muted }}>
            {lineCount} lines
          </Text>
          <Text className="text-[11px]" style={{ color: colors.muted }}>
            {Math.max(1, Math.round(sizeBytes / 1024))} KB
          </Text>
          <Text className="text-[11px]" style={{ color: colors.muted }}>
            {mode === 'tree' ? 'Tree view' : wordWrap ? 'Raw · wrap' : 'Raw · no wrap'}
          </Text>
        </View>
      </KeyboardAvoidingView>

      <ActionSheet
        visible={menuOpen}
        title={name}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
        colors={colors}
      />

      <SaveAsModal
        visible={saveAsOpen}
        initialName={name === 'untitled.json' ? 'my-json' : name.replace(/\.json$/, '')}
        onSave={saveAs}
        onClose={() => setSaveAsOpen(false)}
        colors={colors}
      />

      <ConfirmSheet
        visible={discardOpen}
        title="Discard unsaved changes?"
        message="Your changes will be lost if you leave this file now."
        confirmLabel="Discard"
        danger
        onConfirm={() => {
          pendingAction.current?.();
          pendingAction.current = null;
          setDiscardOpen(false);
        }}
        onClose={() => {
          pendingAction.current = null;
          setDiscardOpen(false);
        }}
        colors={colors}
      />
    </View>
  );
}
