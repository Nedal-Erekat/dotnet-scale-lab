import type { PagedResult } from './types'

export interface ProductsResponse {
  result: PagedResult
  servedBy: string
}

export async function getProducts(page = 1, pageSize = 20): Promise<ProductsResponse> {
  const base = process.env.INTERNAL_API_URL ?? 'http://localhost:5000'
  const res = await fetch(`${base}/api/products?page=${page}&pageSize=${pageSize}`, {
    cache: 'no-store',
  })
  const servedBy = res.headers.get('x-served-by') ?? 'unknown'
  const result: PagedResult = await res.json()
  return { result, servedBy }
}
