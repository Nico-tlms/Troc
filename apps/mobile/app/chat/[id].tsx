import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { COLORS } from '@/lib/constants'
import type { Message } from '@troc/types'

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { profile } = useAuthStore()
  const { messages, loadMessages, sendMessage } = useChatStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  const convMessages = messages[id] ?? []

  useEffect(() => {
    if (id) loadMessages(id)

    // Real-time subscription
    const channel = supabase
      .channel(`conv:${id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        () => { loadMessages(id) },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      await sendMessage(id, trimmed)
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.')
      setText(trimmed)
    } finally {
      setSending(false)
    }
  }

  const handleValidateExchange = () => {
    Alert.alert(
      'Valider l\'échange',
      'Vous êtes prêts à vous rencontrer ? Générez un QR code pour confirmer l\'échange.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Générer le QR', onPress: () => router.push(`/exchange/qr?conversationId=${id}`) },
      ],
    )
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === profile?.id
    const isSystem = item.type === 'system'

    if (isSystem) {
      return (
        <View style={styles.systemMsg}>
          <Text style={styles.systemMsgText}>{item.content}</Text>
        </View>
      )
    }

    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.content}</Text>
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {new Date(item.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>

        {/* Validate exchange bar */}
        <TouchableOpacity style={styles.validateBar} onPress={handleValidateExchange} activeOpacity={0.85}>
          <Text style={styles.validateBarText}>🤝 Vous êtes d'accord ? Valider l'échange</Text>
          <Text style={styles.validateBarArrow}>›</Text>
        </TouchableOpacity>

        <FlatList
          ref={flatListRef}
          data={convMessages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatEmoji}>👋</Text>
              <Text style={styles.emptyChatText}>Commencez la conversation !</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={text}
            onChangeText={setText}
            placeholder="Votre message…"
            placeholderTextColor={COLORS.textTertiary}
            multiline
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  validateBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary + '15', borderBottomWidth: 1, borderBottomColor: COLORS.primary + '30',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  validateBarText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  validateBarArrow: { fontSize: 20, color: COLORS.primary, fontWeight: '300' },
  messagesList: { padding: 16, gap: 8, flexGrow: 1 },
  msgRow: { alignItems: 'flex-start', marginVertical: 2 },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.surface,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  bubbleMe: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleOther: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  bubbleTextMe: { color: '#FFF' },
  bubbleTime: { fontSize: 11, color: COLORS.textTertiary, marginTop: 4, textAlign: 'right' },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  systemMsg: {
    alignSelf: 'center', backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 6, marginVertical: 8,
  },
  systemMsgText: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 8 },
  emptyChatEmoji: { fontSize: 48 },
  emptyChatText: { fontSize: 14, color: COLORS.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  textInput: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 22,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: COLORS.text,
    maxHeight: 120,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: COLORS.textTertiary },
  sendBtnText: { color: '#FFF', fontSize: 20, fontWeight: '700', lineHeight: 24 },
})
