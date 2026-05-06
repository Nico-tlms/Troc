import React, { useEffect } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { COLORS } from '@/lib/constants'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const segments = useSegments()
  const { session, loading, setSession } = useAuthStore()

  useEffect(() => {
    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    // Load initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login')
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)')
    }
  }, [session, loading, segments])

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthGuard>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="listing/create"
            options={{
              headerShown: true,
              title: 'Nouvelle annonce',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: COLORS.surface },
              headerTitleStyle: { fontWeight: '700', color: COLORS.text },
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="listing/[id]"
            options={{
              headerShown: true,
              title: 'Annonce',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: COLORS.surface },
              headerTitleStyle: { fontWeight: '700', color: COLORS.text },
            }}
          />
          <Stack.Screen
            name="match/[id]"
            options={{
              headerShown: true,
              title: 'Match',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: COLORS.surface },
              headerTitleStyle: { fontWeight: '700', color: COLORS.text },
            }}
          />
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: true,
              title: 'Conversation',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: COLORS.surface },
              headerTitleStyle: { fontWeight: '700', color: COLORS.text },
            }}
          />
          <Stack.Screen
            name="exchange/qr"
            options={{
              headerShown: true,
              title: 'Validation QR',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: COLORS.surface },
              headerTitleStyle: { fontWeight: '700', color: COLORS.text },
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="notifications"
            options={{
              headerShown: true,
              title: 'Notifications',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: COLORS.surface },
              headerTitleStyle: { fontWeight: '700', color: COLORS.text },
            }}
          />
          <Stack.Screen
            name="review/[exchangeId]"
            options={{
              headerShown: true,
              title: 'Laisser un avis',
              headerTintColor: COLORS.primary,
              headerStyle: { backgroundColor: COLORS.surface },
              headerTitleStyle: { fontWeight: '700', color: COLORS.text },
              presentation: 'modal',
            }}
          />
        </Stack>
      </AuthGuard>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
})
