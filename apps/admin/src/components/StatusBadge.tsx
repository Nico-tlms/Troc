type StatusVariant =
  | 'pending'
  | 'active'
  | 'completed'
  | 'removed'
  | 'suspended'
  | 'reviewing'
  | 'resolved'
  | 'dismissed'
  | 'matched'
  | 'archived'
  | 'draft'
  | 'confirmed'
  | 'cancelled'
  | 'disputed'
  | 'pending_scan'
  | 'scanning'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | string

const variantStyles: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  pending_scan: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
  resolved: 'bg-blue-50 text-blue-700 border-blue-200',
  matched: 'bg-violet-50 text-violet-700 border-violet-200',
  reviewing: 'bg-orange-50 text-orange-700 border-orange-200',
  scanning: 'bg-orange-50 text-orange-700 border-orange-200',
  removed: 'bg-red-50 text-red-700 border-red-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  disputed: 'bg-red-50 text-red-700 border-red-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  dismissed: 'bg-gray-50 text-gray-600 border-gray-200',
  archived: 'bg-gray-50 text-gray-600 border-gray-200',
  expired: 'bg-gray-50 text-gray-600 border-gray-200',
  draft: 'bg-gray-50 text-gray-600 border-gray-200',
}

const labelMap: Record<string, string> = {
  pending: 'En attente',
  pending_scan: 'Scan en attente',
  active: 'Actif',
  accepted: 'Accepté',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  resolved: 'Résolu',
  matched: 'Matché',
  reviewing: 'En cours',
  scanning: 'Scan en cours',
  removed: 'Supprimé',
  suspended: 'Suspendu',
  cancelled: 'Annulé',
  disputed: 'Contesté',
  rejected: 'Rejeté',
  dismissed: 'Ignoré',
  archived: 'Archivé',
  expired: 'Expiré',
  draft: 'Brouillon',
}

interface StatusBadgeProps {
  status: StatusVariant
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const style = variantStyles[status] ?? 'bg-gray-50 text-gray-600 border-gray-200'
  const label = labelMap[status] ?? status

  return (
    <span
      className={`inline-flex items-center border rounded-full font-medium whitespace-nowrap ${style} ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0 ${
        style.includes('emerald') ? 'bg-emerald-500' :
        style.includes('yellow') ? 'bg-yellow-500' :
        style.includes('blue') ? 'bg-blue-500' :
        style.includes('violet') ? 'bg-violet-500' :
        style.includes('orange') ? 'bg-orange-500' :
        style.includes('red') ? 'bg-red-500' :
        'bg-gray-400'
      }`} />
      {label}
    </span>
  )
}
