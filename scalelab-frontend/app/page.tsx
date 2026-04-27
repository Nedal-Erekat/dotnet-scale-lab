import Image from 'next/image'
import { getProducts, searchProducts } from '@/lib/api'
import ReplicaBadge from './_components/replica-badge'
import ProductsGrid from './_components/products-grid'
import SearchInput from './_components/search-input'
import Pagination from './_components/pagination'

const PAGE_SIZE = 20

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const query = q?.trim() ?? ''
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  const isSearch = query.length > 0

  const { products, servedBy, totalCount, totalPages, source } = isSearch
    ? await searchProducts(query).then(({ results, servedBy }) => ({
        products: results,
        servedBy,
        totalCount: results.length,
        totalPages: 1,
        source: 'Search',
      }))
    : await getProducts(page, PAGE_SIZE).then(({ result, servedBy }) => ({
        products: result.data,
        servedBy,
        totalCount: result.totalCount,
        totalPages: result.totalPages,
        source: result.source,
      }))

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="ScaleLab" width={32} height={32} />
          <h1 className="text-2xl font-bold">ScaleLab</h1>
        </div>
        <div className="flex items-center gap-3">
          <SearchInput defaultValue={query} />
          <ReplicaBadge servedBy={servedBy} />
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-6">
        {isSearch ? (
          <>
            {totalCount} result{totalCount !== 1 ? 's' : ''} for{' '}
            <span className="font-medium">&ldquo;{query}&rdquo;</span>
          </>
        ) : (
          <>
            {totalCount.toLocaleString()} products — source:{' '}
            <span className="font-medium">{source}</span>
          </>
        )}
      </p>

      <ProductsGrid products={products} />

      {!isSearch && <Pagination page={page} totalPages={totalPages} />}
    </main>
  )
}
