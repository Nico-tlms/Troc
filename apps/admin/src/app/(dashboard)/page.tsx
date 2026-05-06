import { Suspense } from 'react'
import { Users, ShoppingBag, ArrowLeftRight, Flag } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import StatsCard from '@/components/StatsCard'
import StatusBadge from '@/components/StatusBadge'
import DashboardCharts from '@/components/DashboardCharts'

// ─── Data fetching helpers ────────────────────────────────────────────────────

async function fetchDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    { count: totalUsers },
    { count: activeListings },
    { count: exchangesToday },
    { count: pendingReports },
    { count: totalUsersYesterday },
    { count: activeListingsYesterday },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('exchanges').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', today.toISOString()),
    supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .lt('created_at', today.toISOString()),
  ])

  const userChange = totalUsersYesterday
    ? (((totalUsers ?? 0) - (totalUsersYesterday ?? 0)) / (totalUsersYesterday ?? 1)) * 100
    : 0

  const listingChange = activeListingsYesterday
    ? (((activeListings ?? 0) - (activeListingsYesterday ?? 0)) / (activeListingsYesterday ?? 1)) * 100
    : 0

  return {
    totalUsers: totalUsers ?? 0,
    activeListings: activeListings ?? 0,
    exchangesToday: exchangesToday ?? 0,
    pendingReports: pendingReports ?? 0,
    userChange,
    listingChange,
  }
}

async function fetchExchangesPerDay() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await supabase
    .from('exchanges')
    .select('created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true })

  // Group by date
  const counts: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    counts[key] = 0
  }

  for (const row of data ?? []) {
    const key = row.created_at.slice(0, 10)
    if (key in counts) counts[key] = (counts[key] ?? 0) + 1
  }

  return Object.entries(counts).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    count,
  }))
}

async function fetchTopCategories() {
  const { data } = await supabase
    .from('listings')
    .select('propose_category_id, categories!listings_propose_category_id_fkey(name)')
    .not('propose_category_id', 'is', null)
    .neq('status', 'removed')

  const counts: Record<string, { name: string; count: number }> = {}
  for (const row of data ?? []) {
    const catRow = row as { propose_category_id: string; categories: { name: string } | null }
    const id = catRow.propose_category_id
    const name = catRow.categories?.name ?? 'Autre'
    if (!counts[id]) counts[id] = { name, count: 0 }
    counts[id]!.count++
  }

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)
    .map(({ name, count }) => ({ name, value: count }))
}

async function fetchRecentReports() {
  const { data } = await supabase
    .from('reports')
    .select('id, reason, target_type, status, created_at, reporter:profiles!reports_reporter_id_fkey(username, display_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  return data ?? []
}

// ─── Stats skeleton ───────────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="w-11 h-11 bg-gray-200 rounded-xl ml-4" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Stats section ────────────────────────────────────────────────────────────

async function StatsSection() {
  const stats = await fetchDashboardStats()

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatsCard
        label="Utilisateurs total"
        value={stats.totalUsers}
        icon={Users}
        iconColor="text-primary-500"
        iconBg="bg-primary-50"
        change={stats.userChange}
        changeLabel="vs. hier"
      />
      <StatsCard
        label="Annonces actives"
        value={stats.activeListings}
        icon={ShoppingBag}
        iconColor="text-emerald-500"
        iconBg="bg-emerald-50"
        change={stats.listingChange}
        changeLabel="vs. hier"
      />
      <StatsCard
        label="Échanges aujourd'hui"
        value={stats.exchangesToday}
        icon={ArrowLeftRight}
        iconColor="text-blue-500"
        iconBg="bg-blue-50"
      />
      <StatsCard
        label="Signalements en attente"
        value={stats.pendingReports}
        icon={Flag}
        iconColor="text-secondary-500"
        iconBg="bg-secondary-50"
      />
    </div>
  )
}

// ─── Charts section ───────────────────────────────────────────────────────────

async function ChartsSection() {
  const [exchangesData, categoriesData] = await Promise.all([
    fetchExchangesPerDay(),
    fetchTopCategories(),
  ])

  return <DashboardCharts exchangesData={exchangesData} categoriesData={categoriesData} />
}

// ─── Recent reports section ───────────────────────────────────────────────────

const TARGET_TYPE_LABELS: Record<string, string> = {
  listing: 'Annonce',
  profile: 'Profil',
  message: 'Message',
  exchange: 'Échange',
}

async function RecentReportsSection() {
  const reports = await fetchRecentReports()

  return (
    <div className="card">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Signalements récents</h2>
        <a href="/reports" className="text-sm text-primary-500 hover:text-primary-600 font-medium">
          Voir tout
        </a>
      </div>
      {reports.length === 0 ? (
        <div className="px-6 py-10 text-center text-gray-400 text-sm">
          Aucun signalement en attente
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {reports.map((report: {
            id: string
            reason: string
            target_type: string
            status: string
            created_at: string
            reporter: { username: string; display_name: string | null } | null
          }) => (
            <div key={report.id} className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {TARGET_TYPE_LABELS[report.target_type] ?? report.target_type}
                  </span>
                  <StatusBadge status={report.status} size="sm" />
                </div>
                <p className="text-sm text-gray-800 truncate">{report.reason}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Signalé par{' '}
                  <span className="font-medium">
                    {report.reporter?.display_name ?? report.reporter?.username ?? 'Utilisateur inconnu'}
                  </span>{' '}
                  · {new Date(report.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <a
                href="/reports"
                className="btn-secondary btn-sm flex-shrink-0"
              >
                Voir
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble de la plateforme Troc</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        {/* @ts-expect-error async server component */}
        <StatsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="card xl:col-span-2 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-40 mb-6" />
              <div className="h-56 bg-gray-100 rounded" />
            </div>
            <div className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-32 mb-6" />
              <div className="h-56 bg-gray-100 rounded" />
            </div>
          </div>
        }
      >
        {/* @ts-expect-error async server component */}
        <ChartsSection />
      </Suspense>

      <Suspense
        fallback={
          <div className="card animate-pulse">
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded w-40" />
            </div>
            <div className="divide-y divide-gray-50">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="px-6 py-4">
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        }
      >
        {/* @ts-expect-error async server component */}
        <RecentReportsSection />
      </Suspense>
    </div>
  )
}
