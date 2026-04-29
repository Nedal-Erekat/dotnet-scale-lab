import Image from 'next/image'
import { Suspense } from 'react'
import { SearchProvider } from '@/lib/search-context'
import SearchInput from './_components/search-input'
import ProductsSection from './_components/products-section'
import ProductsSkeleton from './_components/products-skeleton'

const ProductsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) => {
  const { q, page: pageParam } = await searchParams
  const query = q?.trim() ?? ''
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1)

  return (
    <SearchProvider>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.svg" alt="ScaleLab" width={32} height={32} />
            <h1 className="text-2xl font-bold">ScaleLab</h1>
          </div>
          <SearchInput defaultValue={query} />
        </div>

        <Suspense fallback={<ProductsSkeleton />}>
          <ProductsSection query={query} page={page} />
        </Suspense>
      </main>
    </SearchProvider>
  )
}

export default ProductsPage
