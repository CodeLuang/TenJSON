import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { valueType, JsonType, prettyValue, summarize } from '../utils/json';
import { ResolvedColors } from '../theme/useTheme';
import { ValueViewerModal } from './Modals';

const INDENT = 18;
const GUIDE_X = 8;

export interface FlatItem {
  id: string;
  path: string;
  keyLabel: string | null;
  value: unknown;
  type: JsonType;
  depth: number;
  childCount: number;
  expandable: boolean;
  expanded: boolean;
  closing: boolean;
}

interface BuildContext {
  expanded: Set<string>;
  items: FlatItem[];
}

function buildItems(
  ctx: BuildContext,
  value: unknown,
  depth: number,
  keyLabel: string | null,
  path: string,
  id: string
): void {
  const type = valueType(value);
  const isContainer = type === 'object' || type === 'array';
  const childCount = isContainer
    ? type === 'object'
      ? Object.keys(value as object).length
      : (value as unknown[]).length
    : 0;

  const isExpanded = isContainer && ctx.expanded.has(id);
  ctx.items.push({
    id,
    path,
    keyLabel,
    value,
    type,
    depth,
    childCount,
    expandable: isContainer && childCount > 0,
    expanded: isExpanded,
    closing: false,
  });

  if (isContainer && isExpanded) {
    if (type === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      for (let i = 0; i < entries.length; i++) {
        const [k, v] = entries[i];
        buildItems(ctx, v, depth + 1, k, path ? `${path}.${k}` : k, `${id}::${k}`);
      }
    } else {
      const arr = value as unknown[];
      for (let i = 0; i < arr.length; i++) {
        buildItems(ctx, arr[i], depth + 1, String(i), path ? `${path}[${i}]` : `[${i}]`, `${id}::[${i}]`);
      }
    }
    ctx.items.push({
      id: `${id}::close`,
      path,
      keyLabel: null,
      value: undefined,
      type,
      depth,
      childCount: 0,
      expandable: false,
      expanded: false,
      closing: true,
    });
  }
}

const valueColor = (type: JsonType, colors: ResolvedColors): string => {
  switch (type) {
    case 'string':
      return colors.str;
    case 'number':
      return colors.num;
    case 'boolean':
    case 'null':
      return colors.lit;
    default:
      return colors.fg;
  }
};

function renderValueText(item: FlatItem, colors: ResolvedColors): string {
  if (item.closing) return item.type === 'array' ? ']' : '}';
  if (item.type === 'string') {
    return `"${summarize(item.value as string, 80)}"`;
  }
  if (item.type === 'object' || item.type === 'array') {
    const open = item.type === 'array' ? '[' : '{';
    const close = item.type === 'array' ? ']' : '}';
    if (item.expanded) return open;
    const summary =
      item.type === 'array'
        ? `${item.childCount} ${item.childCount === 1 ? 'item' : 'items'}`
        : `${item.childCount} ${item.childCount === 1 ? 'key' : 'keys'}`;
    return `${open}…${close}  ${summary}`;
  }
  return prettyValue(item.value);
}

interface Props {
  parsed: { ok: boolean; value: unknown };
  colors: ResolvedColors;
  fontSize: number;
}

export function JsonTree({ parsed, colors, fontSize }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));
  const [viewer, setViewer] = useState<FlatItem | null>(null);

  const items: FlatItem[] = useMemo(() => {
    if (!parsed.ok) return [];
    const ctx: BuildContext = { expanded, items: [] };
    buildItems(ctx, parsed.value, 0, null, '', 'root');
    return ctx.items;
  }, [parsed, expanded]);

  const allIds = useMemo(() => {
    const ids = new Set<string>();
    if (parsed.ok) {
      const walk = (v: unknown, id: string) => {
        const t = valueType(v);
        if ((t === 'object' || t === 'array')) {
          ids.add(id);
          if (t === 'object') {
            for (const [k, c] of Object.entries(v as Record<string, unknown>)) {
              walk(c, `${id}::${k}`);
            }
          } else {
            (v as unknown[]).forEach((c, i) => walk(c, `${id}::[${i}]`));
          }
        }
      };
      walk(parsed.value, 'root');
    }
    return ids;
  }, [parsed]);

  const toggle = (item: FlatItem) => {
    if (!item.expandable) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(allIds));
  const collapseAll = () => setExpanded(new Set(['root']));

  if (!parsed.ok) {
    return (
      <View className="flex-1 items-center justify-center gap-2 p-8">
        <Ionicons name="alert-circle-outline" size={32} color={colors.danger} />
        <Text className="text-center text-sm" style={{ color: colors.sub }}>
          This file is not valid JSON and cannot be shown as a tree.
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: FlatItem }) => {
    const hasKey = item.keyLabel !== null;
    return (
      <Pressable
        onPress={() => {
          if (item.closing) return;
          if (item.expandable) toggle(item);
          else setViewer(item);
        }}
        onLongPress={() => !item.closing && setViewer(item)}
        className="flex-row items-center"
        style={{
          paddingLeft: item.depth * INDENT + (hasKey ? 0 : INDENT),
          paddingRight: 16,
          minHeight: Math.max(30, Math.round(fontSize * 1.9)),
        }}
      >
        {item.depth > 0 &&
          Array.from({ length: item.depth }, (_, d) => (
            <View
              key={d}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: GUIDE_X + d * INDENT,
                top: 0,
                bottom: 0,
                width: 1,
                backgroundColor: colors.border,
              }}
            />
          ))}
        {item.expandable ? (
          <Ionicons
            name={item.expanded ? 'chevron-down' : 'chevron-forward'}
            size={14}
            color={colors.sub}
            style={{ width: 20, marginRight: 2 }}
          />
        ) : (
          <View style={{ width: 22 }} />
        )}
        <View className="flex-1 flex-row flex-wrap items-baseline">
          {hasKey && (
            <>
              <Text
                selectable
                style={{
                  color: colors.key,
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize,
                }}
                numberOfLines={1}
              >
                {item.keyLabel}
              </Text>
              <Text
                style={{
                  color: colors.punct,
                  fontFamily: 'JetBrainsMono_400Regular',
                  fontSize,
                }}
              >
                :{' '}
              </Text>
            </>
          )}
          {item.closing ? (
            <Text
              style={{
                color: colors.punct,
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize,
              }}
            >
              {item.type === 'array' ? ']' : '}'}
              {item.keyLabel !== null ? '' : ''}
            </Text>
          ) : (
            <Text
              style={{
                color: valueColor(item.type, colors),
                fontFamily: 'JetBrainsMono_400Regular',
                fontSize,
                fontStyle: item.type === 'null' ? 'italic' : 'normal',
              }}
              numberOfLines={item.expandable ? 1 : 3}
            >
              {renderValueText(item, colors)}
            </Text>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <View className="flex-1">
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={renderItem}
        initialNumToRender={30}
        maxToRenderPerBatch={40}
        windowSize={11}
        removeClippedSubviews={false}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 4 }}
        ListHeaderComponent={
          <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
            <Text className="text-[11px] uppercase tracking-wide" style={{ color: colors.muted }}>
              {items.length} nodes
            </Text>
            <View className="flex-row gap-1">
              <Pressable
                onPress={expandAll}
                className="rounded-md px-2 py-1"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-[11px] font-medium" style={{ color: colors.sub }}>
                  Expand all
                </Text>
              </Pressable>
              <Pressable
                onPress={collapseAll}
                className="rounded-md px-2 py-1"
                style={{ backgroundColor: colors.surface }}
              >
                <Text className="text-[11px] font-medium" style={{ color: colors.sub }}>
                  Collapse all
                </Text>
              </Pressable>
            </View>
          </View>
        }
      />
      <ValueViewerModal
        visible={viewer !== null}
        item={viewer}
        colors={colors}
        fontSize={fontSize}
        onClose={() => setViewer(null)}
      />
    </View>
  );
}
