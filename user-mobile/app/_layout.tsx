import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserProvider, useUser } from '../context/UserContext';

export const unstable_settings = {
  anchor: '(auth)',
};

function AppNav() {
  const { userData, loading } = useUser();
  const colorScheme = useColorScheme();

  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!userData && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (userData && (inAuthGroup || segments.length === 0)) {
      // Redirect to app if authenticated or at root
      router.replace('/(tabs)');
    }
  }, [userData, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // The "key" prop on the Stack is CRITICAL. 
  // When userData changes, the key changes, forcing React to discard the old navigation history
  // and start a fresh stack. This prevents users from "swiping back" into the previous session's screens.
  return (
    <Stack 
      key={userData ? 'authenticated' : 'unauthenticated'}
      screenOptions={{ headerShown: false }}
    >
      {!userData ? (
        // Auth Stack: ONLY login/signup available
        <Stack.Screen name="(auth)" />
      ) : (
        // App Stack: Protected screens
        <>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="index" />
          <Stack.Screen name="bus-list" />
          <Stack.Screen name="seat-selection" />
          <Stack.Screen name="booking-summary" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="booking-success" />
          <Stack.Screen name="account" />
          <Stack.Screen name="checkout" />
        </>
      )}
    </Stack>
  );
}

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
          <AppNav />
          <StatusBar style="auto" />
        </ThemeProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
