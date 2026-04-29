import Image from 'next/image'
import type { Product } from '@/lib/types'

interface Props {
  product: Product
}

const ProductCard = ({ product }: Props) => (
  <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden">
    <div className="relative w-full aspect-[4/3]">
      <Image
        src={`https://picsum.photos/seed/${product.id}/400/300`}
        alt={product.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover"
      />
    </div>
    <div className="p-4 flex flex-col gap-1 flex-1">
      <span className="text-xs text-gray-400">{product.category}</span>
      <h2 className="font-semibold text-sm leading-snug">{product.name}</h2>
      <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
      <p className="mt-auto text-blue-600 font-bold">${product.price.toFixed(2)}</p>
    </div>
  </div>
)

export default ProductCard
