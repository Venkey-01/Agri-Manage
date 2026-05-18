import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { initializeDatabase } from '@/database/schema';
import { useSettingsStore } from '@/store/settingsStore';
import { COLORS } from '@/constants/colors';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 2, networkMode: 'offlineFirst' },
  },
});

export default function RootLayout() {
  const isOnboarded = useSettingsStore((s) => s.isOnboarded);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { 
    async function prepare() {
      try {
        await initializeDatabase(); 
        // Artificially delay to show splash
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn('Initialization error:', e);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primary }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          {!isReady ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={COLORS.accent} />
            </View>
          ) : (
            <Stack screenOptions={{ 
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.primary } 
            }}>
              {!isOnboarded
                ? <Stack.Screen name="onboarding" />
                : <Stack.Screen name="(tabs)" />
              }
            </Stack>
          )}
        </QueryClientProvider>
      </SafeAreaProvider>
    </View>
  );
}
