'use client'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

const Error = ({ error, reset }: Props) => (
  <main className="max-w-6xl mx-auto px-4 py-24 flex flex-col items-center gap-4 text-center">
    <h2 className="text-xl font-semibold text-gray-800">Something went wrong</h2>
    <p className="text-sm text-gray-500 max-w-sm">{error.message}</p>
    <button
      onClick={reset}
      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Try again
    </button>
  </main>
)

export default Error
