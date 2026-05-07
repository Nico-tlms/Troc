'use client'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { Exchange } from '@/types'

function QRExchangeInner() {
  const router = useRouter()
  const params = useSearchParams()
  const exchangeId = params.get('exchangeId')
  const conversationId = params.get('conversationId')
  const { profile } = useAuth()

  const [exchange, setExchange] = useState<Exchange | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [scanInput, setScanInput] = useState('')
  const [mode, setMode] = useState<'show' | 'scan'>('show')

  useEffect(() => {
    if (exchangeId) loadExchange(exchangeId)
    else if (conversationId) createExchange(conversationId)
  }, [exchangeId, conversationId])

  async function loadExchange(id: string) {
    const { data } = await supabase.from('exchanges').select('*').eq('id', id).single()
    setExchange(data as Exchange)
    setLoading(false)
  }

  async function createExchange(convId: string) {
    if (!profile) return
    const { data: conv } = await supabase
      .from('conversations')
      .select('match_id, participant_ids')
      .eq('id', convId)
      .single()
    if (!conv?.match_id) {
      alert("Impossible de créer l'échange")
      router.back()
      return
    }
    const { data: existing } = await supabase
      .from('exchanges')
      .select('*')
      .eq('match_id', conv.match_id)
      .neq('status', 'cancelled')
      .maybeSingle()
    if (existing) {
      setExchange(existing as Exchange)
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('exchanges')
      .insert({
        match_id: conv.match_id,
        initiator_id: profile.id,
        participants: conv.participant_ids,
        qr_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()
    if (error) {
      alert(error.message)
      router.back()
      return
    }
    setExchange(data as Exchange)
    setLoading(false)
  }

  async function confirm() {
    if (!exchange || !profile) return
    setConfirming(true)
    try {
      if (exchange.confirmed_by.includes(profile.id)) {
        alert('Déjà confirmé')
        return
      }
      const newConfirmed = [...exchange.confirmed_by, profile.id]
      const allConfirmed = newConfirmed.length >= exchange.participants.length
      await supabase
        .from('exchanges')
        .update({
          confirmed_by: newConfirmed,
          status: allConfirmed ? 'completed' : 'confirmed',
          completed_at: allConfirmed ? new Date().toISOString() : null,
        })
        .eq('id', exchange.id)
      if (allConfirmed && exchange.match_id) {
        await supabase.from('matches').update({ status: 'completed' }).eq('id', exchange.match_id)
        if (confirm('🎉 Échange validé ! Laisser un avis ?')) {
          router.replace(`/review/${exchange.id}`)
        } else {
          router.replace('/home')
        }
      } else {
        alert('✅ Confirmation enregistrée. En attente de l\'autre participant.')
        router.back()
      }
    } finally { setConfirming(false) }
  }

  async function handleScan() {
    if (!scanInput.trim()) return
    const { data } = await supabase
      .from('exchanges')
      .select('*')
      .eq('qr_code', scanInput.trim())
      .single()
    if (!data) {
      alert('Code invalide')
      return
    }
    setExchange(data as Exchange)
    setMode('show')
  }

  if (loading) return <div className="p-10 text-center text-gray-400">Préparation…</div>
  if (!exchange) return <div className="p-10 text-center text-red-500">Échange introuvable</div>

  const myConfirmed = profile ? exchange.confirmed_by.includes(profile.id) : false
  const isExpired = exchange.qr_expires_at && new Date(exchange.qr_expires_at) < new Date()

  return (
    <div className="px-4 pt-6">
      <button onClick={() => router.back()} className="text-gray-500 mb-4">← Retour</button>

      <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode('show')}
          className={`py-2 rounded-lg text-sm font-bold ${mode === 'show' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
        >📲 Mon QR</button>
        <button
          onClick={() => setMode('scan')}
          className={`py-2 rounded-lg text-sm font-bold ${mode === 'scan' ? 'bg-white shadow-sm' : 'text-gray-500'}`}
        >📷 Scanner</button>
      </div>

      {mode === 'show' ? (
        <>
          <div className="card p-6 text-center mb-4">
            <div className="text-xs font-bold text-gray-400 mb-3">VOTRE CODE D'ÉCHANGE</div>
            {isExpired ? (
              <div>
                <div className="text-5xl mb-3">⏰</div>
                <div className="font-bold text-red-500">Code expiré</div>
              </div>
            ) : (
              <>
                <div className="text-7xl mb-3">⬛⬜⬛</div>
                <div className="font-mono text-2xl font-bold tracking-widest bg-gray-50 inline-block px-6 py-3 rounded-xl">
                  {exchange.qr_code.substring(0, 8).toUpperCase()}
                </div>
                {exchange.qr_expires_at && (
                  <div className="text-xs text-gray-500 mt-3">
                    Expire à {new Date(exchange.qr_expires_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card p-4 mb-4">
            <div className="text-sm font-bold mb-3">État de la confirmation</div>
            <div className="text-xs text-gray-600 mb-2">
              {exchange.confirmed_by.length} / {exchange.participants.length} participants ont confirmé
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-2 bg-green-500 transition-all"
                style={{ width: `${(exchange.confirmed_by.length / exchange.participants.length) * 100}%` }} />
            </div>
          </div>

          {myConfirmed ? (
            <div className="bg-green-50 p-4 rounded-xl text-center text-green-700 font-bold">
              ✅ Vous avez confirmé · En attente de l'autre partie
            </div>
          ) : (
            <button onClick={confirm} disabled={!!isExpired || confirming} className="btn-primary w-full">
              {confirming ? '...' : '✅ Confirmer l\'échange'}
            </button>
          )}
        </>
      ) : (
        <div>
          <div className="text-sm text-gray-600 mb-4">
            Demandez à votre partenaire son code, puis saisissez-le ici.
          </div>
          <input
            className="input mb-3 font-mono uppercase tracking-widest"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            placeholder="A1B2C3D4"
          />
          <button onClick={handleScan} className="btn-primary w-full">
            Valider le code
          </button>
        </div>
      )}
    </div>
  )
}

export default function QRExchangePage() {
  return <Suspense fallback={<div className="p-10 text-center">Chargement…</div>}>
    <QRExchangeInner />
  </Suspense>
}
