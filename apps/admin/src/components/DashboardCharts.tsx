'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const PIE_COLORS = ['#6C63FF', '#FF6584', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']

interface ExchangePoint {
  date: string
  count: number
}

interface CategoryPoint {
  name: string
  value: number
}

interface DashboardChartsProps {
  exchangesData: ExchangePoint[]
  categoriesData: CategoryPoint[]
}

export default function DashboardCharts({ exchangesData, categoriesData }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      {/* Line chart - exchanges per day */}
      <div className="card xl:col-span-2 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">
          Échanges (30 derniers jours)
        </h2>
        <ResponsiveContainer width="100%" height={224}>
          <LineChart data={exchangesData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9ca3af' }}
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
              formatter={(value: number) => [value, 'Échanges']}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#6C63FF"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: '#6C63FF', strokeWidth: 2, stroke: '#fff' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart - top categories */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-6">
          Catégories populaires
        </h2>
        {categoriesData.length === 0 ? (
          <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
            Aucune donnée
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={224}>
            <PieChart>
              <Pie
                data={categoriesData}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {categoriesData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
