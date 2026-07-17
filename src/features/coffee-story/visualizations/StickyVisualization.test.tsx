/**
 * Tests for StickyVisualization — persistent wrapper that never unmounts.
 *
 * Spec: "Single mount — never unmounts", "D3 interpolation state preserved",
 *       "renders LineChart for chapters 1-2 (FAO), ChoroplethMap for 3-5 (EVA)"
 *
 * Design: StickyVisualization reads activeChapterId from the Zustand store
 * (read-only subscriber). The outer wrapper div with data-testid="sticky-viz"
 * must NOT unmount across chapter changes. Conditional children (LineChart /
 * ChoroplethMap) switch based on active chapter's viz type.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import type { NationalSeries, DepartmentSeries } from '../../../domain/coffee'
import { scaleSequential, interpolateYlOrRd, geoMercator, geoPath } from 'd3'
import type { ColombiaFeatureCollection } from '../../../data/geo/colombiaGeoLoader'

// RED: import fails until module exists.
import { StickyVisualization } from './StickyVisualization'
import { useScrollStore } from '../store/scrollStore'

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const nationalSeries: NationalSeries = [
  { year: 1999, production: 547000 },
  { year: 2000, production: 632000 },
]

const departmentSeries: DepartmentSeries = [
  { daneCode: '41', department: 'Huila', year: 2012, production: 300000 },
]

const geoFeatures: ColombiaFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { DPTO_CCDGO: '41', DPTO_CNMBR: 'HUILA' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[0, 0], [1, 0], [0.5, 1], [0, 0]]],
      },
    },
  ],
}

const colorScale = scaleSequential(interpolateYlOrRd).domain([0, 500000])
const projection = geoMercator()
const geoPathGenerator = geoPath(projection)

// ---------------------------------------------------------------------------
// Helper: set active chapter in store
// ---------------------------------------------------------------------------

function setActiveChapter(id: string | null) {
  act(() => {
    useScrollStore.setState({ activeChapterId: id })
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StickyVisualization', () => {
  afterEach(() => {
    cleanup()
    act(() => {
      useScrollStore.setState({ activeChapterId: null })
    })
  })

  it('renders the sticky wrapper (data-testid="sticky-viz") on initial mount', () => {
    render(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    expect(screen.getByTestId('sticky-viz')).toBeInTheDocument()
  })

  it('does not unmount the sticky wrapper when activeChapterId changes', () => {
    render(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const stickyEl = screen.getByTestId('sticky-viz')

    // Simulate chapter changes
    setActiveChapter('chapter-1')
    setActiveChapter('chapter-3')
    setActiveChapter('chapter-2')

    // The exact SAME DOM node must still be present (not remounted)
    expect(screen.getByTestId('sticky-viz')).toBe(stickyEl)
  })

  it('renders LineChart when active chapter source is FAO (chapters 1-2)', () => {
    render(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
        activeViz="line"
      />,
    )

    // LineChart renders an SVG with a <path d="M..."> element
    const path = document.querySelector('path[d]')
    expect(path).toBeInTheDocument()
    expect(path?.getAttribute('d')?.startsWith('M')).toBe(true)
  })

  it('renders ChoroplethMap when active chapter source is EVA (chapters 3-5)', () => {
    render(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
        activeViz="choropleth"
      />,
    )

    // ChoroplethMap renders paths with data-dane-code attributes
    const danePaths = document.querySelectorAll('path[data-dane-code]')
    expect(danePaths.length).toBeGreaterThan(0)
  })

  it('switches between LineChart and ChoroplethMap without unmounting the wrapper', () => {
    const { rerender } = render(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
        activeViz="line"
      />,
    )

    const stickyEl = screen.getByTestId('sticky-viz')
    expect(document.querySelector('path[d]:not([data-dane-code])')).toBeInTheDocument()

    rerender(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
        activeViz="choropleth"
      />,
    )

    // Wrapper must be the SAME node — no remount
    expect(screen.getByTestId('sticky-viz')).toBe(stickyEl)
    // Now choropleth paths are visible
    expect(document.querySelectorAll('path[data-dane-code]').length).toBeGreaterThan(0)
  })
})
