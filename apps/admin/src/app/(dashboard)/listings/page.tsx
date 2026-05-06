import { Suspense } from 'react'
import { Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import ListingActions from './ListingActions'
import type { ListingStatus } from '@troc/types'

const PAGE_SIZE = 20

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'active', label: 'Actif' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'matched', label: 'Matché' },
  { value: 'completed', label: 'Terminé' },
  { value: 'archived', label: 'Archivé' },
  { value: 'removed', label: 'Supprimé' },
]

interface SearchParams {
  page?: string
  status?: string
  category?: string
}

async function fetchCategories() {
  const { data } = await supabase.from('categories').select('id, name').order('name')
  return data ?? []
}

async function fetchListings(page: number, status: string, categoryId: string) {
  let query = supabase
    .from('listings')
    .select(
      'id, propose_title, search_title, status, view_count, created_at, user_id, profiles!listings_user_id_fkey(username, display_name), categories!listings_propose_category_id_fkey(name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)
  if (categoryId) query = query.eq('propose_category_id', categoryId)

  const { data, count, error } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

async function ListingsTable({
  page,
  status,
  categoryId,
}: {
  page: number
  status: string
  categoryId: string
}) {
  const { data: listings, count } = await fetchListings(page, status, categoryId)
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const spForPagination: Record<string, string> = {}
  if (status) spForPagination.status = status
  if (categoryId) spForPagination.category = categoryId

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Annonce
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Vues
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {listings.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Aucune annonce trouvée
                </td>
              </tr>
            ) : (
              listings.map((listing: {
                id: string
                propose_title: string
                search_title: string
                status: ListingStatus
                view_count: number
                created_at: string
                user_id: string
                profiles: { username: string; display_name: string | null } | null
                categories: { name: string } | null
              }) => (
                <tr key={listing.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-gray-800 truncate">{listing.propose_title}</p>
                    <p className="text-xs text-gray-400 truncate">Cherche: {listing.search_title}</p>
                  </td>
                  <td className="px-4 py-3">
                    {listing.profiles ? (
                      <a
                        href={`/users/${listing.user_id}`}
                        className="text-sm text-gray-700 hover:text-primary-600 transition-colors font-medium"
                      >
                        {listing.profiles.display_name ?? listing.profiles.username}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {listing.categories?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={listing.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-sm">
                    {listing.view_count.toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ListingActions
                      listingId={listing.id}
                      status={listing.status}
                      title={listing.propose_title}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        baseUrl="/listings"
        searchParams={spForPagination}
      />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Annonce', 'Utilisateur', 'Catégorie', 'Statut', 'Vues', 'Date', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...Array(8)].map((_, i) => (
              <tr key={i}>
                <td className="px-4 py-3">
                  <div className="h-3 bg-gray-200 rounded w-40 mb-1.5" />
                  <div className="h-2.5 bg-gray-100 rounded w-32" />
                </td>
                {[...Array(6)].map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const status = searchParams.status ?? ''
  const categoryId = searchParams.category ?? ''

  const categories = await fetchCategories()

  function buildFilterUrl(newParams: Record<string, string>) {
    const params = new URLSearchParams({ ...newParams, page: '1' })
    // Remove empty values
    for (const [k, v] of [...params.entries()]) {
      if (!v) params.delete(k)
    }
    return `/listings?${params.toString()}`
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Annonces</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gérer les annonces de la plateforme</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter size={15} />
          <span>Filtrer:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <a
              key={opt.value}
              href={buildFilterUrl({ status: opt.value, category: categoryId })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                status === opt.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </a>
          ))}
        </div>

        {categories.length > 0 && (
          <select
            className="input py-1.5 text-xs w-auto"
            value={categoryId}
            onChange={(e) => {
              window.location.href = buildFilterUrl({ status, category: e.target.value })
            }}
          >
            <option value="">Toutes les catégories</option>
            {categories.map((c: { id: string; name: string }) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <Suspense fallback={<TableSkeleton />}>
        {/* @ts-expect-error async server component */}
        <ListingsTable page={page} status={status} categoryId={categoryId} />
      </Suspense>
    </div>
  )
}
