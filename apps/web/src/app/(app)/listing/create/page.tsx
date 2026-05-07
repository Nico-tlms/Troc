'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/stores/auth'
import { supabase } from '@/lib/supabase'
import { CATEGORIES, CONDITION_LABELS, CONDITION_OPTIONS } from '@/lib/constants'
import type { ItemCondition } from '@/types'

export default function CreateListingPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [propose, setPropose] = useState({
    title: '', description: '', categoryId: '', condition: 'good' as ItemCondition, value: '',
  })
  const [search, setSearch] = useState({
    title: '', description: '', categoryId: '', conditionMin: 'fair' as ItemCondition,
    valueMin: '', valueMax: '', keywords: '',
  })
  const [city, setCity] = useState(profile?.city ?? '')
  const [maxDistance, setMaxDistance] = useState(50)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setError('')
    setSubmitting(true)
    try {
      const { data, error } = await supabase.from('listings').insert({
        user_id: profile.id,
        propose_title: propose.title,
        propose_description: propose.description || null,
        propose_category_id: propose.categoryId || null,
        propose_condition: propose.condition,
        propose_estimated_value: propose.value ? Math.round(parseFloat(propose.value) * 100) : null,
        propose_images: [],
        search_title: search.title,
        search_description: search.description || null,
        search_category_id: search.categoryId || null,
        search_condition_min: search.conditionMin,
        search_value_min: search.valueMin ? Math.round(parseFloat(search.valueMin) * 100) : null,
        search_value_max: search.valueMax ? Math.round(parseFloat(search.valueMax) * 100) : null,
        search_keywords: search.keywords ? search.keywords.split(',').map((k) => k.trim()) : [],
        location_city: city || null,
        max_distance_km: maxDistance,
        status: 'active',
      }).select().single()

      if (error) throw error

      // Trigger matching
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      fetch(`${url}/functions/v1/matching-engine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ listing_id: data.id }),
      }).catch(() => null)

      router.replace('/home')
    } catch (err) {
      setError((err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="px-4 pt-6">
      <button onClick={() => router.back()} className="text-gray-500 mb-4">← Retour</button>
      <h1 className="text-2xl font-extrabold mb-1">Nouvelle annonce</h1>
      <p className="text-sm text-gray-500 mb-6">Décrivez ce que vous proposez ET ce que vous cherchez</p>

      <form onSubmit={submit} className="space-y-6">
        {/* Propose */}
        <div className="card p-4 border-l-4 border-primary-500">
          <h2 className="text-lg font-bold mb-3 text-primary-500">🟦 Je propose</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Objet</label>
              <input className="input" required maxLength={80} value={propose.title}
                onChange={(e) => setPropose({ ...propose, title: e.target.value })}
                placeholder="ex. Vélo de course Decathlon" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[80px]" rows={3} value={propose.description}
                onChange={(e) => setPropose({ ...propose, description: e.target.value })}
                placeholder="Détails sur l'état, la marque, l'année…" />
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={propose.categoryId}
                onChange={(e) => setPropose({ ...propose, categoryId: e.target.value })}>
                <option value="">-- Choisir --</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">État</label>
              <div className="flex flex-wrap gap-2">
                {CONDITION_OPTIONS.map((c) => (
                  <button key={c} type="button"
                    onClick={() => setPropose({ ...propose, condition: c })}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                      propose.condition === c
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                    {CONDITION_LABELS[c]}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Valeur estimée (€)</label>
              <input className="input" type="number" min="0" step="1" value={propose.value}
                onChange={(e) => setPropose({ ...propose, value: e.target.value })}
                placeholder="ex. 250" />
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card p-4 border-l-4 border-secondary-500">
          <h2 className="text-lg font-bold mb-3 text-secondary-500">🟥 Je recherche</h2>
          <div className="space-y-3">
            <div>
              <label className="label">Objet recherché</label>
              <input className="input" required maxLength={80} value={search.title}
                onChange={(e) => setSearch({ ...search, title: e.target.value })}
                placeholder="ex. Console PS5" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input min-h-[80px]" rows={3} value={search.description}
                onChange={(e) => setSearch({ ...search, description: e.target.value })}
                placeholder="Critères, modèle, condition…" />
            </div>
            <div>
              <label className="label">Catégorie</label>
              <select className="input" value={search.categoryId}
                onChange={(e) => setSearch({ ...search, categoryId: e.target.value })}>
                <option value="">-- Choisir --</option>
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Valeur min (€)</label>
                <input className="input" type="number" value={search.valueMin}
                  onChange={(e) => setSearch({ ...search, valueMin: e.target.value })} placeholder="100" />
              </div>
              <div>
                <label className="label">Valeur max (€)</label>
                <input className="input" type="number" value={search.valueMax}
                  onChange={(e) => setSearch({ ...search, valueMax: e.target.value })} placeholder="500" />
              </div>
            </div>
            <div>
              <label className="label">Mots-clés (séparés par virgule)</label>
              <input className="input" value={search.keywords}
                onChange={(e) => setSearch({ ...search, keywords: e.target.value })}
                placeholder="ps5, console, slim" />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-4">
          <h2 className="font-bold mb-3">📍 Localisation</h2>
          <div className="space-y-3">
            <input className="input" value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ville (ex. Paris)" />
            <div>
              <label className="label">Distance max ({maxDistance} km)</label>
              <input type="range" min="5" max="200" value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full" />
            </div>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</div>}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? 'Publication…' : '✨ Publier l\'annonce'}
        </button>
      </form>
    </div>
  )
}
