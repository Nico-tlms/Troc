import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  baseUrl: string
  searchParams?: Record<string, string>
}

export default function Pagination({ page, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  function buildUrl(targetPage: number) {
    const params = new URLSearchParams({ ...searchParams, page: String(targetPage) })
    return `${baseUrl}?${params.toString()}`
  }

  const hasPrev = page > 1
  const hasNext = page < totalPages

  // Build page number list with ellipsis
  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i)
    }
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
      <p className="text-sm text-gray-500">
        Page <span className="font-medium text-gray-700">{page}</span> sur{' '}
        <span className="font-medium text-gray-700">{totalPages}</span>
      </p>

      <div className="flex items-center gap-1">
        <a
          href={hasPrev ? buildUrl(page - 1) : '#'}
          aria-disabled={!hasPrev}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm transition-colors ${
            hasPrev
              ? 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              : 'border-gray-100 text-gray-300 cursor-not-allowed pointer-events-none'
          }`}
        >
          <ChevronLeft size={16} />
        </a>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-sm">
              …
            </span>
          ) : (
            <a
              key={p}
              href={buildUrl(p)}
              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {p}
            </a>
          )
        )}

        <a
          href={hasNext ? buildUrl(page + 1) : '#'}
          aria-disabled={!hasNext}
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border text-sm transition-colors ${
            hasNext
              ? 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300'
              : 'border-gray-100 text-gray-300 cursor-not-allowed pointer-events-none'
          }`}
        >
          <ChevronRight size={16} />
        </a>
      </div>
    </div>
  )
}
