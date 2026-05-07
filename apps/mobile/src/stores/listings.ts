import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Listing, CreateListingPayload } from '@/types'

interface ListingsState {
  myListings: Listing[]
  loading: boolean
  loadMyListings: (userId: string) => Promise<void>
  createListing: (payload: CreateListingPayload) => Promise<Listing>
  updateListing: (id: string, updates: Partial<Listing>) => Promise<void>
  deleteListing: (id: string) => Promise<void>
  archiveListing: (id: string) => Promise<void>
}

export const useListingsStore = create<ListingsState>((set, get) => ({
  myListings: [],
  loading: false,

  loadMyListings: async (userId: string) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profile:profiles(*),
          propose_category:categories!propose_category_id(*),
          search_category:categories!search_category_id(*)
        `)
        .eq('user_id', userId)
        .neq('status', 'removed')
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ myListings: (data as Listing[]) ?? [] })
    } finally {
      set({ loading: false })
    }
  },

  createListing: async (payload: CreateListingPayload) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { data, error } = await supabase
      .from('listings')
      .insert({
        ...payload,
        user_id: user.id,
        status: 'active',
        propose_images: payload.propose_images ?? [],
        search_keywords: payload.search_keywords ?? [],
        max_distance_km: payload.max_distance_km ?? 50,
      })
      .select()
      .single()

    if (error) throw error

    const newListing = data as Listing
    set((state) => ({
      myListings: [newListing, ...state.myListings],
    }))
    return newListing
  },

  updateListing: async (id: string, updates: Partial<Listing>) => {
    const { data, error } = await supabase
      .from('listings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    set((state) => ({
      myListings: state.myListings.map((l) =>
        l.id === id ? { ...l, ...(data as Listing) } : l
      ),
    }))
  },

  deleteListing: async (id: string) => {
    const { error } = await supabase
      .from('listings')
      .update({ status: 'removed' })
      .eq('id', id)

    if (error) throw error

    set((state) => ({
      myListings: state.myListings.filter((l) => l.id !== id),
    }))
  },

  archiveListing: async (id: string) => {
    await get().updateListing(id, { status: 'archived' })
  },
}))
