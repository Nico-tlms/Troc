import { Suspense } from 'react'
import { CheckCircle, AlertCircle, Clock, ArrowLeftRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import StatsCard from '@/components/StatsCard'

const PAGE_SIZE = 20

interface SearchParams {
  page?: string
  status?: string
}

async function fetchExchangeStats() {
  const [
    { count: total },
    { count: completed },
    { count: disputed },
    { count: pending },
  ] = await Promise.all([
    supabase.from('exchanges').select('*', { count: 'exact', head: true }),
    supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('exchanges').select('*', { count: 'exact', head: true }).eq('status', 'disputed'),
    supabase.from('exchanges').select('*', { count: 'exact', head: true }).in('status', ['pending_scan', 'scanning', 'confirmed']),
  ])
  return {
    total: total ?? 0,
    completed: completed ?? 0,
    disputed: disputed ?? 0,
    pending: pending ?? 0,
  }
}

async function fetchExchanges(page: number, status: string) {
  let query = supabase
    .from('exchanges')
    .select(
      `id, status, compensation_amount, completed_at, created_at,
       initiator:profiles!exchanges_initiator_id_fkey(username, display_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

const STATUS_OPTIONS = [
  { value: '', label: 'Tous' },
  { value: 'pending_scan', label: 'Scan en attente' },
  { value: 'scanning', label: 'Scan en cours' },
  { value: 'confirmed', label: 'Confirmé' },
  { value: 'completed', label: 'Terminé' },
  { value: 'cancelled', label: 'Annulé' },
  { value: 'disputed', label: 'Contesté' },
]

async function ExchangeStats() {
  const stats = await fetchExchangeStats()

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatsCard
        label="Total échanges"
        value={stats.total}
        icon={ArrowLeftRight}
        iconColor="text-primary-500"
        iconBg="bg-primary-50"
      />
      <StatsCard
        label="Terminés"
        value={stats.completed}
        icon={CheckCircle}
        iconColor="text-emerald-500"
        iconBg="bg-emerald-50"
      />
      <StatsCard
        label="En cours"
        value={stats.pending}
        icon={Clock}
        iconColor="text-blue-500"
        iconBg="bg-blue-50"
      />
      <StatsCard
        label="Contestés"
        value={stats.disputed}
        icon={AlertCircle}
        iconColor="text-red-500"
        iconBg="bg-red-50"
      />
    </div>
  )
}

async function ExchangesTable({ page, status }: { page: number; status: string }) {
  const { data: exchanges, count } = await fetchExchanges(page, status)
  const totalPages = Math.ceil(count / PAGE_SIZE)

  const spForPagination: Record<string, string> = {}
  if (status) spForPagination.status = status

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Initiateur
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Compensation
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Terminé le
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Créé le
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {exchanges.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Aucun échange trouvé
                </td>
              </tr>
            ) : (
              exchanges.map((exchange: {
                id: string
                status: string
                compensation_amount: number
                completed_at: string | null
                created_at: string
                initiator: { username: string; display_name: string | null } | null
              }) => (
                <tr key={exchange.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs text-gray-400">
                      #{exchange.id.slice(0, 8)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {exchange.initiator?.display_name ?? exchange.initiator?.username ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={exchange.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {exchange.compensation_amount > 0
                      ? `${(exchange.compensation_amount / 100).toFixed(2)} €`
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {exchange.completed_at
                      ? new Date(exchange.completed_at).toLocaleDateString('fr-FR')
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(exchange.created_at).toLocaleDateString('fr-FR')}
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
        baseUrl="/exchanges"
        searchParams={spForPagination}
      />
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-2/3" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="w-11 h-11 bg-gray-200 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            {['ID', 'Initiateur', 'Statut', 'Compensation', 'Terminé le', 'Créé le'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {[...Array(8)].map((_, i) => (
            <tr key={i}>
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
  )
}

export default function ExchangesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const status = searchParams.status ?? ''

  function buildFilterUrl(newStatus: string) {
    const params = new URLSearchParams({ page: '1' })
    if (newStatus) params.set('status', newStatus)
    return `/exchanges?${params.toString()}`
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Échanges</h1>
        <p className="text-sm text-gray-500 mt-0.5">Suivi des échanges entre utilisateurs</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        {/* @ts-expect-error async server component */}
        <ExchangeStats />
      </Suspense>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => (
          <a
            key={opt.value}
            href={buildFilterUrl(opt.value)}
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

      <Suspense fallback={<TableSkeleton />}>
        {/* @ts-expect-error async server component */}
        <ExchangesTable page={page} status={status} />
      </Suspense>
    </div>
  )
}
