'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { CONDITION_LABELS } from '@/lib/constants'
import type { Listing } from '@/types'

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { profile } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [proposing, setProposing] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    const { data } = await supabase
      .from('listings')
      .select('*, profile:profiles(*)')
      .eq('id', id)
      .single()
    setListing(data as Listing)
    setLoading(false)
  }

  async function proposeExchange() {
    if (!profile || !listing) return
    if (profile.id === listing.user_id) {
      alert('Vous ne pouvez pas échanger avec vous-même')
      return
    }
    setProposing(true)
    try {
      const { data: conv, error } = await supabase
        .from('conversations')
        .insert({ participant_ids: [profile.id, listing.user_id] })
        .select()
        .single()
      if (error) throw error
      await supabase.from('messages').insert({
        conversation_id: conv.id,
        sender_id: profile.id,
        type: 'exchange_proposal',
        content: `💡 ${profile.display_name ?? profile.username} s'intéresse à "${listing.propose_title}"`,
      })
      router.push(`/chat/${conv.id}`)
    } catch (e) {
      alert((e as Error).message)
      setProposing(false)
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Chargement…</div>
  if (!listing) return <div className="p-10 text-center text-red-500">Annonce introuvable</div>

  const isOwner = profile?.id === listing.user_id
  const owner = listing.profile as { display_name?: string; username: string; reputation_score: number; exchange_count: number; city?: string } | undefined

  return (
    <div className="px-4 pt-6">
      <button onClick={() => router.back()} className="text-gray-500 mb-4">← Retour</button>

      <div className="card p-4 border-l-4 border-primary-500 mb-3">
        <div className="text-xs font-bold text-primary-500 mb-1">🟦 JE PROPOSE</div>
        <h1 className="text-xl font-bold mb-2">{listing.propose_title}</h1>
        {listing.propose_description && <p className="text-sm text-gray-600 mb-2">{listing.propose_description}</p>}
        <div className="flex flex-wrap gap-2 mt-2">
          {listing.propose_condition && (
            <span className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-600 font-semibold">
              {CONDITION_LABELS[listing.propose_condition]}
            </span>
          )}
          {listing.propose_estimated_value && (
            <span className="text-xs px-2 py-1 rounded bg-primary-50 text-primary-600 font-semibold">
              ~{(listing.propose_estimated_value / 100).toFixed(0)} €
            </span>
          )}
        </div>
      </div>

      <div className="card p-4 border-l-4 border-secondary-500 mb-3">
        <div className="text-xs font-bold text-secondary-500 mb-1">🟥 JE RECHERCHE</div>
        <h2 className="text-lg font-bold mb-2">{listing.search_title}</h2>
        {listing.search_description && <p className="text-sm text-gray-600 mb-2">{listing.search_description}</p>}
        {listing.search_value_min != null && listing.search_value_max != null && (
          <span className="text-xs px-2 py-1 rounded bg-secondary-50 text-secondary-500 font-semibold">
            {(listing.search_value_min / 100).toFixed(0)}–{(listing.search_value_max / 100).toFixed(0)} €
          </span>
        )}
      </div>

      {listing.location_city && (
        <div className="text-sm text-gray-600 mb-4">📍 {listing.location_city} · {listing.max_distance_km} km</div>
      )}

      {owner && (
        <div className="card p-3 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
            {(owner.display_name ?? owner.username).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold">{owner.display_name ?? owner.username}</div>
            <div className="text-xs text-gray-500">
              ⭐ {owner.reputation_score.toFixed(1)} · {owner.exchange_count} échange{owner.exchange_count !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {!isOwner && listing.status === 'active' && (
        <button onClick={proposeExchange} disabled={proposing} className="btn-primary w-full">
          {proposing ? 'En cours…' : '🤝 Proposer un échange'}
        </button>
      )}
    </div>
  )
}
