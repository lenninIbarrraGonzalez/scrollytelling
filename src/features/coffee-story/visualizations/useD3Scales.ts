/**
 * useD3Scales — memoized D3 math hook.
 *
 * D3↔React hybrid contract (non-negotiable):
 * - Returns scale functions for use as pure math (no DOM access).
 * - React components call these functions to compute SVG attribute values
 *   and render them as JSX props — never via d3.select / d3.attr.
 *
 * Exports:
 *   xScale     — scaleLinear for x-axis (time/production domain → pixel range)
 *   yScale     — scaleLinear for y-axis (production domain → inverted pixel range)
 *   colorScale — scaleSequential (production → CSS color string for choropleth)
 */

import { useMemo } from 'react'
import { scaleLinear, scaleSequential, interpolateYlOrRd } from 'd3'

export interface D3ScalesInput {
  /** [min, max] of the production/value domain. */
  domainExtent: [number, number]
  /** [left, right] pixel range for the x-axis. */
  xRange: [number, number]
  /** [bottom, top] pixel range for the y-axis (typically [height, 0] for SVG). */
  yRange: [number, number]
}

export interface D3ScalesOutput {
  /** Maps a production value to an x-axis pixel position. */
  xScale: (value: number) => number
  /** Maps a production value to a y-axis pixel position. */
  yScale: (value: number) => number
  /** Maps a production value to a CSS color string. */
  colorScale: (value: number) => string
}

/**
 * Returns memoized D3 scale functions. Re-computes only when inputs change.
 * No DOM access — pure math.
 */
export function useD3Scales({ domainExtent, xRange, yRange }: D3ScalesInput): D3ScalesOutput {
  const xScale = useMemo(
    () => scaleLinear().domain(domainExtent).range(xRange),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [domainExtent[0], domainExtent[1], xRange[0], xRange[1]],
  )

  const yScale = useMemo(
    () => scaleLinear().domain(domainExtent).range(yRange),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [domainExtent[0], domainExtent[1], yRange[0], yRange[1]],
  )

  const colorScale = useMemo(
    () => scaleSequential(interpolateYlOrRd).domain(domainExtent),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [domainExtent[0], domainExtent[1]],
  )

  return { xScale, yScale, colorScale }
}
