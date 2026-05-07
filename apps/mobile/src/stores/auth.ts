import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (params: {
    email: string
    password: string
    username: string
    displayName: string
    city?: string
  }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  loadProfile: (userId: string) => Promise<void>
  setSession: (session: Session | null) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,

  setSession: (session) => {
    set({ session, user: session?.user ?? null })
    if (session?.user) {
      get().loadProfile(session.user.id)
    } else {
      set({ profile: null })
    }
  },

  loadProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error loading profile:', error)
      return
    }
    set({ profile: data as Profile })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      set({ session: data.session, user: data.user })
      if (data.user) {
        await get().loadProfile(data.user.id)
      }
    } finally {
      set({ loading: false })
    }
  },

  signUp: async ({ email, password, username, displayName, city }) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) throw error

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          display_name: displayName,
          city: city ?? null,
          phone_verified: false,
          id_verified: false,
          reputation_score: 0,
          exchange_count: 0,
        })
        if (profileError) throw profileError

        set({ session: data.session, user: data.user })
        await get().loadProfile(data.user.id)
      }
    } finally {
      set({ loading: false })
    }
  },

  signOut: async () => {
    set({ loading: true })
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null, session: null })
    } finally {
      set({ loading: false })
    }
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) throw new Error('Non authentifié')

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    set({ profile: data as Profile })
  },
}))
