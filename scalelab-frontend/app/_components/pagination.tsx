import Link from 'next/link'
import { buildPages, pageHref } from '@/lib/pagination'

interface Props {
  page: number
  totalPages: number
  query?: string
}

const base = 'px-3 py-1.5 text-sm rounded-md border'

const Pagination = ({ page, totalPages, query }: Props) => {
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

export default Pagination
