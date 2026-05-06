'use client'

import { useTransition } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { resolveReport } from '@/app/actions'
import type { ReportStatus } from '@troc/types'

interface ReportActionsProps {
  reportId: string
  currentStatus: ReportStatus
}

export default function ReportActions({ reportId, currentStatus }: ReportActionsProps) {
  const [isPending, startTransition] = useTransition()

  const isFinished = currentStatus === 'resolved' || currentStatus === 'dismissed'

  function handleAction(action: 'resolved' | 'dismissed' | 'reviewing') {
    startTransition(async () => {
      await resolveReport(reportId, action)
    })
  }

  if (isFinished) {
    return (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex justify-end">
        <span className="text-xs text-gray-300 italic">Traité</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {currentStatus === 'pending' && (
        <button
          onClick={() => handleAction('reviewing')}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors disabled:opacity-50"
          title="Marquer en cours de traitement"
        >
          <Eye size={12} />
          En cours
        </button>
      )}

      <button
        onClick={() => handleAction('resolved')}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors disabled:opacity-50"
        title="Résoudre"
      >
        {isPending ? (
          <span className="inline-block w-3 h-3 border border-current/30 border-t-current rounded-full animate-spin" />
        ) : (
          <CheckCircle size={12} />
        )}
        Résoudre
      </button>

      <button
        onClick={() => handleAction('dismissed')}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-50"
        title="Ignorer"
      >
        <XCircle size={12} />
        Ignorer
      </button>
    </div>
  )
}
