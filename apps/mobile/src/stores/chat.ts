import { create } from 'zustand'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Conversation, Message } from '@troc/types'

interface ChatState {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  unreadCount: number
  loading: boolean
  activeChannel: RealtimeChannel | null
  loadConversations: (userId: string) => Promise<void>
  loadMessages: (conversationId: string) => Promise<void>
  sendMessage: (params: {
    conversationId: string
    content?: string
    imageUrl?: string
    type?: Message['type']
  }) => Promise<void>
  markRead: (conversationId: string) => void
  subscribeToConversation: (conversationId: string) => () => void
  countUnread: (userId: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  unreadCount: 0,
  loading: false,
  activeChannel: null,

  loadConversations: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          match:matches(
            *,
            listing_a:listings!listing_a_id(*),
            listing_b:listings!listing_b_id(*),
            user_a:profiles!user_a_id(*),
            user_b:profiles!user_b_id(*)
          ),
          last_message:messages(content, type, created_at, sender_id)
        `)
        .contains('participant_ids', [userId])
        .order('last_message_at', { ascending: false, nullsFirst: false })

      if (error) throw error

      // Enrich with other participant info
      const convos: Conversation[] = []
      for (const raw of (data ?? []) as Conversation[]) {
        const otherUserId = raw.participant_ids.find((pid) => pid !== userId)
        let otherParticipant = undefined
        if (otherUserId) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherUserId)
            .single()
          otherParticipant = profileData ?? undefined
        }
        convos.push({ ...raw, other_participant: otherParticipant })
      }

      set({ conversations: convos })
    } finally {
      set({ loading: false })
    }
  },

  loadMessages: async (conversationId: string) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sender:profiles(*)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error

    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: (data as Message[]) ?? [],
      },
    }))
  },

  sendMessage: async ({ conversationId, content, imageUrl, type = 'text' }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content ?? null,
        image_url: imageUrl ?? null,
        type,
      })
      .select('*, sender:profiles(*)')
      .single()

    if (error) throw error

    const newMessage = data as Message
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: [...(state.messages[conversationId] ?? []), newMessage],
      },
    }))

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: newMessage.created_at })
      .eq('id', conversationId)
  },

  markRead: (conversationId: string) => {
    // Could track read status per conversation in a separate table
    // For now, update local unread count
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    }))
  },

  subscribeToConversation: (conversationId: string) => {
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message
          // Fetch sender info
          const { data: senderData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single()

          const enriched: Message = { ...newMsg, sender: senderData ?? undefined }

          set((state) => {
            const existing = state.messages[conversationId] ?? []
            const alreadyExists = existing.some((m) => m.id === enriched.id)
            if (alreadyExists) return state
            return {
              messages: {
                ...state.messages,
                [conversationId]: [...existing, enriched],
              },
            }
          })
        }
      )
      .subscribe()

    set({ activeChannel: channel })

    return () => {
      supabase.removeChannel(channel)
    }
  },

  countUnread: async (userId: string) => {
    // Simple heuristic: count conversations with recent messages
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .contains('participant_ids', [userId])
      .not('last_message_at', 'is', null)

    set({ unreadCount: count ?? 0 })
  },
}))
