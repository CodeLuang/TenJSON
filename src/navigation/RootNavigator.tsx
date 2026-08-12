import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { EditorScreen } from '../screens/EditorScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ResolvedColors } from '../theme/useTheme';

export type RootStackParamList = {
  Home: undefined;
  Editor: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface Props {
  colors: ResolvedColors;
  isDark: boolean;
}

export function RootNavigator({ colors, isDark }: Props) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="Editor"
        component={EditorScreen}
        options={{ gestureEnabled: true }}
      />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
