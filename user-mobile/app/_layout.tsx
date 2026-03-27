import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(auth)',
};

import { UserProvider } from '../context/UserContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const CustomDefaultTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      card: '#FFFFFF',
      border: '#EEEEEE',
    },
  };

  const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      card: '#1C1C1E',
      border: '#38383A',
    },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <ThemeProvider value={colorScheme === 'dark' ? CustomDarkTheme : CustomDefaultTheme}>
          <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="bus-list" options={{ headerShown: false }} />
            <Stack.Screen name="seat-selection" options={{ headerShown: false }} />
            <Stack.Screen name="booking-summary" options={{ headerShown: false }} />
            <Stack.Screen name="payment" options={{ headerShown: false }} />
            <Stack.Screen name="booking-success" options={{ headerShown: false }} />
            <Stack.Screen name="account" options={{ headerShown: false }} />
            <Stack.Screen name="checkout" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
