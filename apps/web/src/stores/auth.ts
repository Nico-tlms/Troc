'use client'
import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  initialized: boolean
  init: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (params: { email: string; password: string; username: string; displayName: string; city?: string }) => Promise<void>
  signOut: () => Promise<void>
  loadProfile: (id: string) => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: false,
  initialized: false,

  init: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      set({ session: data.session, user: data.session.user })
      await get().loadProfile(data.session.user.id)
    }
    set({ initialized: true })
    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null })
      if (session?.user) await get().loadProfile(session.user.id)
      else set({ profile: null })
    })
  },

  loadProfile: async (id) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single()
    if (data) set({ profile: data as Profile })
  },

  signIn: async (email, password) => {
    set({ loading: true })
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } finally { set({ loading: false }) }
  },

  signUp: async ({ email, password, username, displayName, city }) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { username, display_name: displayName } },
      })
      if (error) throw error
      if (data.user) {
        // Profile auto-created by trigger; just update with city
        if (city) {
          await supabase.from('profiles').update({ city, display_name: displayName }).eq('id', data.user.id)
        }
        await get().loadProfile(data.user.id)
      }
    } finally { set({ loading: false }) }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null, profile: null, session: null })
  },

  updateProfile: async (updates) => {
    const { user } = get()
    if (!user) return
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single()
    if (error) throw error
    set({ profile: data as Profile })
  },
}))
