import { type LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  iconColor?: string
  iconBg?: string
  change?: number // percentage
  changeLabel?: string
}

export default function StatsCard({
  label,
  value,
  icon: Icon,
  iconColor = 'text-primary-500',
  iconBg = 'bg-primary-50',
  change,
  changeLabel,
}: StatsCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change !== undefined && change === 0

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </p>

          {change !== undefined && (
            <div className="mt-2 flex items-center gap-1.5">
              {isPositive && (
                <TrendingUp size={14} className="text-emerald-500 flex-shrink-0" />
              )}
              {isNegative && (
                <TrendingDown size={14} className="text-red-500 flex-shrink-0" />
              )}
              {isNeutral && (
                <Minus size={14} className="text-gray-400 flex-shrink-0" />
              )}
              <span
                className={`text-xs font-medium ${
                  isPositive
                    ? 'text-emerald-600'
                    : isNegative
                    ? 'text-red-600'
                    : 'text-gray-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {change.toFixed(1)}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-400">{changeLabel}</span>
              )}
            </div>
          )}
        </div>

        <div className={`flex-shrink-0 w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center ml-4`}>
          <Icon size={22} className={iconColor} strokeWidth={2} />
        </div>
      </div>
    </div>
  )
}
