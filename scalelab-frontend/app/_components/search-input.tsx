'use client'
import { useState } from 'react'
import { useSearch } from '@/lib/search-context'

const SearchInput = ({ defaultValue = '' }: { defaultValue?: string }) => {
  const [value, setValue] = useState(defaultValue)
  const { search, isPending } = useSearch()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    search(e.target.value)
  }

  return (
    <div className="relative flex items-center">
      <input
        value={value}
        onChange={handleChange}
        placeholder="Search products…"
        className="border border-gray-300 rounded-md px-3 py-1.5 pr-8 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {isPending && (
        <svg
          className="absolute right-2 h-4 w-4 animate-spin text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
    </div>
  )
}

export default SearchInput
