const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow flex flex-col overflow-hidden animate-pulse">
    <div className="bg-gray-200 w-full aspect-[4/3]" />
    <div className="p-4 flex flex-col gap-2 flex-1">
      <div className="bg-gray-200 h-3 w-1/3 rounded" />
      <div className="bg-gray-200 h-4 w-3/4 rounded" />
      <div className="bg-gray-200 h-3 w-full rounded" />
      <div className="bg-gray-200 h-3 w-2/3 rounded" />
      <div className="bg-gray-200 h-5 w-1/4 rounded mt-auto" />
    </div>
  </div>
)

const ProductsSkeleton = () => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <div className="bg-gray-200 h-4 w-48 rounded animate-pulse" />
      <div className="bg-gray-200 h-7 w-32 rounded-full animate-pulse" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  </div>
)

export default ProductsSkeleton
