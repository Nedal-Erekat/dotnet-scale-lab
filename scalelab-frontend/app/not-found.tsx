import Link from 'next/link'

const NotFound = () => (
  <main className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center gap-4 text-center">
    <h2 className="text-xl font-semibold text-gray-800">Page not found</h2>
    <p className="text-sm text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
    <Link
      href="/"
      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Back to products
    </Link>
  </main>
)

export default NotFound
