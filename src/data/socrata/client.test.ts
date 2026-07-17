import { describe, it, expect, vi, beforeEach } from 'vitest'
import { socrataClient } from './client'

const BASE = 'https://www.datos.gov.co/resource/2pnw-mmge.json'

describe('socrataClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('toURL', () => {
    it('builds correct SoQL query string from fluent builder', () => {
      const url = socrataClient(BASE)
        .select('a_o,producci_n_t,c_d_dep')
        .where("cultivo='CAFE'")
        .limit(5000)
        .toURL()

      const parsed = new URL(url)
      expect(parsed.searchParams.get('$select')).toBe('a_o,producci_n_t,c_d_dep')
      expect(parsed.searchParams.get('$where')).toBe("cultivo='CAFE'")
      expect(parsed.searchParams.get('$limit')).toBe('5000')
    })

    it('includes $group and $order when set', () => {
      const url = socrataClient(BASE)
        .select('a_o')
        .where("cultivo='CAFE'")
        .group('a_o')
        .order('a_o ASC')
        .toURL()

      const parsed = new URL(url)
      expect(parsed.searchParams.get('$group')).toBe('a_o')
      expect(parsed.searchParams.get('$order')).toBe('a_o ASC')
    })

    it('omits optional params when not set', () => {
      const url = socrataClient(BASE).select('a_o').toURL()

      const parsed = new URL(url)
      expect(parsed.searchParams.has('$where')).toBe(false)
      expect(parsed.searchParams.has('$group')).toBe(false)
      expect(parsed.searchParams.has('$order')).toBe(false)
      expect(parsed.searchParams.has('$limit')).toBe(false)
    })
  })

  describe('fetchJson', () => {
    it('calls fetch and returns parsed JSON', async () => {
      const rows = [{ a_o: '2012', producci_n_t: '626798.0' }]
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(rows),
      }))

      const result = await socrataClient(BASE)
        .select('a_o')
        .where("cultivo='CAFE'")
        .fetchJson<typeof rows[0]>()

      expect(result).toEqual(rows)
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('throws on non-ok HTTP response', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      }))

      await expect(
        socrataClient(BASE).select('a_o').fetchJson(),
      ).rejects.toThrow('500')
    })
  })
})
