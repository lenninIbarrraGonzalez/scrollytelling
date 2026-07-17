/**
 * Tests for LineChart — presentational SVG line chart component.
 *
 * Spec: "D3 scale output drives React SVG attrs", "2021 La Niña annotated",
 *       "2007 source switch labeled", "No d3.select on SVG elements".
 *
 * Design: React renders <path> using D3-computed d3.line generator result.
 * Props: data: NationalSeries, width, height, annotations?, sourceLabel?
 * Zero d3.select anywhere in the component.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { YearDatum } from '../../../domain/coffee'

// RED: import fails until module exists.
import { LineChart } from './LineChart'

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const makeSeries = (): YearDatum[] => [
  { year: 1999, production: 547000 },
  { year: 2000, production: 632000 },
  { year: 2005, production: 680000 },
  { year: 2006, production: 720000 },
]

const seriesWithAnnotation = (): YearDatum[] => [
  ...makeSeries(),
  { year: 2021, production: 820000 },
]

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('LineChart', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders an SVG element', () => {
    render(
      <LineChart data={makeSeries()} width={600} height={400} />,
    )
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('renders a path element with a non-empty d attribute starting with M', () => {
    render(
      <LineChart data={makeSeries()} width={600} height={400} />,
    )
    const path = document.querySelector('path[d]')
    expect(path).toBeInTheDocument()
    const d = path?.getAttribute('d') ?? ''
    expect(d.length).toBeGreaterThan(0)
    expect(d.startsWith('M')).toBe(true)
  })

  it('renders a La Niña annotation when data includes year 2021', () => {
    render(
      <LineChart
        data={seriesWithAnnotation()}
        width={600}
        height={400}
        annotations={[{ year: 2021, label: 'La Niña' }]}
      />,
    )
    expect(screen.getByText(/La Niña/i)).toBeInTheDocument()
  })

  it('does NOT render a La Niña annotation when data has no year 2021', () => {
    render(
      <LineChart
        data={makeSeries()}
        width={600}
        height={400}
        annotations={[{ year: 2021, label: 'La Niña' }]}
      />,
    )
    // annotation year 2021 not present in data — no annotation rendered
    expect(screen.queryByText(/La Niña/i)).not.toBeInTheDocument()
  })

  it('renders a 2007 source-switch label when sourceLabel prop is provided', () => {
    render(
      <LineChart
        data={makeSeries()}
        width={600}
        height={400}
        sourceLabel="FAO → EVA (2007)"
      />,
    )
    expect(screen.getByText(/FAO → EVA/i)).toBeInTheDocument()
  })

  it('does NOT call d3.select or d3.transition (static guard)', async () => {
    const modules = import.meta.glob('./LineChart.tsx', { query: '?raw', import: 'default', eager: true })
    const raw = modules['./LineChart.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })
})
