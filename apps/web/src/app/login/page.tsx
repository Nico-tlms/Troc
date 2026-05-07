'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'

export default function LoginPage() {
  const router = useRouter()
  const { signIn, loading, user, init, initialized } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { init() }, [init])
  useEffect(() => { if (initialized && user) router.replace('/home') }, [user, initialized, router])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await signIn(email, password)
      router.replace('/home')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen p-6 flex flex-col justify-center">
      <div className="text-center mb-10">
        <div className="text-6xl mb-3">⇄</div>
        <h1 className="text-3xl font-extrabold text-primary-500">Troc</h1>
        <p className="text-sm text-gray-500 mt-2">Échangez sans dépenser</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        Pas encore de compte ?{' '}
        <Link href="/register" className="text-primary-500 font-semibold">S'inscrire</Link>
      </div>
    </div>
  )
}
