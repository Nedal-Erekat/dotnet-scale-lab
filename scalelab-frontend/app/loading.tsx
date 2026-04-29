import ProductsSkeleton from './_components/products-skeleton'

const Loading = () => (
  <main className="max-w-6xl mx-auto px-4 py-8">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-9 w-56 bg-gray-200 rounded-md animate-pulse" />
    </div>
    <ProductsSkeleton />
  </main>
)

export default Loading
