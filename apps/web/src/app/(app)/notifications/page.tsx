'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'

const ICONS: Record<string, string> = {
  new_match: '🎯', new_chain_match: '🔄', message: '💬',
  exchange_request: '🤝', exchange_completed: '🎉', review_received: '⭐',
}

export default function NotificationsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    load()
    const channel = supabase
      .channel(`notif:${profile.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (p) => setNotifs((prev) => [p.new as Notification, ...prev]),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile?.id])

  async function load() {
    if (!profile?.id) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotifs((data ?? []) as Notification[])
    setLoading(false)
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false)
  }

  function format(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    if (diff < 60_000) return "à l'instant"
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h`
    return new Date(iso).toLocaleDateString('fr-FR')
  }

  function go(n: Notification) {
    const data = n.data as Record<string, string> | null
    if (!data) return
    if (n.type === 'new_match' && data.match_id) router.push(`/match/${data.match_id}`)
    else if (n.type === 'message' && data.conversation_id) router.push(`/chat/${data.conversation_id}`)
  }

  return (
    <div className="px-4 pt-6">
      <button onClick={() => router.back()} className="text-gray-500 mb-4">← Retour</button>
      <h1 className="text-2xl font-extrabold mb-5">Notifications</h1>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Chargement…</div>
      ) : notifs.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-2">🔕</div>
          <div className="font-bold mb-1">Aucune notification</div>
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <button key={n.id} onClick={() => go(n)} className={`card p-3 w-full text-left flex gap-3 ${!n.read ? 'bg-primary-50/50' : ''}`}>
              <div className="text-2xl">{ICONS[n.type] ?? '🔔'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{n.title}</div>
                {n.body && <div className="text-sm text-gray-600">{n.body}</div>}
                <div className="text-xs text-gray-400 mt-1">{format(n.created_at)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
