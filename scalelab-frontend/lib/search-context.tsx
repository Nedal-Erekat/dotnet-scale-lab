'use client'
import { createContext, useCallback, useContext, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface SearchContextValue {
  isPending: boolean
  search: (q: string) => void
}

const SearchContext = createContext<SearchContextValue>({ isPending: false, search: () => {} })

const SearchProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(
    (q: string) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        startTransition(() => {
          router.push(q ? `/?q=${encodeURIComponent(q)}` : '/', { scroll: false })
        })
      }, 300)
    },
    [router],
  )

  return <SearchContext.Provider value={{ isPending, search }}>{children}</SearchContext.Provider>
}

const useSearch = () => useContext(SearchContext)

export { SearchProvider, useSearch }
