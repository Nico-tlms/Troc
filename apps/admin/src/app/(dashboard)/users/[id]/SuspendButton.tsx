'use client'

import { useTransition } from 'react'
import { Ban, CheckCircle } from 'lucide-react'
import { suspendUser, unsuspendUser } from '@/app/actions'

interface SuspendButtonProps {
  userId: string
  isSuspended: boolean
}

export default function SuspendButton({ userId, isSuspended }: SuspendButtonProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    startTransition(async () => {
      if (isSuspended) {
        await unsuspendUser(userId)
      } else {
        await suspendUser(userId)
      }
    })
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`btn-sm inline-flex items-center gap-2 rounded-lg font-medium text-xs transition-colors disabled:opacity-50 ${
        isSuspended
          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5'
          : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-3 py-1.5'
      }`}
    >
      {isPending ? (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : isSuspended ? (
        <CheckCircle size={13} />
      ) : (
        <Ban size={13} />
      )}
      {isSuspended ? 'Réactiver le compte' : 'Suspendre le compte'}
    </button>
  )
}
