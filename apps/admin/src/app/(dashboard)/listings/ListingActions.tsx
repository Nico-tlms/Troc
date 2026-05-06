'use client'

import { useTransition } from 'react'
import { Trash2, RotateCcw } from 'lucide-react'
import { removeListing, restoreListing } from '@/app/actions'
import type { ListingStatus } from '@troc/types'

interface ListingActionsProps {
  listingId: string
  status: ListingStatus
  title: string
}

export default function ListingActions({ listingId, status, title }: ListingActionsProps) {
  const [isPending, startTransition] = useTransition()

  const isRemoved = status === 'removed'

  function handleRemove() {
    if (!confirm(`Supprimer l'annonce "${title}" ?`)) return
    startTransition(async () => {
      await removeListing(listingId)
    })
  }

  function handleRestore() {
    startTransition(async () => {
      await restoreListing(listingId)
    })
  }

  return (
    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {isRemoved ? (
        <button
          onClick={handleRestore}
          disabled={isPending}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
          title="Restaurer"
        >
          <RotateCcw size={14} />
        </button>
      ) : (
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
          title="Supprimer"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}
