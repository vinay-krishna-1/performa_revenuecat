import React, { useEffect } from 'react';
import { LogBox } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../src/features/recording/RecordingTask';
import { AuthProvider } from '../src/features/auth/AuthContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { SubscriptionService } from '../src/services/revenuecat';

import { ScreenBackground } from '../src/components/common';

LogBox.ignoreAllLogs(true);

function RootNavigation() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    SubscriptionService.getInstance().initialize();
  }, []);

  return (
    <SafeAreaProvider style={{ backgroundColor: '#000000' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenBackground />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen
          name="activity/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="pro/index"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootNavigation />
      </AuthProvider>
    </ThemeProvider>
  );
}
