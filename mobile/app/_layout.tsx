import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { BleProvider } from '../lib/BleContext'
import { ThemeProvider, useTheme } from '../lib/ThemeContext'

function ThemedApp() {
  const { colors, isDark } = useTheme()
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
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
            <ThemedApp />
          </ThemeProvider>
        </BleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
