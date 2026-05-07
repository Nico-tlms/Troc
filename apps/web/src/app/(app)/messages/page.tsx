'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

interface ConversationRow {
  id: string
  participant_ids: string[]
  last_message_at: string | null
  match_id: string | null
}

export default function MessagesPage() {
  const { profile } = useAuth()
  const [convs, setConvs] = useState<Array<ConversationRow & { other?: { username: string; display_name: string | null } }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [profile?.id])

  async function load() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [profile.id])
      .order('last_message_at', { ascending: false, nullsFirst: false })

    if (!data) { setLoading(false); return }

    // Fetch other profiles
    const otherIds = (data as ConversationRow[]).map((c) =>
      c.participant_ids.find((id) => id !== profile.id)
    ).filter(Boolean) as string[]

    if (otherIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', otherIds)
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))
      setConvs((data as ConversationRow[]).map((c) => ({
        ...c,
        other: profileMap.get(c.participant_ids.find((id) => id !== profile.id) ?? ''),
      })))
    } else {
      setConvs(data as ConversationRow[])
    }
    setLoading(false)
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="text-2xl font-extrabold mb-5">Messages</h1>
      {loading ? (
        <div className="text-center py-10 text-gray-400">Chargement…</div>
      ) : convs.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-2">💬</div>
          <div className="font-bold mb-1">Aucune conversation</div>
          <div className="text-sm text-gray-500">Acceptez un match pour démarrer un chat</div>
        </div>
      ) : (
        <div className="space-y-2">
          {convs.map((c) => (
            <Link key={c.id} href={`/chat/${c.id}`} className="card p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-600">
                {(c.other?.display_name ?? c.other?.username ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{c.other?.display_name ?? c.other?.username ?? 'Inconnu'}</div>
                <div className="text-xs text-gray-500">
                  {c.last_message_at ? new Date(c.last_message_at).toLocaleDateString('fr-FR') : 'Pas encore de messages'}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
