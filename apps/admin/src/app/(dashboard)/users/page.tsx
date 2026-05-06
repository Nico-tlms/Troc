import { Suspense } from 'react'
import { Search, ShieldCheck, Phone, BadgeCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import UserActions from './UserActions'

const PAGE_SIZE = 20

interface SearchParams {
  page?: string
  search?: string
}

async function fetchUsers(page: number, search: string) {
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (search) {
    query = query.ilike('username', `%${search}%`)
  }

  const { data, count, error } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

async function UsersTable({ page, search }: { page: number; search: string }) {
  const { data: users, count } = await fetchUsers(page, search)
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const searchParamsForPagination: Record<string, string> = {}
  if (search) searchParamsForPagination.search = search

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ville
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Réputation
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Échanges
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Vérifications
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Inscription
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  <p className="text-sm">Aucun utilisateur trouvé</p>
                </td>
              </tr>
            ) : (
              users.map((user: {
                id: string
                username: string
                display_name: string | null
                avatar_url: string | null
                city: string | null
                reputation_score: number
                exchange_count: number
                phone_verified: boolean
                id_verified: boolean
                is_suspended: boolean
                created_at: string
              }) => (
                <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-primary-600 text-xs font-semibold">
                            {(user.username ?? '?')[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <a
                          href={`/users/${user.id}`}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {user.display_name ?? user.username}
                        </a>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {user.city ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-800">{user.reputation_score.toFixed(1)}</span>
                    <span className="text-gray-400">/5</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 font-medium">
                    {user.exchange_count}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {user.phone_verified && (
                        <span title="Téléphone vérifié" className="text-emerald-500">
                          <Phone size={14} />
                        </span>
                      )}
                      {user.id_verified && (
                        <span title="Identité vérifiée" className="text-blue-500">
                          <BadgeCheck size={14} />
                        </span>
                      )}
                      {!user.phone_verified && !user.id_verified && (
                        <span className="text-gray-300 text-xs">Aucune</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_suspended ? (
                      <StatusBadge status="suspended" size="sm" />
                    ) : (
                      <StatusBadge status="active" size="sm" />
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserActions
                      userId={user.id}
                      isSuspended={user.is_suspended}
                      username={user.display_name ?? user.username}
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
        baseUrl="/users"
        searchParams={searchParamsForPagination}
      />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              {['Utilisateur', 'Ville', 'Réputation', 'Échanges', 'Vérifications', 'Statut', 'Inscription', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {[...Array(8)].map((_, i) => (
              <tr key={i} className="animate-pulse">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full" />
                    <div className="space-y-1.5">
                      <div className="h-3 bg-gray-200 rounded w-28" />
                      <div className="h-2.5 bg-gray-100 rounded w-20" />
                    </div>
                  </div>
                </td>
                {[...Array(7)].map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <div className="h-3 bg-gray-200 rounded w-16" />
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

export default function UsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const search = searchParams.search ?? ''

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérer les comptes utilisateurs</p>
        </div>
      </div>

      {/* Search */}
      <form method="get" className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            name="search"
            type="text"
            defaultValue={search}
            placeholder="Rechercher par nom d'utilisateur..."
            className="input pl-9"
          />
        </div>
        <button type="submit" className="btn-primary">
          Rechercher
        </button>
        {search && (
          <a href="/users" className="btn-secondary">
            Effacer
          </a>
        )}
      </form>

      <Suspense fallback={<TableSkeleton />}>
        {/* @ts-expect-error async server component */}
        <UsersTable page={page} search={search} />
      </Suspense>
    </div>
  )
}
