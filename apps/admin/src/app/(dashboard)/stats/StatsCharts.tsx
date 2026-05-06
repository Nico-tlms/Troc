'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts'

const BAR_COLORS = [
  '#6C63FF', '#7C74FF', '#8C84FF', '#9C94FF',
  '#AC9FFF', '#BCB0FF', '#CCBFFF', '#DCCFFF',
]

interface DailyPoint {
  date: string
  count: number
}

interface CategoryPoint {
  name: string
  count: number
}

interface StatsChartsProps {
  dailyUsersData: DailyPoint[]
  categoryData: CategoryPoint[]
}

export default function StatsCharts({ dailyUsersData, categoryData }: StatsChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Daily active users */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Nouvelles inscriptions (30 jours)
        </h2>
        <p className="text-xs text-gray-400 mb-6">Nombre de nouveaux utilisateurs par jour</p>
        <ResponsiveContainer width="100%" height={256}>
          <AreaChart data={dailyUsersData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                fontSize: '12px',
              }}
              labelStyle={{ fontWeight: 600, color: '#111827' }}
              formatter={(value: number) => [value, 'Inscriptions']}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#6C63FF"
              strokeWidth={2}
              fill="url(#colorUsers)"
              dot={false}
              activeDot={{ r: 4, fill: '#6C63FF', strokeWidth: 2, stroke: '#fff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top categories bar chart */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Annonces par catégorie
        </h2>
        <p className="text-xs text-gray-400 mb-6">Top 8 catégories les plus utilisées</p>
        {categoryData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
            Aucune donnée
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart
              data={categoryData}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={false}
                axisLine={false}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
                formatter={(value: number) => [value, 'Annonces']}
                cursor={{ fill: 'rgba(108,99,255,0.05)' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {categoryData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={BAR_COLORS[index % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
