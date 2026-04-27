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

export async function getProducts(page = 1, pageSize = 20): Promise<ProductsResponse> {
  const res = await fetch(`${apiBase()}/api/products?page=${page}&pageSize=${pageSize}`, {
    cache: 'no-store',
  })
  const servedBy = res.headers.get('x-served-by') ?? 'unknown'
  const result: PagedResult = await res.json()
  return { result, servedBy }
}

export async function searchProducts(q: string): Promise<SearchResponse> {
  const res = await fetch(`${apiBase()}/api/products/search?q=${encodeURIComponent(q)}`, {
    cache: 'no-store',
  })
  const servedBy = res.headers.get('x-served-by') ?? 'unknown'
  const results: Product[] = await res.json()
  return { results, servedBy }
}
