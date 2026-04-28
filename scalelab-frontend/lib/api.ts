import type { PagedResult, Product } from './types'

export interface ProductsResponse {
  result: PagedResult
  servedBy: string
}

export interface SearchResponse {
  results: Product[]
  servedBy: string
}

const apiBase = () => process.env.INTERNAL_API_URL ?? 'http://localhost:5000'

const fetchOrThrow = async (url: string): Promise<Response> => {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`)
  return res
}

export const getProducts = async (page = 1, pageSize = 20): Promise<ProductsResponse> => {
  const res = await fetchOrThrow(`${apiBase()}/api/products?page=${page}&pageSize=${pageSize}`)
  const servedBy = res.headers.get('x-served-by') ?? 'unknown'
  const result: PagedResult = await res.json()
  return { result, servedBy }
}

export const searchProducts = async (q: string): Promise<SearchResponse> => {
  const res = await fetchOrThrow(`${apiBase()}/api/products/search?q=${encodeURIComponent(q)}`)
  const servedBy = res.headers.get('x-served-by') ?? 'unknown'
  const results: Product[] = await res.json()
  return { results, servedBy }
}
