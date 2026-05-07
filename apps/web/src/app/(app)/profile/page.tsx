'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
  const router = useRouter()
  const { profile, signOut, updateProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ display_name: '', city: '', bio: '' })
  const [reviewCount, setReviewCount] = useState(0)

  useEffect(() => {
    if (profile) setForm({ display_name: profile.display_name ?? '', city: profile.city ?? '', bio: profile.bio ?? '' })
  }, [profile])

  useEffect(() => {
    if (!profile?.id) return
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('reviewee_id', profile.id)
      .then(({ count }) => setReviewCount(count ?? 0))
  }, [profile?.id])

  async function save() {
    try {
      await updateProfile(form)
      setEditing(false)
    } catch (e) {
      alert((e as Error).message)
    }
  }

  async function handleSignOut() {
    await signOut()
    router.replace('/login')
  }

  if (!profile) return <div className="p-10 text-center text-gray-400">Chargement…</div>

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-extrabold mb-5">Mon profil</h1>

      {/* Avatar + name */}
      <div className="card p-6 text-center mb-4">
        <div className="w-24 h-24 mx-auto rounded-full bg-primary-100 flex items-center justify-center text-3xl font-bold text-primary-600 mb-3">
          {(profile.display_name ?? profile.username).charAt(0).toUpperCase()}
        </div>
        <div className="font-bold text-xl">{profile.display_name ?? profile.username}</div>
        <div className="text-sm text-gray-500">@{profile.username}</div>
        {profile.city && <div className="text-sm text-gray-500 mt-1">📍 {profile.city}</div>}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="card p-3 text-center">
          <div className="text-xl font-bold text-primary-500">{profile.reputation_score?.toFixed(1) ?? '—'}</div>
          <div className="text-[10px] text-gray-500">Note</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-xl font-bold">{profile.exchange_count ?? 0}</div>
          <div className="text-[10px] text-gray-500">Échanges</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-xl font-bold">{reviewCount}</div>
          <div className="text-[10px] text-gray-500">Avis</div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-6">
        {profile.phone_verified && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700 font-semibold">✓ Téléphone</span>
        )}
        {profile.id_verified && (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">✓ Identité</span>
        )}
      </div>

      {editing ? (
        <div className="card p-4 mb-4 space-y-3">
          <div>
            <label className="label">Nom d'affichage</label>
            <input className="input" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Ville</label>
            <input className="input" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={save} className="btn-primary flex-1">Enregistrer</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setEditing(true)} className="btn-secondary w-full mb-4">
          ✏️ Modifier mon profil
        </button>
      )}

      <button onClick={handleSignOut} className="w-full py-3 rounded-xl bg-red-50 text-red-600 font-semibold">
        🚪 Se déconnecter
      </button>
    </div>
  )
}
