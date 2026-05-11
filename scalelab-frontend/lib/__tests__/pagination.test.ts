import { describe, it, expect } from 'vitest'
import { buildPages, pageHref } from '../pagination'

describe('buildPages', () => {
  it('returns all pages when total <= 7', () => {
    expect(buildPages(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(buildPages(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('always includes first and last page', () => {
    const pages = buildPages(10, 20)
    expect(pages[0]).toBe(1)
    expect(pages[pages.length - 1]).toBe(20)
  })

  it('adds leading ellipsis when current is far from start', () => {
    const pages = buildPages(10, 20)
    expect(pages[1]).toBe('...')
  })

  it('adds trailing ellipsis when current is far from end', () => {
    const pages = buildPages(5, 20)
    expect(pages[pages.length - 2]).toBe('...')
  })

  it('omits leading ellipsis when current is near start', () => {
    const pages = buildPages(2, 20)
    expect(pages[1]).not.toBe('...')
  })
})

describe('pageHref', () => {
  it('returns / for page 1 with no query', () => {
    expect(pageHref(1)).toBe('/')
  })

  it('omits page param when page is 1', () => {
    expect(pageHref(1, 'drill')).toBe('/?q=drill')
  })

  it('includes page param when page > 1', () => {
    expect(pageHref(3)).toBe('/?page=3')
  })

  it('includes both params when page > 1 and query given', () => {
    const href = pageHref(3, 'drill')
    expect(href).toContain('q=drill')
    expect(href).toContain('page=3')
  })
})
