'use client'
import { useEffect, useRef, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/types'

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [matchId, setMatchId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    load()
    const channel = supabase
      .channel(`messages:${id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message]),
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [id])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function load() {
    const [msgs, conv] = await Promise.all([
      supabase.from('messages').select('*').eq('conversation_id', id).order('created_at', { ascending: true }),
      supabase.from('conversations').select('match_id').eq('id', id).single(),
    ])
    setMessages((msgs.data ?? []) as Message[])
    setMatchId(conv.data?.match_id ?? null)
    setLoading(false)
  }

  async function send(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !profile) return
    const text = input.trim()
    setInput('')
    await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: profile.id,
      content: text,
      type: 'text',
    })
  }

  async function startExchange() {
    router.push(`/exchange/qr?conversationId=${id}`)
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center gap-3 p-3 border-b border-gray-100 bg-white">
        <button onClick={() => router.back()} className="text-gray-500">← </button>
        <div className="flex-1">
          <div className="font-bold">Conversation</div>
        </div>
        {matchId && (
          <button onClick={startExchange} className="text-xs px-3 py-2 rounded-lg bg-primary-500 text-white font-bold">
            ✓ Valider l'échange
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-400">Chargement…</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-10">
            <div className="text-4xl mb-2">💬</div>
            <div>Démarrez la conversation</div>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === profile?.id
            const isSystem = m.type === 'system' || m.type === 'exchange_proposal'
            if (isSystem) {
              return (
                <div key={m.id} className="text-center my-2">
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {m.content}
                  </span>
                </div>
              )
            }
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] px-3 py-2 rounded-2xl ${
                  mine ? 'bg-primary-500 text-white rounded-br-md' : 'bg-white border border-gray-100 rounded-bl-md'
                }`}>
                  {m.content}
                </div>
              </div>
            )
          })
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 p-3 border-t border-gray-100 bg-white">
        <input
          className="input flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Votre message…"
        />
        <button type="submit" className="btn-primary">→</button>
      </form>
    </div>
  )
}
