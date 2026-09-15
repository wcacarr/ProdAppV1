import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts as useNunitoFonts,
  Nunito_400Regular,
  Nunito_500Medium,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';
import { useFonts as useMonoFonts, IBMPlexMono_400Regular, IBMPlexMono_500Medium } from '@expo-google-fonts/ibm-plex-mono';
import RootScreen from './src/screens/RootScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [nunitoLoaded] = useNunitoFonts({
    Nunito_400Regular,
    Nunito_500Medium,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });
  const [monoLoaded] = useMonoFonts({ IBMPlexMono_400Regular, IBMPlexMono_500Medium });

  const onLayout = useCallback(async () => {
    if (nunitoLoaded && monoLoaded) await SplashScreen.hideAsync();
  }, [nunitoLoaded, monoLoaded]);

  if (!nunitoLoaded || !monoLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayout}>
        <RootScreen />
        <StatusBar style="dark" />
      </View>
    </SafeAreaProvider>
  );
}
