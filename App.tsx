import './global.css';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFonts, JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { DefaultTheme, DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { ToastHost } from './src/components/Toast';
import { useTheme } from './src/theme/useTheme';
import { styleVars } from './src/theme/palette';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({ JetBrainsMono_400Regular });
  const [appReady, setAppReady] = useState(false);
  const { colors, isDark, vars } = useTheme();

  useEffect(() => {
    if (fontsLoaded && !appReady) {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, appReady]);

  const navTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    dark: isDark,
    colors: {
      primary: colors.accent,
      background: colors.background,
      card: colors.card,
      text: colors.fg,
      border: colors.border,
      notification: colors.danger,
    },
  };

  return (
    <View style={[{ flex: 1, backgroundColor: colors.background }, styleVars(vars)]}>

      {appReady && (
        <SafeAreaProvider>
          <NavigationContainer theme={navTheme}>
            <RootNavigator colors={colors} isDark={isDark} />
          </NavigationContainer>
          <ToastHost />
        </SafeAreaProvider>
      )}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  );
}
