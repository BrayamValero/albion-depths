'use client'

import Link from 'next/link'

interface PaginationProps {
  currentPage: number
  totalPages: number
  perPage: number
  onPageChange?: (page: number) => void
  onPerPageChange?: (perPage: number) => void
  showPerPageSelector?: boolean
  urlPattern?: string
}

function buildUrl(pattern: string | undefined, page: number, perPage: number): string {
  if (!pattern) return '#'
  return pattern.replace(/\{page\}/g, String(page)).replace(/\{perPage\}/g, String(perPage))
}

export function Pagination({ currentPage, totalPages, perPage, onPageChange, onPerPageChange, showPerPageSelector, urlPattern }: PaginationProps) {
  if (totalPages <= 0) return null

  const pages: (number | '...')[] = []
  const delta = 2
  const start = Math.max(1, currentPage - delta)
  const end = Math.min(totalPages, currentPage + delta)

  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('...')
  }
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push('...')
    pages.push(totalPages)
  }

  const isUrlMode = !!urlPattern

  return (
    <div className="flex items-center justify-between gap-4 pt-4 flex-wrap">
      {showPerPageSelector && onPerPageChange && !isUrlMode && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Show</span>
          <select
            value={perPage}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            className="bg-surface border border-border rounded-lg px-2 py-1 text-text-primary text-sm focus:outline-none focus:border-accent/50"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>per page</span>
        </div>
      )}

      {showPerPageSelector && isUrlMode && (
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <span>Show</span>
          <Link
            href={buildUrl(urlPattern, currentPage, 10)}
            className={`px-2 py-1 rounded border transition-colors ${perPage === 10 ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-text-primary hover:bg-surfaceHover'}`}
          >
            10
          </Link>
          <Link
            href={buildUrl(urlPattern, currentPage, 25)}
            className={`px-2 py-1 rounded border transition-colors ${perPage === 25 ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-text-primary hover:bg-surfaceHover'}`}
          >
            25
          </Link>
          <Link
            href={buildUrl(urlPattern, currentPage, 50)}
            className={`px-2 py-1 rounded border transition-colors ${perPage === 50 ? 'bg-accent text-white border-accent' : 'bg-surface border-border text-text-primary hover:bg-surfaceHover'}`}
          >
            50
          </Link>
          <span className="text-text-muted">per page</span>
        </div>
      )}

      <div className="flex items-center gap-1">
        {isUrlMode ? (
          <>
            {currentPage > 1 && (
              <Link
                href={buildUrl(urlPattern, currentPage - 1, perPage)}
                className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-border text-text-primary hover:bg-surfaceHover transition-colors"
              >
                Prev
              </Link>
            )}
            {currentPage <= 1 && (
              <span className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-border text-text-muted opacity-40 cursor-not-allowed">
                Prev
              </span>
            )}
            {pages.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-text-muted text-sm">...</span>
              ) : (
                <Link
                  key={p}
                  href={buildUrl(urlPattern, p, perPage)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    p === currentPage
                      ? 'bg-accent text-white border-accent font-semibold'
                      : 'bg-surface border-border text-text-primary hover:bg-surfaceHover'
                  }`}
                >
                  {p}
                </Link>
              )
            )}
            {currentPage < totalPages && (
              <Link
                href={buildUrl(urlPattern, currentPage + 1, perPage)}
                className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-border text-text-primary hover:bg-surfaceHover transition-colors"
              >
                Next
              </Link>
            )}
            {currentPage >= totalPages && (
              <span className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-border text-text-muted opacity-40 cursor-not-allowed">
                Next
              </span>
            )}
          </>
        ) : (
          <>
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-border text-text-primary hover:bg-surfaceHover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Prev
            </button>
            {pages.map((p, i) =>
              p === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-text-muted text-sm">...</span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    p === currentPage
                      ? 'bg-accent text-white border-accent font-semibold'
                      : 'bg-surface border-border text-text-primary hover:bg-surfaceHover'
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg bg-surface border border-border text-text-primary hover:bg-surfaceHover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </>
        )}
      </div>
    </div>
  )
}
