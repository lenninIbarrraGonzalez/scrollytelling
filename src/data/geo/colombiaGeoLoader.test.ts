import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Topology } from 'topojson-specification'

// ---------------------------------------------------------------------------
// Minimal TopoJSON fixture with two departments
// ---------------------------------------------------------------------------
//
// We use a simplified TopoJSON that topojson-client.feature() can process.
// The real Colombia topology has object key `MGN_DPTO_POLITICO`.

const MINIMAL_TOPOLOGY: Topology = {
  type: 'Topology',
  objects: {
    MGN_DPTO_POLITICO: {
      type: 'GeometryCollection',
      geometries: [
        {
          type: 'Polygon',
          arcs: [[0]],
          properties: { DPTO_CCDGO: '41', DPTO_CNMBR: 'HUILA' },
        },
        {
          type: 'Polygon',
          arcs: [[1]],
          // Note: no accent in name (QUINDIO vs QUINDÍO) — join must use DANE code
          properties: { DPTO_CCDGO: '63', DPTO_CNMBR: 'QUINDIO' },
        },
      ],
    },
  },
  arcs: [
    // Arc 0 — Huila polygon (simple triangle)
    [[0, 0], [1, 0], [0, 1], [0, 0]],
    // Arc 1 — Quindío polygon
    [[2, 2], [3, 2], [2, 3], [2, 2]],
  ],
  bbox: [0, 0, 3, 3],
}

describe('colombiaGeoLoader', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Reset module cache between tests so the fetch mock applies fresh
    vi.resetModules()
  })

  it('returned FeatureCollection exposes DPTO_CCDGO on features', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MINIMAL_TOPOLOGY),
    }))

    const { loadColombiaGeo } = await import('./colombiaGeoLoader')
    const fc = await loadColombiaGeo()

    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features.length).toBe(2)
    const codes = fc.features.map(f => f.properties?.DPTO_CCDGO)
    expect(codes).toContain('41')
    expect(codes).toContain('63')
  })

  it('feature with code 41 is findable — Huila DANE join', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MINIMAL_TOPOLOGY),
    }))

    const { loadColombiaGeo } = await import('./colombiaGeoLoader')
    const fc = await loadColombiaGeo()

    const huila = fc.features.find(f => f.properties?.DPTO_CCDGO === '41')
    expect(huila).toBeDefined()
    expect(huila!.properties!.DPTO_CNMBR).toBe('HUILA')
  })

  it('Quindío joins by DANE code 63 despite name QUINDIO (no accent)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MINIMAL_TOPOLOGY),
    }))

    const { loadColombiaGeo } = await import('./colombiaGeoLoader')
    const fc = await loadColombiaGeo()

    const quindio = fc.features.find(f => f.properties?.DPTO_CCDGO === '63')
    expect(quindio).toBeDefined()
    // Join succeeds by code regardless of name accent discrepancy
    expect(quindio!.properties!.DPTO_CCDGO).toBe('63')
  })

  it('fetch is called exactly once even across two awaits (cache)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MINIMAL_TOPOLOGY),
    })
    vi.stubGlobal('fetch', mockFetch)

    const { loadColombiaGeo } = await import('./colombiaGeoLoader')
    await loadColombiaGeo()
    await loadColombiaGeo()

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('throws on non-ok HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    }))

    const { loadColombiaGeo } = await import('./colombiaGeoLoader')
    await expect(loadColombiaGeo()).rejects.toThrow('404')
  })
})
