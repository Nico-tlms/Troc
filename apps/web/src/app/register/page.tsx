'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp, loading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '', city: '' })
  const [error, setError] = useState('')

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    try {
      await signUp({
        email: form.email,
        password: form.password,
        username: form.username,
        displayName: form.displayName || form.username,
        city: form.city || undefined,
      })
      router.replace('/home')
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="text-center mb-8 mt-6">
        <div className="text-5xl mb-3">⇄</div>
        <h1 className="text-2xl font-extrabold text-gray-900">Créer un compte</h1>
        <p className="text-sm text-gray-500 mt-1">Commencez à échanger en quelques secondes</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="vous@email.com" />
        </div>
        <div>
          <label className="label">Mot de passe</label>
          <input className="input" type="password" required minLength={6} value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="6 caractères minimum" />
        </div>
        <div>
          <label className="label">Nom d'utilisateur</label>
          <input className="input" required value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="monpseudo" />
        </div>
        <div>
          <label className="label">Nom d'affichage</label>
          <input className="input" required value={form.displayName} onChange={(e) => set('displayName', e.target.value)} placeholder="Marie Dupont" />
        </div>
        <div>
          <label className="label">Ville (optionnel)</label>
          <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Paris" />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        Déjà un compte ?{' '}
        <Link href="/login" className="text-primary-500 font-semibold">Se connecter</Link>
      </div>
    </div>
  )
}
