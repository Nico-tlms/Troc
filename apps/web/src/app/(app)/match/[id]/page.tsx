'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { Match, ChainMatch } from '@/types'

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { profile } = useAuth()
  const isChain = id.startsWith('chain-')
  const realId = isChain ? id.replace('chain-', '') : id

  const [match, setMatch] = useState<Match | null>(null)
  const [chain, setChain] = useState<ChainMatch | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => { load() }, [realId])

  async function load() {
    if (isChain) {
      const { data } = await supabase
        .from('chain_matches')
        .select('*')
        .eq('id', realId)
        .single()
      setChain(data as ChainMatch)
    } else {
      const { data } = await supabase
        .from('matches')
        .select(`*,
          listing_a:listings!listing_a_id(*, profile:profiles(*)),
          listing_b:listings!listing_b_id(*, profile:profiles(*))
        `)
        .eq('id', realId)
        .single()
      setMatch(data as Match)
    }
    setLoading(false)
  }

  async function accept() {
    if (!match) return
    setActing(true)
    try {
      await supabase.from('matches').update({ status: 'accepted' }).eq('id', match.id)
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .eq('match_id', match.id)
        .maybeSingle()
      let convId = existing?.id
      if (!convId) {
        const { data } = await supabase
          .from('conversations')
          .insert({ match_id: match.id, participant_ids: [match.user_a_id, match.user_b_id] })
          .select()
          .single()
        convId = data?.id
      }
      if (convId) router.replace(`/chat/${convId}`)
    } finally { setActing(false) }
  }

  async function reject() {
    if (!match || !confirm('Refuser ce match ?')) return
    setActing(true)
    await supabase.from('matches').update({ status: 'rejected' }).eq('id', match.id)
    router.back()
  }

  async function acceptChain() {
    if (!chain || !profile) return
    setActing(true)
    if (!chain.accepted_by.includes(profile.id)) {
      await supabase
        .from('chain_matches')
        .update({ accepted_by: [...chain.accepted_by, profile.id] })
        .eq('id', chain.id)
    }
    alert('✅ Vous avez accepté cet échange en chaîne')
    router.back()
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Chargement…</div>

  if (isChain && chain) {
    const myAccepted = profile ? chain.accepted_by.includes(profile.id) : false
    return (
      <div className="px-4 pt-6">
        <button onClick={() => router.back()} className="text-gray-500 mb-4">← Retour</button>
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">🔄</div>
          <h1 className="text-2xl font-extrabold">Échange en chaîne</h1>
          <p className="text-sm text-gray-500">{chain.chain_length} participants · chacun donne et reçoit</p>
        </div>
        <div className="bg-primary-50 p-4 rounded-xl mb-4 text-sm text-gray-700">
          Notre algorithme a détecté une boucle d'échange où chaque participant cède un objet et en reçoit un autre.
        </div>
        <div className="card p-4 mb-4">
          <div className="text-sm font-semibold text-gray-700 mb-2">Progression</div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-3 bg-primary-500 transition-all"
              style={{ width: `${(chain.accepted_by.length / chain.chain_length) * 100}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-2">
            {chain.accepted_by.length} / {chain.chain_length} participants ont accepté
          </div>
        </div>
        {myAccepted ? (
          <div className="bg-green-50 p-4 rounded-xl text-center text-green-700 font-semibold">
            ✅ Vous avez déjà accepté
          </div>
        ) : (
          <button onClick={acceptChain} disabled={acting} className="btn-primary w-full">
            {acting ? '...' : '✅ Accepter cet échange'}
          </button>
        )}
      </div>
    )
  }

  if (!match) return <div className="p-10 text-center text-red-500">Match introuvable</div>

  const isUserA = profile?.id === match.user_a_id
  const myListing = isUserA ? match.listing_a : match.listing_b
  const theirListing = isUserA ? match.listing_b : match.listing_a
  const theirProfile = (isUserA ? match.listing_b?.profile : match.listing_a?.profile) as { display_name?: string; username: string; reputation_score: number; exchange_count: number } | undefined

  return (
    <div className="px-4 pt-6">
      <button onClick={() => router.back()} className="text-gray-500 mb-4">← Retour</button>

      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs px-3 py-1 rounded-full bg-primary-50 text-primary-600 font-bold">
          ⚡ Score {Math.round(match.match_score)}%
        </span>
        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 font-semibold">{match.status}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="card p-3 border-t-4 border-primary-500">
          <div className="text-[9px] font-bold text-gray-400 mb-1">VOUS DONNEZ</div>
          <div className="text-sm font-bold mb-2">{myListing?.propose_title}</div>
          {myListing?.propose_estimated_value && (
            <div className="text-xs text-primary-500 font-semibold">
              ~{(myListing.propose_estimated_value / 100).toFixed(0)} €
            </div>
          )}
        </div>
        <div className="card p-3 border-t-4 border-secondary-500">
          <div className="text-[9px] font-bold text-gray-400 mb-1">VOUS RECEVEZ</div>
          <div className="text-sm font-bold mb-2">{theirListing?.propose_title}</div>
          {theirListing?.propose_estimated_value && (
            <div className="text-xs text-secondary-500 font-semibold">
              ~{(theirListing.propose_estimated_value / 100).toFixed(0)} €
            </div>
          )}
        </div>
      </div>

      {theirProfile && (
        <div className="card p-3 mb-6 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
            {(theirProfile.display_name ?? theirProfile.username).charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-bold">{theirProfile.display_name ?? theirProfile.username}</div>
            <div className="text-xs text-gray-500">
              ⭐ {theirProfile.reputation_score.toFixed(1)} · {theirProfile.exchange_count} échanges
            </div>
          </div>
        </div>
      )}

      {match.status === 'pending' && (
        <div className="grid grid-cols-3 gap-2">
          <button onClick={reject} disabled={acting} className="col-span-1 py-3 rounded-xl border-2 border-red-500 text-red-500 font-bold">
            ✕ Refuser
          </button>
          <button onClick={accept} disabled={acting} className="col-span-2 btn-primary">
            {acting ? '...' : '✓ Accepter · Chat'}
          </button>
        </div>
      )}

      {match.status === 'accepted' && (
        <button onClick={async () => {
          const { data } = await supabase.from('conversations').select('id').eq('match_id', match.id).single()
          if (data) router.push(`/chat/${data.id}`)
        }} className="btn-primary w-full">
          💬 Ouvrir le chat
        </button>
      )}
    </div>
  )
}
