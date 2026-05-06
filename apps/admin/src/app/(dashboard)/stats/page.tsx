import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import StatsCard from '@/components/StatsCard'
import {
  TrendingUp,
  Clock,
  Users,
  BarChart2,
} from 'lucide-react'
import StatsCharts from './StatsCharts'

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function fetchDetailedStats() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    { count: totalListings },
    { count: totalMatches },
    { count: totalUsers },
    { data: completedExchanges },
    { data: dailyActivity },
    { data: categoryListings },
  ] = await Promise.all([
    supabase.from('listings').select('*', { count: 'exact', head: true }).neq('status', 'removed'),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('exchanges')
      .select('created_at, completed_at')
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('listings')
      .select('propose_category_id, status, categories:categories!listings_propose_category_id_fkey(name, id)')
      .not('propose_category_id', 'is', null)
      .neq('status', 'removed'),
  ])

  // Match rate: matches / listings
  const matchRate = totalListings && totalMatches
    ? Math.min(100, Math.round(((totalMatches ?? 0) / (totalListings ?? 1)) * 100))
    : 0

  // Avg time to exchange (in days)
  let avgTimeToExchange = 0
  if (completedExchanges && completedExchanges.length > 0) {
    const diffs = completedExchanges
      .filter((e) => e.completed_at)
      .map((e) => {
        const created = new Date(e.created_at).getTime()
        const completed = new Date(e.completed_at!).getTime()
        return (completed - created) / (1000 * 60 * 60 * 24)
      })
    if (diffs.length > 0) {
      avgTimeToExchange = diffs.reduce((a, b) => a + b, 0) / diffs.length
    }
  }

  // Daily active users (new signups per day, last 30 days)
  const dauByDate: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    dauByDate[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of dailyActivity ?? []) {
    const key = row.created_at.slice(0, 10)
    if (key in dauByDate) dauByDate[key] = (dauByDate[key] ?? 0) + 1
  }

  const dailyUsersData = Object.entries(dauByDate).map(([date, count]) => ({
    date: new Date(date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    count,
  }))

  // Category distribution
  const catCounts: Record<string, { name: string; count: number }> = {}
  for (const row of categoryListings ?? []) {
    const r = row as { propose_category_id: string; categories: { name: string; id: string } | null }
    const id = r.propose_category_id
    const name = r.categories?.name ?? 'Autre'
    if (!catCounts[id]) catCounts[id] = { name, count: 0 }
    catCounts[id]!.count++
  }

  const categoryData = Object.values(catCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  return {
    matchRate,
    avgTimeToExchange,
    totalUsers: totalUsers ?? 0,
    totalListings: totalListings ?? 0,
    dailyUsersData,
    categoryData,
  }
}

// ─── Stats cards ──────────────────────────────────────────────────────────────

async function StatsOverview() {
  const stats = await fetchDetailedStats()

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          label="Taux de match"
          value={`${stats.matchRate}%`}
          icon={TrendingUp}
          iconColor="text-primary-500"
          iconBg="bg-primary-50"
        />
        <StatsCard
          label="Délai moyen d'échange"
          value={`${stats.avgTimeToExchange.toFixed(1)}j`}
          icon={Clock}
          iconColor="text-blue-500"
          iconBg="bg-blue-50"
        />
        <StatsCard
          label="Utilisateurs total"
          value={stats.totalUsers}
          icon={Users}
          iconColor="text-emerald-500"
          iconBg="bg-emerald-50"
        />
        <StatsCard
          label="Annonces actives"
          value={stats.totalListings}
          icon={BarChart2}
          iconColor="text-orange-500"
          iconBg="bg-orange-50"
        />
      </div>

      <StatsCharts
        dailyUsersData={stats.dailyUsersData}
        categoryData={stats.categoryData}
      />
    </>
  )
}

function OverviewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-6 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="w-11 h-11 bg-gray-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 animate-pulse">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="card p-6">
            <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
            <div className="h-64 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </>
  )
}

export default function StatsPage() {
  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Statistiques</h1>
        <p className="text-sm text-gray-500 mt-0.5">Indicateurs détaillés de la plateforme</p>
      </div>

      <Suspense fallback={<OverviewSkeleton />}>
        {/* @ts-expect-error async server component */}
        <StatsOverview />
      </Suspense>
    </div>
  )
}
