import { Pressable, Text, View } from 'react-native';

export interface SegOption<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: Props<T>) {
  return (
    <View className="flex-row rounded-lg bg-surface p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            className={`flex-1 items-center justify-center rounded-md ${
              active ? 'bg-accent' : ''
            } ${size === 'sm' ? 'h-7' : 'h-9'}`}
          >
            <Text
              className={`font-medium ${size === 'sm' ? 'text-[12px]' : 'text-[13px]'} ${
                active ? 'text-accent-fg' : 'text-sub'
              }`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
