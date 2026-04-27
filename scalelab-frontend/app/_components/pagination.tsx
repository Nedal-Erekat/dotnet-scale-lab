import Link from 'next/link'

interface Props {
  page: number
  totalPages: number
  query?: string
}

function pageHref(page: number, query?: string) {
  const params = new URLSearchParams()
  if (query) params.set('q', query)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/?${qs}` : '/'
}

function buildPages(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p)
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

const base = 'px-3 py-1.5 text-sm rounded-md border'

export default function Pagination({ page, totalPages, query }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav className="flex justify-center items-center gap-1 mt-8">
      {page > 1 ? (
        <Link href={pageHref(page - 1, query)} className={`${base} border-gray-300 hover:bg-gray-100`}>←</Link>
      ) : (
        <span className={`${base} border-gray-200 text-gray-300 cursor-default`}>←</span>
      )}

      {buildPages(page, totalPages).map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-sm text-gray-400">…</span>
        ) : (
          <Link
            key={p}
            href={pageHref(p, query)}
            className={`${base} ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-100'}`}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={pageHref(page + 1, query)} className={`${base} border-gray-300 hover:bg-gray-100`}>→</Link>
      ) : (
        <span className={`${base} border-gray-200 text-gray-300 cursor-default`}>→</span>
      )}
    </nav>
  )
}
