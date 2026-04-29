export interface Product {
  id: number
  name: string
  description: string
  category: string
  price: number
}

export interface PagedResult {
  data: Product[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  source: string
}
