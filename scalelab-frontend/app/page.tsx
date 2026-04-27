import Image from 'next/image'
import { getProducts } from '@/lib/api'
import ReplicaBadge from './_components/replica-badge'
import ProductsGrid from './_components/products-grid'

export default async function ProductsPage() {
  const { result, servedBy } = await getProducts()

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="ScaleLab" width={32} height={32} />
          <h1 className="text-2xl font-bold">ScaleLab</h1>
        </div>
        <ReplicaBadge servedBy={servedBy} />
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {result.totalCount.toLocaleString()} products — source:{' '}
        <span className="font-medium">{result.source}</span>
      </p>
      <ProductsGrid products={result.data} />
    </main>
  )
}
