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
import type { NationalSeries, DepartmentSeries, ScatterDatum, SlopeDatum } from '../../../domain/coffee'
import { scaleSequential, interpolateYlOrRd, geoMercator, geoPath } from 'd3'
import type { ColombiaFeatureCollection } from '../../../data/geo/colombiaGeoLoader'

// RED: import fails until module exists.
import { StickyVisualization } from './StickyVisualization'
import { useScrollStore } from '../store/scrollStore'

// ---------------------------------------------------------------------------
// Fixture data for PR2 tests
// ---------------------------------------------------------------------------

const scatterFixture: ScatterDatum[] = [
  { daneCode: '41', department: 'Huila', production: 300000, areaHarvested: 120000, yield: 2.5 },
  { daneCode: '17', department: 'Caldas', production: 100000, areaHarvested: 50000, yield: 2.0 },
]

const slopeFixture: SlopeDatum[] = [
  { daneCode: '41', department: 'Huila', rankA: 4, rankB: 1, productionA: 200000, productionB: 350000 },
  { daneCode: '17', department: 'Caldas', rankA: 1, rankB: 2, productionA: 300000, productionB: 300000 },
]

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

  // ---------------------------------------------------------------------------
  // PR2: new viz branches
  // ---------------------------------------------------------------------------

  it('renders ScatterBubbleChart when activeViz="scatter"', () => {
    render(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
        activeViz="scatter"
        scatterData={scatterFixture}
      />,
    )

    // ScatterBubbleChart renders an SVG with data-testid="scatter-chart"
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument()
  })

  it('renders SlopeChart when activeViz="slope"', () => {
    render(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
        activeViz="slope"
        slopeData={slopeFixture}
      />,
    )

    // SlopeChart renders an SVG with data-testid="slope-chart"
    expect(screen.getByTestId('slope-chart')).toBeInTheDocument()
  })

  // ---------------------------------------------------------------------------
  // PR3: yAxisLabel threading to LineChart
  // ---------------------------------------------------------------------------

  it('passes yAxisLabel to LineChart when provided', () => {
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
        yAxisLabel="t/ha"
      />,
    )

    // LineChart should render the custom Y-axis label instead of "Toneladas"
    const texts = Array.from(document.querySelectorAll('text'))
    const hasCustomLabel = texts.some((el) => el.textContent?.trim() === 't/ha')
    const hasToneladas = texts.some((el) => el.textContent?.trim() === 'Toneladas')
    expect(hasCustomLabel).toBe(true)
    expect(hasToneladas).toBe(false)
  })

  it('renders nothing (null) for an unknown activeViz value', () => {
    render(
      <StickyVisualization
        nationalSeries={nationalSeries}
        departmentSeries={departmentSeries}
        geoFeatures={geoFeatures}
        colorScale={colorScale}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
        activeViz={'unknown' as never}
      />,
    )

    const wrapper = screen.getByTestId('sticky-viz')
    // No SVG should be rendered inside the wrapper
    expect(wrapper.querySelector('svg')).toBeNull()
  })
})
