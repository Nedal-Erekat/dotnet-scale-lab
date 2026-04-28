'use client'
import { useSearch } from '@/lib/search-context'

const ResultsFade = ({ children }: { children: React.ReactNode }) => {
  const { isPending } = useSearch()
  return (
    <div className={`transition-opacity duration-300 ${isPending ? 'opacity-40' : 'opacity-100'}`}>
      {children}
    </div>
  )
}

export default ResultsFade
