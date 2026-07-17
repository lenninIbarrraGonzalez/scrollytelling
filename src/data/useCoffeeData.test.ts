/**
 * Tests for useCoffeeData hook — load/error states and domain model shape.
 *
 * All network calls are mocked with vi.fn. No live requests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FAO_CSV = `Entity,Code,Year,Green coffee - Production (tonnes)
Colombia,COL,1990,1065000
Colombia,COL,1999,547000
Colombia,COL,2005,682000
`

const OLD_EVA_ROWS = [
  {
    a_o: '2007',
    producci_n_t: '828904.0',
    c_d_dep: '41',
    departamento: 'HUILA',
    rea_cosechada_ha: '90000.0',
    rendimiento_t_ha: '6.96',
    cultivo: 'CAFE',
  },
]

const NEW_EVA_ROWS = [
  {
    a_o: '2021',
    producci_n: '300000.0',
    c_digo_dane_departamento: '41',
    departamento: 'HUILA',
    rea_cosechada: '75000.0',
    rendimiento: '4.0',
    cultivo: 'Café',
  },
]

const MINIMAL_TOPOLOGY = {
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
      ],
    },
  },
  arcs: [[[0, 0], [1, 0], [0, 1], [0, 0]]],
  bbox: [0, 0, 1, 1],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a mock fetch that dispatches based on URL pattern.
 * - FAO CSV URL → returns CSV text
 * - Old EVA endpoint → returns OLD_EVA_ROWS JSON
 * - New EVA endpoint → returns NEW_EVA_ROWS JSON
 * - TopoJSON URL → returns MINIMAL_TOPOLOGY JSON
 */
function makeMockFetch() {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes('coffee-production-by-region')) {
      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(FAO_CSV),
        json: () => Promise.resolve(null),
      })
    }
    if (url.includes('2pnw-mmge')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(OLD_EVA_ROWS),
        text: () => Promise.resolve(''),
      })
    }
    if (url.includes('uejq-wxrr')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(NEW_EVA_ROWS),
        text: () => Promise.resolve(''),
      })
    }
    if (url.includes('topojson') || url.includes('colombia_mapa')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(MINIMAL_TOPOLOGY),
        text: () => Promise.resolve(''),
      })
    }
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve(null),
      text: () => Promise.resolve(''),
    })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCoffeeData', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  it('loading is true and data is null while fetch is in-flight', async () => {
    // Use a fetch that never resolves to hold loading state
    let resolveFao!: () => void
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(
        new Promise(resolve => {
          resolveFao = () =>
            resolve({
              ok: true,
              text: () => Promise.resolve(FAO_CSV),
              json: () => Promise.resolve([]),
            })
        }),
      ),
    )

    const { useCoffeeData } = await import('./useCoffeeData')
    const { result } = renderHook(() => useCoffeeData())

    // Before any fetch resolves, loading must be true and data null
    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()

    // Cleanup — resolve so React doesn't warn about state updates after unmount
    resolveFao()
  })

  it('error is an Error instance and loading is false on 500 response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve(null),
        text: () => Promise.resolve(''),
      }),
    )

    const { useCoffeeData } = await import('./useCoffeeData')
    const { result } = renderHook(() => useCoffeeData())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.data).toBeNull()
  })

  it('on success data has nationalSeries and departmentSeries with no raw field names', async () => {
    vi.stubGlobal('fetch', makeMockFetch())

    const { useCoffeeData } = await import('./useCoffeeData')
    const { result } = renderHook(() => useCoffeeData())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBeNull()
    const data = result.current.data
    expect(data).not.toBeNull()

    // nationalSeries must exist and contain YearDatum objects
    expect(Array.isArray(data!.nationalSeries)).toBe(true)
    expect(data!.nationalSeries.length).toBeGreaterThan(0)
    expect(typeof data!.nationalSeries[0].year).toBe('number')
    expect(typeof data!.nationalSeries[0].production).toBe('number')

    // departmentSeries must exist and contain DepartmentProduction objects
    expect(Array.isArray(data!.departmentSeries)).toBe(true)
    expect(data!.departmentSeries.length).toBeGreaterThan(0)
    const dp = data!.departmentSeries[0]
    expect(typeof dp.year).toBe('number')
    expect(typeof dp.production).toBe('number')
    expect(typeof dp.daneCode).toBe('string')
    expect(typeof dp.department).toBe('string')

    // geoFeatures must be a GeoJSON FeatureCollection
    expect(data!.geoFeatures.type).toBe('FeatureCollection')
    expect(Array.isArray(data!.geoFeatures.features)).toBe(true)

    // CRITICAL: no raw API field names must appear on any domain object
    const rawFields = [
      'producci_n_t',
      'a_o',
      'rea_sembrada_ha',
      'c_d_dep',
      'producci_n',
      'c_digo_dane_departamento',
    ]
    const allKeys = [
      ...Object.keys(dp),
      ...Object.keys(data!.nationalSeries[0]),
    ]
    rawFields.forEach(raw => {
      expect(allKeys).not.toContain(raw)
    })
  })

  it('loading transitions from true to false after fetch resolves', async () => {
    vi.stubGlobal('fetch', makeMockFetch())

    const { useCoffeeData } = await import('./useCoffeeData')
    const { result } = renderHook(() => useCoffeeData())

    // Initially loading
    expect(result.current.loading).toBe(true)

    // After resolution — loading false, data present
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.data).not.toBeNull()
  })
})
