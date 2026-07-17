import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCache } from './cache'

describe('createCache', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('second call to same URL resolves same data with fetch called exactly once', async () => {
    const cache = createCache<string[]>()
    const fetcher = vi.fn().mockResolvedValue(['row1', 'row2'])

    const result1 = await cache.get('https://example.com/data', fetcher)
    const result2 = await cache.get('https://example.com/data', fetcher)

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(result1).toEqual(['row1', 'row2'])
    expect(result2).toBe(result1)
  })

  it('two different URLs cause two fetch calls', async () => {
    const cache = createCache<string[]>()
    const fetcher1 = vi.fn().mockResolvedValue(['a'])
    const fetcher2 = vi.fn().mockResolvedValue(['b'])

    await cache.get('https://example.com/data-a', fetcher1)
    await cache.get('https://example.com/data-b', fetcher2)

    expect(fetcher1).toHaveBeenCalledTimes(1)
    expect(fetcher2).toHaveBeenCalledTimes(1)
  })

  it('two concurrent calls to same URL deduplicate to one in-flight request', async () => {
    const cache = createCache<string[]>()
    let resolveOnce!: (v: string[]) => void
    const fetcher = vi.fn().mockReturnValue(
      new Promise<string[]>(resolve => {
        resolveOnce = resolve
      }),
    )

    const p1 = cache.get('https://example.com/data', fetcher)
    const p2 = cache.get('https://example.com/data', fetcher)

    // Both promises should be the same promise — resolve it
    resolveOnce(['concurrent'])

    const [r1, r2] = await Promise.all([p1, p2])

    expect(fetcher).toHaveBeenCalledTimes(1)
    expect(r1).toEqual(['concurrent'])
    expect(r2).toBe(r1)
  })
})
