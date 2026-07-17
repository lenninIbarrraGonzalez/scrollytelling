/**
 * Tests for useDataInterpolation — D3-driven data tween hook.
 *
 * Spec: "Choropleth tweens fill color", "D3 interpolator is called, not bypassed"
 * Design: Tweens DATA values (not CSS). d3.interpolate paired per matched key
 * (year for NationalSeries, daneCode for DepartmentSeries). No d3.transition.
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'
import type { YearDatum, DepartmentProduction } from '../../../domain/coffee'

// RED: import fails until module exists.
import { useDataInterpolation } from './useDataInterpolation'

describe('useDataInterpolation — NationalSeries (YearDatum)', () => {
  it('interpolates production at progress=0.5 to approximately the midpoint', () => {
    const fromData: YearDatum[] = [{ year: 2012, production: 626798 }]
    const toData: YearDatum[] = [{ year: 2012, production: 700000 }]

    const { result } = renderHook(() =>
      useDataInterpolation({ fromData, toData, progress: 0.5 }),
    )

    const interpolated = result.current as YearDatum[]
    expect(interpolated).toHaveLength(1)
    // midpoint: (626798 + 700000) / 2 ≈ 663399
    expect(interpolated[0].production).toBeCloseTo(663399, 0)
    expect(interpolated[0].year).toBe(2012)
  })

  it('returns fromData values at progress=0', () => {
    const fromData: YearDatum[] = [{ year: 2010, production: 500000 }]
    const toData: YearDatum[] = [{ year: 2010, production: 800000 }]

    const { result } = renderHook(() =>
      useDataInterpolation({ fromData, toData, progress: 0 }),
    )

    const interpolated = result.current as YearDatum[]
    expect(interpolated[0].production).toBeCloseTo(500000, 0)
  })

  it('returns toData values at progress=1', () => {
    const fromData: YearDatum[] = [{ year: 2010, production: 500000 }]
    const toData: YearDatum[] = [{ year: 2010, production: 800000 }]

    const { result } = renderHook(() =>
      useDataInterpolation({ fromData, toData, progress: 1 }),
    )

    const interpolated = result.current as YearDatum[]
    expect(interpolated[0].production).toBeCloseTo(800000, 0)
  })

  it('produces intermediate values proving interpolation (not a direct copy)', () => {
    // If d3.interpolate is bypassed and fromData/toData are returned directly,
    // the value would be 626798 or 700000 — NOT an intermediate.
    // Getting ~663399 proves interpolation ran.
    const fromData: YearDatum[] = [{ year: 2012, production: 626798 }]
    const toData: YearDatum[] = [{ year: 2012, production: 700000 }]

    const { result } = renderHook(() =>
      useDataInterpolation({ fromData, toData, progress: 0.5 }),
    )

    const value = (result.current as YearDatum[])[0].production
    expect(value).not.toBe(626798)
    expect(value).not.toBe(700000)
    expect(value).toBeGreaterThan(626798)
    expect(value).toBeLessThan(700000)
  })
})

describe('useDataInterpolation — DepartmentSeries (DepartmentProduction)', () => {
  it('interpolates departmental production matched by daneCode at progress=0.5', () => {
    const fromData: DepartmentProduction[] = [
      { daneCode: '41', department: 'Huila', year: 2012, production: 200000 },
    ]
    const toData: DepartmentProduction[] = [
      { daneCode: '41', department: 'Huila', year: 2012, production: 300000 },
    ]

    const { result } = renderHook(() =>
      useDataInterpolation({ fromData, toData, progress: 0.5 }),
    )

    const interpolated = result.current as DepartmentProduction[]
    expect(interpolated).toHaveLength(1)
    expect(interpolated[0].production).toBeCloseTo(250000, 0)
    expect(interpolated[0].daneCode).toBe('41')
  })

  it('handles multiple departments independently', () => {
    const fromData: DepartmentProduction[] = [
      { daneCode: '41', department: 'Huila', year: 2012, production: 200000 },
      { daneCode: '17', department: 'Caldas', year: 2012, production: 100000 },
    ]
    const toData: DepartmentProduction[] = [
      { daneCode: '41', department: 'Huila', year: 2012, production: 300000 },
      { daneCode: '17', department: 'Caldas', year: 2012, production: 200000 },
    ]

    const { result } = renderHook(() =>
      useDataInterpolation({ fromData, toData, progress: 0.5 }),
    )

    const interpolated = result.current as DepartmentProduction[]
    expect(interpolated).toHaveLength(2)

    const huila = interpolated.find((d) => d.daneCode === '41')!
    const caldas = interpolated.find((d) => d.daneCode === '17')!
    expect(huila.production).toBeCloseTo(250000, 0)
    expect(caldas.production).toBeCloseTo(150000, 0)
  })
})
