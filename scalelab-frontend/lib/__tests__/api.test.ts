import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProducts, searchProducts } from '../api'

const makeFetchMock = (status: number, body: unknown, headers: Record<string, string> = {}) => {
  const responseHeaders = new Headers(headers)
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Internal Server Error',
    headers: responseHeaders,
    json: () => Promise.resolve(body),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('getProducts', () => {
  it('returns parsed result and servedBy header', async () => {
    const body = { data: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, source: 'Cache' }
    vi.stubGlobal('fetch', makeFetchMock(200, body, { 'x-served-by': 'web-api-2' }))

    const { result, servedBy } = await getProducts(1, 20)

    expect(result).toEqual(body)
    expect(servedBy).toBe('web-api-2')
  })

  it('falls back to "unknown" when x-served-by header is absent', async () => {
    const body = { data: [], page: 1, pageSize: 20, totalCount: 0, totalPages: 0, source: 'Database' }
    vi.stubGlobal('fetch', makeFetchMock(200, body))

    const { servedBy } = await getProducts()

    expect(servedBy).toBe('unknown')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', makeFetchMock(500, {}))

    await expect(getProducts()).rejects.toThrow('API error 500')
  })
})

describe('searchProducts', () => {
  it('returns results and servedBy header', async () => {
    const body = [{ id: 1, name: 'Drill', category: 'Tools', price: 29.99 }]
    vi.stubGlobal('fetch', makeFetchMock(200, body, { 'x-served-by': 'web-api-1' }))

    const { results, servedBy } = await searchProducts('drill')

    expect(results).toEqual(body)
    expect(servedBy).toBe('web-api-1')
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal('fetch', makeFetchMock(404, {}))

    await expect(searchProducts('xyz')).rejects.toThrow('API error 404')
  })
})
