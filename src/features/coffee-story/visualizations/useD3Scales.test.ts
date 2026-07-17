/**
 * Tests for useD3Scales — memoized D3 math hook.
 *
 * Design contract: pure math only — no DOM access. Returns typed D3 scale objects
 * (scaleLinear for x/y, scaleSequential for color). All outputs are deterministic
 * given the same domain/range inputs.
 */

import { describe, it, expect } from 'vitest'
import { renderHook } from '@testing-library/react'

// RED: this import fails until the module exists.
import { useD3Scales } from './useD3Scales'

describe('useD3Scales', () => {
  it('xScale maps domain start to range start', () => {
    const { result } = renderHook(() =>
      useD3Scales({ domainExtent: [0, 1000000], xRange: [0, 400], yRange: [400, 0] }),
    )

    expect(result.current.xScale(0)).toBe(0)
  })

  it('xScale maps domain end to range end', () => {
    const { result } = renderHook(() =>
      useD3Scales({ domainExtent: [0, 1000000], xRange: [0, 400], yRange: [400, 0] }),
    )

    expect(result.current.xScale(1000000)).toBe(400)
  })

  it('yScale maps domain start to yRange start (inverted for SVG)', () => {
    const { result } = renderHook(() =>
      useD3Scales({ domainExtent: [0, 1000000], xRange: [0, 400], yRange: [400, 0] }),
    )

    // yRange [400, 0] — domain 0 → 400 (bottom), domain 1000000 → 0 (top)
    expect(result.current.yScale(0)).toBe(400)
    expect(result.current.yScale(1000000)).toBe(0)
  })

  it('colorScale returns a non-empty CSS color string for value 0', () => {
    const { result } = renderHook(() =>
      useD3Scales({ domainExtent: [0, 1000000], xRange: [0, 400], yRange: [400, 0] }),
    )

    const color = result.current.colorScale(0)
    expect(typeof color).toBe('string')
    expect(color.length).toBeGreaterThan(0)
  })

  it('colorScale returns a different color for the max domain value', () => {
    const { result } = renderHook(() =>
      useD3Scales({ domainExtent: [0, 1000000], xRange: [0, 400], yRange: [400, 0] }),
    )

    const colorMin = result.current.colorScale(0)
    const colorMax = result.current.colorScale(1000000)
    expect(colorMin).not.toBe(colorMax)
  })

  it('xScale handles mid-domain values linearly', () => {
    const { result } = renderHook(() =>
      useD3Scales({ domainExtent: [0, 1000000], xRange: [0, 400], yRange: [400, 0] }),
    )

    // At 50% of domain, should be at 50% of range
    expect(result.current.xScale(500000)).toBeCloseTo(200, 1)
  })
})
