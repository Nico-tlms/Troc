'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { STATUS_LABELS } from '@/lib/constants'
import type { Listing } from '@/types'

export default function MyListingsPage() {
  const { profile } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [profile?.id])

  async function load() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', profile.id)
      .neq('status', 'removed')
      .order('created_at', { ascending: false })
    setListings((data ?? []) as Listing[])
    setLoading(false)
  }

  async function archive(id: string) {
    if (!confirm('Archiver cette annonce ?')) return
    await supabase.from('listings').update({ status: 'archived' }).eq('id', id)
    load()
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-extrabold">Mes annonces</h1>
        <Link href="/listing/create" className="btn-primary">+ Nouvelle</Link>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Chargement…</div>
      ) : listings.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-2">📋</div>
          <div className="font-bold mb-1">Aucune annonce</div>
          <div className="text-sm text-gray-500">Créez-en une pour commencer à matcher</div>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="card p-4">
              <Link href={`/listing/${l.id}`} className="block">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 font-semibold">
                    {STATUS_LABELS[l.status] ?? l.status}
                  </span>
                  <span className="text-xs text-gray-400">{new Date(l.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] font-bold text-primary-500">JE PROPOSE</div>
                    <div className="text-sm font-semibold">{l.propose_title}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-secondary-500">JE CHERCHE</div>
                    <div className="text-sm font-semibold">{l.search_title}</div>
                  </div>
                </div>
              </Link>
              {l.status !== 'archived' && (
                <button onClick={() => archive(l.id)} className="text-xs text-red-500 mt-2">
                  Archiver
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
