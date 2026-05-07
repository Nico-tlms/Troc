'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { Match, ChainMatch, Listing } from '@/types'

export default function HomePage() {
  const { profile } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [chains, setChains] = useState<ChainMatch[]>([])
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    if (!profile?.id) return
    const [matchesRes, chainRes, listingsRes] = await Promise.all([
      supabase
        .from('matches')
        .select(`*,
          listing_a:listings!listing_a_id(*, profile:profiles(*)),
          listing_b:listings!listing_b_id(*, profile:profiles(*))
        `)
        .or(`user_a_id.eq.${profile.id},user_b_id.eq.${profile.id}`)
        .neq('status', 'rejected')
        .order('created_at', { ascending: false }),
      supabase
        .from('chain_matches')
        .select('*')
        .contains('user_ids', [profile.id])
        .neq('status', 'rejected')
        .order('created_at', { ascending: false }),
      supabase
        .from('listings')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'active'),
    ])
    setMatches((matchesRes.data ?? []) as Match[])
    setChains((chainRes.data ?? []) as ChainMatch[])
    setMyListings((listingsRes.data ?? []) as Listing[])
    setLoading(false)
  }, [profile?.id])

  useEffect(() => { load() }, [load])

  async function triggerMatching() {
    if (!profile?.id) return
    setRefreshing(true)
    try {
      // Trigger backend matching for each of my active listings
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      for (const listing of myListings) {
        await fetch(`${url}/functions/v1/matching-engine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({ listing_id: listing.id }),
        }).catch(() => null)
      }
      await load()
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Bonjour{profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-500">Trouvez votre prochain échange</p>
        </div>
        <Link href="/notifications" className="btn-ghost text-2xl">🔔</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="card p-3 text-center">
          <div className="text-xl font-bold">{myListings.length}</div>
          <div className="text-[10px] text-gray-500">Annonces</div>
        </div>
        <div className="card p-3 text-center bg-primary-500 border-primary-500">
          <div className="text-xl font-bold text-white">{matches.length}</div>
          <div className="text-[10px] text-white/80">Matchs</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-xl font-bold">{chains.length}</div>
          <div className="text-[10px] text-gray-500">Chaînes</div>
        </div>
      </div>

      {/* Refresh button */}
      <button
        onClick={triggerMatching}
        disabled={refreshing}
        className="btn-secondary w-full mb-5"
      >
        {refreshing ? 'Recherche en cours…' : '🔄 Relancer le matching'}
      </button>

      {/* My listings */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-bold text-gray-800">Mes annonces actives</h2>
        <Link href="/listing/create" className="text-sm font-semibold text-primary-500">+ Nouvelle</Link>
      </div>

      {myListings.length === 0 ? (
        <Link href="/listing/create" className="block card p-6 text-center border-2 border-dashed border-primary-200 mb-6">
          <div className="text-4xl mb-2">✨</div>
          <div className="font-bold mb-1">Créez votre première annonce</div>
          <div className="text-sm text-gray-500">Déclarez ce que vous proposez et ce que vous cherchez</div>
        </Link>
      ) : (
        <div className="space-y-2 mb-6">
          {myListings.map((l) => (
            <Link key={l.id} href={`/listing/${l.id}`} className="card p-3 flex justify-between items-center">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-primary-500">JE PROPOSE</div>
                <div className="text-sm font-semibold truncate">{l.propose_title}</div>
                <div className="text-[10px] font-bold text-secondary-500 mt-1">JE CHERCHE</div>
                <div className="text-sm font-semibold truncate">{l.search_title}</div>
              </div>
              <span className="text-2xl ml-2">⇄</span>
            </Link>
          ))}
        </div>
      )}

      {/* Bilateral matches */}
      <h2 className="font-bold text-gray-800 mb-3">Matchs bilatéraux ({matches.length})</h2>
      {loading ? (
        <div className="text-center py-6 text-gray-400">Chargement…</div>
      ) : matches.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          Aucun match pour l'instant. Cliquez sur "Relancer le matching" ou créez plus d'annonces.
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {matches.map((m) => {
            const isUserA = profile?.id === m.user_a_id
            const myListing = isUserA ? m.listing_a : m.listing_b
            const theirListing = isUserA ? m.listing_b : m.listing_a
            return (
              <Link key={m.id} href={`/match/${m.id}`} className="card p-3 block">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold bg-primary-50 text-primary-600 px-2 py-1 rounded-full">
                    Score {Math.round(m.match_score)}%
                  </span>
                  <span className="text-xs text-gray-400">{m.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-primary-50 p-2 rounded-lg">
                    <div className="text-[9px] font-bold">VOUS DONNEZ</div>
                    <div className="text-xs font-semibold truncate">{myListing?.propose_title}</div>
                  </div>
                  <div className="bg-secondary-50 p-2 rounded-lg">
                    <div className="text-[9px] font-bold">VOUS RECEVEZ</div>
                    <div className="text-xs font-semibold truncate">{theirListing?.propose_title}</div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Chain matches */}
      {chains.length > 0 && (
        <>
          <h2 className="font-bold text-gray-800 mb-3">🔄 Échanges en chaîne</h2>
          <div className="bg-secondary-50 p-3 rounded-xl mb-3 text-sm text-gray-600">
            Notre algorithme a détecté des boucles d'échange où chacun donne et reçoit.
          </div>
          <div className="space-y-2">
            {chains.map((c) => (
              <Link key={c.id} href={`/match/chain-${c.id}`} className="card p-3 block border-l-4 border-secondary-500">
                <div className="font-bold">🔄 Échange à {c.chain_length} participants</div>
                <div className="text-xs text-gray-500 mt-1">
                  {c.accepted_by.length}/{c.chain_length} ont accepté
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
