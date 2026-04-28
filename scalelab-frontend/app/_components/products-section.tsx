import { getProducts, searchProducts } from '@/lib/api'
import ReplicaBadge from './replica-badge'
import ResultsFade from './results-fade'
import ProductsGrid from './products-grid'
import Pagination from './pagination'

const PAGE_SIZE = 20

interface Props {
  query: string
  page: number
}

const ProductsSection = async ({ query, page }: Props) => {
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
    <ResultsFade>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">
          {isSearch ? (
            <>
              {totalCount} result{totalCount !== 1 ? 's' : ''} for{' '}
              <span className="font-medium">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            <>
              {totalCount.toLocaleString()} products &mdash; source:{' '}
              <span className="font-medium">{source}</span>
            </>
          )}
        </p>
        <ReplicaBadge servedBy={servedBy} />
      </div>

      <ProductsGrid products={products} />

      {!isSearch && <Pagination page={page} totalPages={totalPages} />}
    </ResultsFade>
  )
}

export default ProductsSection
