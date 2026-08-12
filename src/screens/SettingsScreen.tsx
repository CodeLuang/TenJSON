import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACCENTS, AccentColor, AppearanceMode } from '../theme/palette';
import { MAX_FONT, MIN_FONT, useSettingsStore } from '../store/settingsStore';
import { useTheme } from '../theme/useTheme';
import { SegmentedControl } from '../components/SegmentedControl';

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const appearance = useSettingsStore((s) => s.appearance);
  const accent = useSettingsStore((s) => s.accent);
  const wordWrap = useSettingsStore((s) => s.wordWrap);
  const fontSize = useSettingsStore((s) => s.fontSize);

  const Section = ({ title, children }: SectionProps) => (
    <View className="mb-6">
      <Text
        className="mb-2 px-1 text-[12px] font-semibold uppercase tracking-wide"
        style={{ color: colors.muted }}
      >
        {title}
      </Text>
      <View
        className="overflow-hidden rounded-2xl"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        {children}
      </View>
    </View>
  );

  const Row = ({ children }: { children: React.ReactNode }) => (
    <View className="flex-row items-center justify-between px-4 py-3.5">{children}</View>
  );

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <View
        className="flex-row items-center gap-2 px-4 pb-3"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-9 w-9 items-center justify-center rounded-full"
        >
          <Ionicons name="chevron-back" size={22} color={colors.sub} />
        </Pressable>
        <Text className="text-[19px] font-bold" style={{ color: colors.fg }}>
          Settings
        </Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <Section title="Appearance">
          <View className="px-4 py-3.5">
            <SegmentedControl
              options={[
                { label: 'Light', value: 'light' },
                { label: 'Dark', value: 'dark' },
                { label: 'System', value: 'system' },
              ]}
              value={appearance}
              onChange={(v) => useSettingsStore.getState().setAppearance(v as AppearanceMode)}
            />
            <Text className="mt-2 text-[12px]" style={{ color: colors.muted }}>
              Applies instantly — no restart needed.
            </Text>
          </View>
        </Section>

        <Section title="Accent Color">
          <View className="flex-row items-center justify-between px-4 py-4">
            {ACCENTS.map((a) => {
              const active = accent === a.name;
              return (
                <Pressable
                  key={a.name}
                  onPress={() => useSettingsStore.getState().setAccent(a.name as AccentColor)}
                  className="items-center gap-1.5"
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: a.value,
                      borderWidth: active ? 3 : 0,
                      borderColor: isDark ? '#FFFFFF' : '#FFFFFF',
                      outlineWidth: 0,
                      shadowColor: a.value,
                      shadowOpacity: active ? 0.5 : 0,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 2 },
                    }}
                  >
                    {active && <Ionicons name="checkmark" size={18} color="#FFFFFF" />}
                  </View>
                  <Text className="text-[11px]" style={{ color: active ? a.value : colors.muted }}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title="Editor">
          <Row>
            <View>
              <Text className="text-[15px] font-medium" style={{ color: colors.fg }}>
                Word Wrap
              </Text>
              <Text className="mt-0.5 text-[12px]" style={{ color: colors.muted }}>
                Wrap long lines in Raw mode
              </Text>
            </View>
            <Switch
              value={wordWrap}
              onValueChange={(v) => useSettingsStore.getState().setWordWrap(v)}
              trackColor={{ false: colors.surface, true: colors.accent }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.surface}
            />
          </Row>
          <View
            className="h-px w-full"
            style={{ backgroundColor: colors.border }}
          />
          <Row>
            <View>
              <Text className="text-[15px] font-medium" style={{ color: colors.fg }}>
                Font Size
              </Text>
              <Text className="mt-0.5 text-[12px]" style={{ color: colors.muted }}>
                Code text size
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => useSettingsStore.getState().setFontSize(fontSize - 1)}
                disabled={fontSize <= MIN_FONT}
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.surface, opacity: fontSize <= MIN_FONT ? 0.35 : 1 }}
              >
                <Ionicons name="remove" size={16} color={colors.sub} />
              </Pressable>
              <Text className="w-8 text-center text-[15px] font-semibold" style={{ color: colors.fg }}>
                {fontSize}
              </Text>
              <Pressable
                onPress={() => useSettingsStore.getState().setFontSize(fontSize + 1)}
                disabled={fontSize >= MAX_FONT}
                className="h-8 w-8 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.surface, opacity: fontSize >= MAX_FONT ? 0.35 : 1 }}
              >
                <Ionicons name="add" size={16} color={colors.sub} />
              </Pressable>
              <Text
                className="ml-2"
                style={{
                  color: colors.key,
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize,
                }}
              >
                {'{ }'}
              </Text>
            </View>
          </Row>
        </Section>

        <Text className="mb-8 mt-2 text-center text-[12px]" style={{ color: colors.muted }}>
          TenJSON v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
