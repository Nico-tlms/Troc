'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'

export default function HomeRedirect() {
  const router = useRouter()
  const { user, initialized, init } = useAuth()

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (!initialized) return
    if (user) router.replace('/home')
    else router.replace('/login')
  }, [user, initialized, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">⇄</div>
        <div className="text-2xl font-bold text-primary-500">Troc</div>
        <div className="text-sm text-gray-400 mt-2">Chargement…</div>
      </div>
    </div>
  )
}
