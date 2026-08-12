import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { create } from 'zustand';

type ToastType = 'info' | 'success' | 'error';

interface ToastState {
  msg: string | null;
  type: ToastType;
  id: number;
  show: (msg: string, type?: ToastType) => void;
  hide: () => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  msg: null,
  type: 'info',
  id: 0,
  show: (msg, type = 'info') => set((s) => ({ msg, type, id: s.id + 1 })),
  hide: () => set({ msg: null }),
}));

export const toast = {
  show: (msg: string, type: ToastType = 'info') =>
    useToastStore.getState().show(msg, type),
};

export function ToastHost() {
  const msg = useToastStore((s) => s.msg);
  const type = useToastStore((s) => s.type);
  const id = useToastStore((s) => s.id);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!msg) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 220 }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 24, duration: 200, useNativeDriver: true }),
      ]).start(() => useToastStore.getState().hide());
    }, 2600);
    return () => clearTimeout(t);
  }, [id, msg, opacity, translateY]);

  if (!msg) return null;

  const bg =
    type === 'error' ? 'bg-danger' : type === 'success' ? 'bg-success' : 'bg-fg';
  const text = type === 'error' || type === 'success' ? 'text-white' : 'text-background';

  return (
    <View
      pointerEvents="none"
      className="absolute inset-x-0 bottom-8 z-50 items-center"
    >
      <Animated.View
        style={{ opacity, transform: [{ translateY }] }}
        className={`max-w-[85%] rounded-full px-4 py-2.5 shadow-lg ${bg}`}
      >
        <Text className={`text-[13px] font-medium ${text}`}>{msg}</Text>
      </Animated.View>
    </View>
  );
}
