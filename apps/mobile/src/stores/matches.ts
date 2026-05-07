import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Match, ChainMatch } from '@/types'

interface MatchesState {
  matches: Match[]
  chainMatches: ChainMatch[]
  loading: boolean
  loadMatches: (userId: string) => Promise<void>
  triggerMatching: (userId: string) => Promise<void>
  acceptMatch: (matchId: string) => Promise<void>
  rejectMatch: (matchId: string) => Promise<void>
}

export const useMatchesStore = create<MatchesState>((set) => ({
  matches: [],
  chainMatches: [],
  loading: false,

  loadMatches: async (userId: string) => {
    set({ loading: true })
    try {
      const [matchesRes, chainRes] = await Promise.all([
        supabase
          .from('matches')
          .select(`
            *,
            listing_a:listings!listing_a_id(
              *,
              profile:profiles(*),
              propose_category:categories!propose_category_id(*),
              search_category:categories!search_category_id(*)
            ),
            listing_b:listings!listing_b_id(
              *,
              profile:profiles(*),
              propose_category:categories!propose_category_id(*),
              search_category:categories!search_category_id(*)
            ),
            user_a:profiles!user_a_id(*),
            user_b:profiles!user_b_id(*)
          `)
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
          .neq('status', 'rejected')
          .order('created_at', { ascending: false }),

        supabase
          .from('chain_matches')
          .select(`
            *,
            listings:listings(*),
            users:profiles(*)
          `)
          .contains('user_ids', [userId])
          .neq('status', 'rejected')
          .order('created_at', { ascending: false }),
      ])

      if (matchesRes.error) throw matchesRes.error
      if (chainRes.error) throw chainRes.error

      set({
        matches: (matchesRes.data as Match[]) ?? [],
        chainMatches: (chainRes.data as ChainMatch[]) ?? [],
      })
    } finally {
      set({ loading: false })
    }
  },

  triggerMatching: async (userId: string) => {
    // Call a Supabase Edge Function or RPC to trigger the matching engine
    const { error } = await supabase.rpc('trigger_matching', { p_user_id: userId })
    if (error) {
      console.warn('Matching engine error (non-blocking):', error.message)
    }
  },

  acceptMatch: async (matchId: string) => {
    const { data, error } = await supabase
      .from('matches')
      .update({ status: 'accepted' })
      .eq('id', matchId)
      .select()
      .single()

    if (error) throw error

    set((state) => ({
      matches: state.matches.map((m) =>
        m.id === matchId ? { ...m, status: 'accepted' } : m
      ),
    }))

    return data
  },

  rejectMatch: async (matchId: string) => {
    const { error } = await supabase
      .from('matches')
      .update({ status: 'rejected' })
      .eq('id', matchId)

    if (error) throw error

    set((state) => ({
      matches: state.matches.filter((m) => m.id !== matchId),
    }))
  },
}))
