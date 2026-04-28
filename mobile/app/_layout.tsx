import '../global.css'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BleProvider } from '../lib/BleContext'
import { ThemeProvider, useTheme } from '../lib/ThemeContext'
import { AlertProvider } from '../lib/AlertContext'
import { ActiveAlertBanner } from '../components/ActiveAlertBanner'
import { JumpRecorderMount } from '../components/JumpRecorderMount'

function ThemedApp() {
  const { colors, isDark } = useTheme()
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <JumpRecorderMount />
      <ActiveAlertBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="jump/[id]" />
        <Stack.Screen name="alerts" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BleProvider>
          <ThemeProvider>
            <AlertProvider>
              <ThemedApp />
            </AlertProvider>
          </ThemeProvider>
        </BleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
