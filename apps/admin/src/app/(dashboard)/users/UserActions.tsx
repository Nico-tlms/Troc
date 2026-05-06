'use client'

import { useTransition } from 'react'
import { Ban, CheckCircle, Trash2, Eye } from 'lucide-react'
import { suspendUser, unsuspendUser, deleteUser } from '@/app/actions'

interface UserActionsProps {
  userId: string
  isSuspended: boolean
  username: string
}

export default function UserActions({ userId, isSuspended, username }: UserActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleSuspend() {
    startTransition(async () => {
      await suspendUser(userId)
    })
  }

  function handleUnsuspend() {
    startTransition(async () => {
      await unsuspendUser(userId)
    })
  }

  function handleDelete() {
    if (!confirm(`Supprimer définitivement l'utilisateur "${username}" ? Cette action est irréversible.`)) return
    startTransition(async () => {
      await deleteUser(userId)
    })
  }

  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      <a
        href={`/users/${userId}`}
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
        title="Voir le profil"
      >
        <Eye size={14} />
      </a>

      {isSuspended ? (
        <button
          onClick={handleUnsuspend}
          disabled={isPending}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          title="Réactiver"
        >
          <CheckCircle size={14} />
        </button>
      ) : (
        <button
          onClick={handleSuspend}
          disabled={isPending}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors disabled:opacity-50"
          title="Suspendre"
        >
          <Ban size={14} />
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
        title="Supprimer"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
