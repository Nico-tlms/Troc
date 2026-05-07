import React, { useCallback, useEffect } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { Avatar } from '@/components/Avatar'
import { COLORS } from '@/lib/constants'
import type { Conversation } from '@/types'

export default function MessagesScreen() {
  const router = useRouter()
  const { profile } = useAuthStore()
  const { conversations, loading, loadConversations } = useChatStore()
  const [refreshing, setRefreshing] = React.useState(false)

  useEffect(() => { if (profile?.id) loadConversations(profile.id) }, [profile?.id])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    if (profile?.id) await loadConversations(profile.id)
    setRefreshing(false)
  }, [profile?.id])

  const getOtherParticipantId = (conv: Conversation) =>
    conv.participant_ids.find((id) => id !== profile?.id) ?? ''

  const renderItem = ({ item }: { item: Conversation }) => {
    const otherId = getOtherParticipantId(item)
    const otherProfile = item.other_participant
    const name = otherProfile?.display_name ?? otherProfile?.username ?? 'Utilisateur'
    const lastMsg = item.last_message
    const timeStr = item.last_message_at
      ? new Date(item.last_message_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      : ''

    return (
      <TouchableOpacity
        style={styles.item}
        onPress={() => router.push(`/chat/${item.id}`)}
        activeOpacity={0.85}
      >
        <Avatar
          uri={otherProfile?.avatar_url ?? null}
          name={name}
          size={50}
        />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
            <Text style={styles.itemTime}>{timeStr}</Text>
          </View>
          <Text style={styles.itemLastMsg} numberOfLines={1}>
            {lastMsg?.content ?? 'Démarrer la conversation…'}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      {loading && conversations.length === 0 ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>💬</Text>
              <Text style={styles.emptyTitle}>Aucun message</Text>
              <Text style={styles.emptySub}>
                Vos conversations avec d'autres utilisateurs apparaîtront ici.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  list: { paddingBottom: 32 },
  item: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 14, backgroundColor: COLORS.surface,
  },
  itemContent: { flex: 1 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemName: { fontSize: 15, fontWeight: '700', color: COLORS.text, flex: 1 },
  itemTime: { fontSize: 12, color: COLORS.textTertiary },
  itemLastMsg: { fontSize: 13, color: COLORS.textSecondary },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 80 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
})
