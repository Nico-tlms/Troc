import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import { COLORS, NOTIFICATION_ICONS } from '@/lib/constants'
import type { Notification } from '@troc/types'

export default function NotificationsScreen() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    // Real-time subscription
    if (!profile?.id) return
    const channel = supabase
      .channel(`notifications:${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => setNotifications((prev) => [payload.new as Notification, ...prev]),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  async function load() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)

    setNotifications((data ?? []) as Notification[])
    setLoading(false)

    // Mark all as read
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', profile.id)
      .eq('read', false)
  }

  function handlePress(notif: Notification) {
    const data = notif.data as Record<string, string> | null
    if (!data) return
    if (notif.type === 'new_match' && data.match_id) router.push(`/match/${data.match_id}`)
    else if (notif.type === 'new_chain_match' && data.chain_match_id) router.push(`/match/chain-${data.chain_match_id}`)
    else if (notif.type === 'message' && data.conversation_id) router.push(`/chat/${data.conversation_id}`)
    else if (notif.type === 'exchange_request' && data.exchange_id) router.push(`/exchange/qr?exchangeId=${data.exchange_id}`)
    else if (notif.type === 'review_received') router.push('/(tabs)/profile')
  }

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60_000) return "À l'instant"
    if (diff < 3_600_000) return `Il y a ${Math.floor(diff / 60_000)} min`
    if (diff < 86_400_000) return `Il y a ${Math.floor(diff / 3_600_000)} h`
    return d.toLocaleDateString('fr-FR')
  }

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.item, !item.read && styles.itemUnread]}
      onPress={() => handlePress(item)}
      activeOpacity={0.75}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{NOTIFICATION_ICONS[item.type] ?? '🔔'}</Text>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.textArea}>
        <Text style={styles.title}>{item.title}</Text>
        {item.body && <Text style={styles.body} numberOfLines={2}>{item.body}</Text>}
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color={COLORS.primary} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => n.id}
          renderItem={renderItem}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 48 }}>🔕</Text>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
              <Text style={styles.emptySub}>Vous serez notifié dès qu'un match est trouvé.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    padding: 16, paddingTop: 12, paddingBottom: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.text },
  item: {
    flexDirection: 'row', gap: 14, paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: COLORS.surface,
  },
  itemUnread: { backgroundColor: '#F0EEFF' },
  iconContainer: { position: 'relative', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 26 },
  unreadDot: {
    position: 'absolute', top: 0, right: 0,
    width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary,
    borderWidth: 2, borderColor: COLORS.surface,
  },
  textArea: { flex: 1, gap: 3 },
  title: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  body: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  time: { fontSize: 11, color: COLORS.textTertiary },
  separator: { height: 1, backgroundColor: COLORS.border },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
})
