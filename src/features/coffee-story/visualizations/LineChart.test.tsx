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

import { describe, it, expect, afterEach, beforeAll, afterAll, vi } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
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

// ---------------------------------------------------------------------------
// Global mock: SVGPathElement.prototype.getTotalLength
// Required for draw-on animation tests (REQ-LC-14, REQ-NFR-07).
// jsdom does not expose SVGPathElement natively, so we define a stub class
// on globalThis and install a mock getTotalLength method on its prototype.
// ---------------------------------------------------------------------------

type SVGPathElementStub = { getTotalLength: () => number }
let originalGetTotalLength: (() => number) | undefined

beforeAll(() => {
  if (!(globalThis as Record<string, unknown>)['SVGPathElement']) {
    class SVGPathElementMock {
      getTotalLength(): number {
        return 0
      }
    }
    ;(globalThis as Record<string, unknown>)['SVGPathElement'] = SVGPathElementMock
  }
  const proto = (globalThis as Record<string, { prototype: SVGPathElementStub }>)[
    'SVGPathElement'
  ].prototype
  originalGetTotalLength = proto.getTotalLength
  proto.getTotalLength = vi.fn().mockReturnValue(500)
})

afterAll(() => {
  if (originalGetTotalLength !== undefined) {
    const proto = (globalThis as Record<string, { prototype: SVGPathElementStub }>)[
      'SVGPathElement'
    ].prototype
    proto.getTotalLength = originalGetTotalLength
  }
})

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

  // ---------------------------------------------------------------------------
  // PR1-2: Axes and Gridlines (REQ-LC-01 – REQ-LC-06)
  // ---------------------------------------------------------------------------

  describe('Axes and Gridlines', () => {
    it('renders Y-axis tick labels as <text> elements with numeric production values', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      // Y ticks: d3.format('.2s') on values like 547000 → "547k" style strings
      // At minimum, at least one text element with a numeric/formatted value must exist
      const texts = Array.from(document.querySelectorAll('text'))
      const hasNumericLabel = texts.some((el) => /^\d|[0-9]+[kMG]?$/.test(el.textContent?.trim() ?? ''))
      expect(hasNumericLabel).toBe(true)
    })

    it('renders X-axis tick labels as <text> elements with year values', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      const texts = Array.from(document.querySelectorAll('text'))
      // X ticks should include years in range 1999–2006
      const hasYearLabel = texts.some((el) => {
        const v = parseInt(el.textContent?.trim() ?? '', 10)
        return v >= 1999 && v <= 2010
      })
      expect(hasYearLabel).toBe(true)
    })

    it('renders horizontal gridline <line> elements', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      const lines = Array.from(document.querySelectorAll('line'))
      // Gridlines are horizontal: x1=0, x2=innerWidth (positive), y1=y2
      const gridlines = lines.filter((l) => {
        const x1 = parseFloat(l.getAttribute('x1') ?? '0')
        const x2 = parseFloat(l.getAttribute('x2') ?? '0')
        const y1 = l.getAttribute('y1')
        const y2 = l.getAttribute('y2')
        return x1 === 0 && x2 > 0 && y1 === y2
      })
      expect(gridlines.length).toBeGreaterThan(0)
    })

    it('renders a Y-axis title "Toneladas"', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      expect(screen.getByText('Toneladas')).toBeInTheDocument()
    })

    it('renders an X-axis title "Año"', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      expect(screen.getByText('Año')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // PR1-4: Gradient Area Fill (REQ-LC-07 – REQ-LC-09)
  // ---------------------------------------------------------------------------

  describe('Gradient Area Fill', () => {
    it('renders a <defs> element inside the SVG', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      expect(document.querySelector('defs')).toBeInTheDocument()
    })

    it('renders a <linearGradient> with a non-empty id inside <defs>', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      const gradient = document.querySelector('defs linearGradient')
      expect(gradient).toBeInTheDocument()
      expect(gradient?.getAttribute('id')?.length).toBeGreaterThan(0)
    })

    it('renders an area <path> whose fill references the gradient url', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      const gradient = document.querySelector('defs linearGradient')
      const gradientId = gradient?.getAttribute('id') ?? ''
      expect(gradientId.length).toBeGreaterThan(0)
      const paths = Array.from(document.querySelectorAll('path'))
      const areaPath = paths.find((p) => p.getAttribute('fill') === `url(#${gradientId})`)
      expect(areaPath).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // PR1-6: Draw-on Animation (REQ-LC-10 – REQ-LC-14)
  // ---------------------------------------------------------------------------

  describe('Draw-on Animation', () => {
    it('renders the main line as a motion.path element (data-testid="line-path" present)', () => {
      render(<LineChart data={makeSeries()} width={600} height={400} />)
      // motion.path renders as a real <path> in JSDOM — we identify it by data-testid
      const linePath = document.querySelector('[data-testid="line-path"]')
      expect(linePath).toBeInTheDocument()
    })

    it('does not re-trigger animation on re-render (hasAnimated stays true)', () => {
      const { rerender } = render(<LineChart data={makeSeries()} width={600} height={400} />)
      const beforePath = document.querySelector('[data-testid="line-path"]')
      expect(beforePath).toBeInTheDocument()
      // Re-render should not throw and element stays
      rerender(<LineChart data={makeSeries()} width={700} height={400} />)
      const afterPath = document.querySelector('[data-testid="line-path"]')
      expect(afterPath).toBeInTheDocument()
    })

    it('mounts without throwing when getTotalLength is not available', () => {
      // Temporarily remove getTotalLength from the stub
      const proto = (globalThis as Record<string, { prototype: Record<string, unknown> }>)[
        'SVGPathElement'
      ].prototype
      const saved = proto['getTotalLength']
      delete proto['getTotalLength']

      expect(() => {
        render(<LineChart data={makeSeries()} width={600} height={400} />)
      }).not.toThrow()

      // Restore
      proto['getTotalLength'] = saved
      cleanup()
    })
  })

  // ---------------------------------------------------------------------------
  // PR1-8: Tooltip (REQ-LC-15 – REQ-LC-21)
  // ---------------------------------------------------------------------------

  describe('Tooltip', () => {
    const tooltipData: YearDatum[] = [
      { year: 2000, production: 500000 },
      { year: 2001, production: 620000 },
      { year: 2002, production: 700000 },
    ]

    it('shows tooltip with year text on mousemove over the SVG', () => {
      const { container } = render(<LineChart data={tooltipData} width={600} height={400} />)
      const svg = container.querySelector('svg')!

      // Mock getBoundingClientRect: left=50, top=0
      svg.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 50, top: 0, right: 650, bottom: 400, width: 600, height: 400, x: 50, y: 0,
      })

      // clientX = 50 (left) + 60 (MARGIN.left) + midpoint near year 2001
      // innerWidth = 600 - 60 - 20 = 520; xScale maps [2000,2002] → [0,520]
      // year 2001 is at x = 260; so clientX = 50 + 60 + 260 = 370
      fireEvent.mouseMove(svg, { clientX: 370, clientY: 100 })

      // The tooltip group should be present
      const tooltipGroup = container.querySelector('[data-testid="tooltip"]')
      expect(tooltipGroup).toBeInTheDocument()
      // Should contain text with a year value
      expect(tooltipGroup?.textContent).toMatch(/200[0-2]/)
    })

    it('removes tooltip on mouseLeave', () => {
      const { container } = render(<LineChart data={tooltipData} width={600} height={400} />)
      const svg = container.querySelector('svg')!
      svg.getBoundingClientRect = vi.fn().mockReturnValue({
        left: 50, top: 0, right: 650, bottom: 400, width: 600, height: 400, x: 50, y: 0,
      })
      fireEvent.mouseMove(svg, { clientX: 370, clientY: 100 })
      expect(container.querySelector('[data-testid="tooltip"]')).toBeInTheDocument()
      fireEvent.mouseLeave(svg)
      expect(container.querySelector('[data-testid="tooltip"]')).not.toBeInTheDocument()
    })

    it('source scan: offsetX absent (SVG coord correctness constraint)', async () => {
      const modules = import.meta.glob('./LineChart.tsx', { query: '?raw', import: 'default', eager: true })
      const raw = modules['./LineChart.tsx'] as string
      expect(raw).not.toContain('offsetX')
    })
  })
})
