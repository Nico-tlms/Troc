import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import {
  ArrowLeft,
  BadgeCheck,
  Phone,
  MapPin,
  Star,
  ArrowLeftRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import SuspendButton from './SuspendButton'

interface PageProps {
  params: { id: string }
}

async function fetchUser(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data
}

async function fetchUserListings(userId: string) {
  const { data } = await supabase
    .from('listings')
    .select('id, propose_title, search_title, status, view_count, created_at, categories:categories!listings_propose_category_id_fkey(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

async function fetchUserExchanges(userId: string) {
  const { data } = await supabase
    .from('exchanges')
    .select('id, status, compensation_amount, completed_at, created_at')
    .contains('participants', [userId])
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

async function fetchUserReviews(userId: string) {
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey(username, display_name)')
    .eq('reviewee_id', userId)
    .order('created_at', { ascending: false })
    .limit(10)
  return data ?? []
}

async function UserDetailContent({ id }: { id: string }) {
  const [user, listings, exchanges, reviews] = await Promise.all([
    fetchUser(id),
    fetchUserListings(id),
    fetchUserExchanges(id),
    fetchUserReviews(id),
  ])

  if (!user) notFound()

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length
      : null

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-2xl bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-600 text-2xl font-bold">
                {(user.username ?? '?')[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {user.display_name ?? user.username}
                  </h2>
                  {user.is_suspended && <StatusBadge status="suspended" />}
                </div>
                <p className="text-gray-400 text-sm">@{user.username}</p>
              </div>
              <SuspendButton userId={user.id} isSuspended={user.is_suspended} />
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              {user.city && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <MapPin size={14} className="text-gray-400" />
                  {user.city}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                <span className="font-medium text-gray-800">{user.reputation_score.toFixed(1)}</span>/5
                {avgRating !== null && (
                  <span className="text-gray-400">
                    ({reviews.length} avis, moy. {avgRating.toFixed(1)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ArrowLeftRight size={14} className="text-gray-400" />
                <span className="font-medium text-gray-800">{user.exchange_count}</span> échanges
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {user.phone_verified && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <Phone size={12} />
                  Téléphone vérifié
                </div>
              )}
              {user.id_verified && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  <BadgeCheck size={12} />
                  Identité vérifiée
                </div>
              )}
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Inscrit le {new Date(user.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Listings */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">
              Annonces ({listings.length})
            </h3>
          </div>
          {listings.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              Aucune annonce
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {listings.map((l: {
                id: string
                propose_title: string
                search_title: string
                status: string
                view_count: number
                created_at: string
                categories: { name: string } | null
              }) => (
                <div key={l.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{l.propose_title}</p>
                      <p className="text-xs text-gray-400 truncate">Cherche: {l.search_title}</p>
                      {l.categories && (
                        <p className="text-xs text-gray-400">{l.categories.name}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <StatusBadge status={l.status} size="sm" />
                      <span className="text-xs text-gray-400">{l.view_count} vues</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exchanges */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">
              Échanges ({exchanges.length})
            </h3>
          </div>
          {exchanges.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">
              Aucun échange
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {exchanges.map((e: {
                id: string
                status: string
                compensation_amount: number
                completed_at: string | null
                created_at: string
              }) => (
                <div key={e.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-400">
                        {new Date(e.created_at).toLocaleDateString('fr-FR')}
                      </p>
                      {e.compensation_amount > 0 && (
                        <p className="text-xs text-gray-500">
                          Compensation: {(e.compensation_amount / 100).toFixed(2)} €
                        </p>
                      )}
                    </div>
                    <StatusBadge status={e.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reviews received */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">
            Avis reçus ({reviews.length})
          </h3>
        </div>
        {reviews.length === 0 ? (
          <div className="px-5 py-8 text-center text-gray-400 text-sm">
            Aucun avis reçu
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reviews.map((r: {
              id: string
              rating: number
              comment: string | null
              created_at: string
              reviewer: { username: string; display_name: string | null } | null
            }) => (
              <div key={r.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={13}
                            className={i < r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{r.rating}/5</span>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-600">{r.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Par{' '}
                      <span className="font-medium">
                        {r.reviewer?.display_name ?? r.reviewer?.username ?? 'Utilisateur inconnu'}
                      </span>{' '}
                      · {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="card p-6">
        <div className="flex gap-6">
          <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-48" />
            <div className="h-3 bg-gray-100 rounded w-32" />
            <div className="flex gap-4 mt-4">
              <div className="h-3 bg-gray-200 rounded w-24" />
              <div className="h-3 bg-gray-200 rounded w-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function UserDetailPage({ params }: PageProps) {
  return (
    <div className="p-6 space-y-5">
      <a
        href="/users"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={16} />
        Retour aux utilisateurs
      </a>

      <Suspense fallback={<Skeleton />}>
        {/* @ts-expect-error async server component */}
        <UserDetailContent id={params.id} />
      </Suspense>
    </div>
  )
}
