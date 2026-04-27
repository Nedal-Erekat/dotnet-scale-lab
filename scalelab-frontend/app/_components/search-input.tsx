'use client'
import { useRouter } from 'next/navigation'

const SearchInput = ({ defaultValue = '' }: { defaultValue?: string }) => {
  const router = useRouter()

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    const q = (new FormData(e.currentTarget).get('q') as string).trim()
    router.push(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder="Search products…"
        className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
      >
        Search
      </button>
    </form>
  )
}

export default SearchInput
