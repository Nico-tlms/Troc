import { Suspense } from 'react'
import { Flag, MessageSquare, User, ShoppingBag, ArrowLeftRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/StatusBadge'
import Pagination from '@/components/Pagination'
import ReportActions from './ReportActions'
import type { ReportTargetType, ReportStatus } from '@troc/types'

const PAGE_SIZE = 20

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'reviewing', label: 'En cours' },
  { value: 'resolved', label: 'Résolu' },
  { value: 'dismissed', label: 'Ignoré' },
]

const TARGET_TYPE_LABELS: Record<ReportTargetType, string> = {
  listing: 'Annonce',
  profile: 'Profil',
  message: 'Message',
  exchange: 'Échange',
}

function TargetTypeIcon({ type }: { type: ReportTargetType }) {
  const props = { size: 14, className: 'flex-shrink-0' }
  switch (type) {
    case 'listing':
      return <ShoppingBag {...props} className="text-blue-500 flex-shrink-0" />
    case 'profile':
      return <User {...props} className="text-violet-500 flex-shrink-0" />
    case 'message':
      return <MessageSquare {...props} className="text-emerald-500 flex-shrink-0" />
    case 'exchange':
      return <ArrowLeftRight {...props} className="text-orange-500 flex-shrink-0" />
    default:
      return <Flag {...props} className="text-gray-400 flex-shrink-0" />
  }
}

interface SearchParams {
  page?: string
  status?: string
}

async function fetchReports(page: number, status: string) {
  let query = supabase
    .from('reports')
    .select(
      `id, reason, description, target_type, target_id, status, created_at,
       reporter:profiles!reports_reporter_id_fkey(id, username, display_name)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)

  const { data, count, error } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

async function ReportsTable({ page, status }: { page: number; status: string }) {
  const { data: reports, count } = await fetchReports(page, status)
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
                Cible
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Motif
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Signalé par
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400 text-sm">
                  Aucun signalement trouvé
                </td>
              </tr>
            ) : (
              reports.map((report: {
                id: string
                reason: string
                description: string | null
                target_type: ReportTargetType
                target_id: string
                status: ReportStatus
                created_at: string
                reporter: { id: string; username: string; display_name: string | null } | null
              }) => (
                <tr key={report.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TargetTypeIcon type={report.target_type} />
                      <span className="text-sm text-gray-600 font-medium">
                        {TARGET_TYPE_LABELS[report.target_type] ?? report.target_type}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      #{report.target_id.slice(0, 8)}
                    </p>
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-sm text-gray-800 font-medium truncate">{report.reason}</p>
                    {report.description && (
                      <p className="text-xs text-gray-400 truncate mt-0.5">{report.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {report.reporter ? (
                      <a
                        href={`/users/${report.reporter.id}`}
                        className="text-sm text-gray-700 hover:text-primary-600 transition-colors font-medium"
                      >
                        {report.reporter.display_name ?? report.reporter.username}
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(report.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={report.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ReportActions
                      reportId={report.id}
                      currentStatus={report.status}
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
        baseUrl="/reports"
        searchParams={spForPagination}
      />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            {['Cible', 'Motif', 'Signalé par', 'Date', 'Statut', 'Actions'].map((h) => (
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
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                  <div className="h-3 bg-gray-200 rounded w-16" />
                </div>
              </td>
              {[...Array(5)].map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const status = searchParams.status ?? ''

  function buildFilterUrl(newStatus: string) {
    const params = new URLSearchParams({ page: '1' })
    if (newStatus) params.set('status', newStatus)
    return `/reports?${params.toString()}`
  }

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Signalements</h1>
        <p className="text-sm text-gray-500 mt-0.5">File de traitement des signalements</p>
      </div>

      {/* Status filters */}
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
        <ReportsTable page={page} status={status} />
      </Suspense>
    </div>
  )
}
