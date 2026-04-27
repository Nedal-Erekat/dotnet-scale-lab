import type { Product } from '@/lib/types'
import ProductCard from './product-card'

interface Props {
  products: Product[]
}

export default function ProductsGrid({ products }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
