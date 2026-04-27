import type { Product } from '@/lib/types'

interface Props {
  product: Product
}

const ProductCard = ({ product }: Props) => (
  <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-1">
    <span className="text-xs text-gray-400">{product.category}</span>
    <h2 className="font-semibold text-sm leading-snug">{product.name}</h2>
    <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
    <p className="mt-auto text-blue-600 font-bold">${product.price.toFixed(2)}</p>
  </div>
)

export default ProductCard
