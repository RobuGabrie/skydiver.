import { StyleSheet, Platform, View } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../lib/ThemeContext'
import { Typography, TouchTarget } from '../../lib/theme'

export default function TabLayout() {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()

  const tabBarHeight = 68 + insets.bottom

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: {
          backgroundColor: colors.background,
          paddingBottom: tabBarHeight + 14,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          left: 16,
          right: 16,
          bottom: 14,
          borderTopColor: colors.primary + '45',
          borderTopWidth: 1.5,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          borderRadius: 26,
          overflow: 'hidden',
          shadowColor: '#00110E',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.42 : 0.16,
          shadowRadius: 28,
          elevation: 14,
        },
        tabBarBackground: () =>
          Platform.OS === 'ios' ? (
            <>
              <BlurView
                tint={isDark ? 'dark' : 'light'}
                intensity={56}
                style={StyleSheet.absoluteFill}
              />
              <BlurView
                tint={isDark ? 'systemChromeMaterialDark' : 'systemChromeMaterial'}
                intensity={22}
                style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
              />
            </>
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark
                    ? 'rgba(10, 27, 23, 0.94)'
                    : 'rgba(244, 251, 249, 0.96)',
                },
              ]}
            />
          ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: Typography.bold,
          marginTop: 2,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 2,
          marginTop: 4,
          minHeight: TouchTarget,
        },
        tabBarActiveBackgroundColor: 'transparent',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'speedometer' : 'speedometer-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'map' : 'map-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logbook"
        options={{
          title: 'Logbook',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          title: 'Device',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bluetooth' : 'bluetooth-outline'} size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
