/**
 * Tests for ChoroplethMap — presentational choropleth SVG component.
 *
 * Spec: "D3 scale output → React SVG attrs", "Protagonist distinct stroke",
 *       "Non-protagonist default style", "No d3.select on SVG elements".
 * Design: React renders <path> per feature. Fill derived from D3 color scale
 *         and EVA production joined by DANE code (DPTO_CCDGO). Zero d3.select.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import type { Feature, Geometry } from 'geojson'
import type { DepartmentGeoProperties as DepartmentProperties } from '../../../domain/coffee'
import { scaleSequential, interpolateYlOrRd, geoMercator, geoPath } from 'd3'

// RED: import fails until module exists.
import { ChoroplethMap } from './ChoroplethMap'

// ---------------------------------------------------------------------------
// Fixture geo features
// ---------------------------------------------------------------------------

function makeFeature(daneCode: string, name: string): Feature<Geometry, DepartmentProperties> {
  return {
    type: 'Feature',
    properties: { DPTO_CCDGO: daneCode, DPTO_CNMBR: name },
    geometry: {
      type: 'Polygon',
      // A minimal valid polygon (triangle near origin)
      coordinates: [[[0, 0], [1, 0], [0.5, 1], [0, 0]]],
    },
  }
}

const huilaFeature = makeFeature('41', 'HUILA')
const vapuesFeature = makeFeature('97', 'VAUPÉS')
const antioquiaFeature = makeFeature('05', 'Antioquia')
const cundinamarcaFeature = makeFeature('25', 'Cundinamarca')
const valleFeature = makeFeature('76', 'Valle del Cauca')

// ---------------------------------------------------------------------------
// Fixture scales / geoPath
// ---------------------------------------------------------------------------

const domainExtent: [number, number] = [0, 500000]
const colorScale = scaleSequential(interpolateYlOrRd).domain(domainExtent)
const projection = geoMercator()
const geoPathGenerator = geoPath(projection)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChoroplethMap', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders one <path> per GeoJSON feature', () => {
    const features = [huilaFeature, vapuesFeature]
    const productionByDane = new Map<string, number>([
      ['41', 300000],
      ['97', 10000],
    ])

    render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={['41']}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    // One <path> per feature
    const paths = document.querySelectorAll('path[data-dane-code]')
    expect(paths).toHaveLength(2)
  })

  it('applies fill color from D3 color scale (Huila)', () => {
    const features = [huilaFeature]
    const production = 300000
    const productionByDane = new Map<string, number>([['41', production]])

    render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={['41']}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const huilaPath = document.querySelector('path[data-dane-code="41"]')
    expect(huilaPath).not.toBeNull()
    // Fill should equal what the D3 color scale produces for this production value
    const expectedFill = colorScale(production)
    expect(huilaPath?.getAttribute('fill')).toBe(expectedFill)
  })

  it('gives protagonist (Huila) a higher stroke-width than non-protagonist (Vaupés)', () => {
    const features = [huilaFeature, vapuesFeature]
    const productionByDane = new Map<string, number>([
      ['41', 300000],
      ['97', 5000],
    ])

    render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={['41']}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const huilaPath = document.querySelector('path[data-dane-code="41"]')
    const vapuesPath = document.querySelector('path[data-dane-code="97"]')

    const huilaStroke = parseFloat(huilaPath?.getAttribute('stroke-width') ?? '0')
    const vapuesStroke = parseFloat(vapuesPath?.getAttribute('stroke-width') ?? '0')

    expect(huilaStroke).toBeGreaterThan(vapuesStroke)
  })

  it('joins production by DANE code (DPTO_CCDGO match)', () => {
    // Huila's feature has DPTO_CCDGO = '41'
    // The productionByDane map has key '41' → production
    // The fill must reflect that production (not default/zero)
    const features = [huilaFeature]
    const productionByDane = new Map<string, number>([['41', 400000]])

    render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const huilaPath = document.querySelector('path[data-dane-code="41"]')
    const expectedFill = colorScale(400000)
    expect(huilaPath?.getAttribute('fill')).toBe(expectedFill)
  })

  it('uses fallback fill for departments with no production data', () => {
    const features = [vapuesFeature]
    // No production entry for Vaupés → default/zero fill
    const productionByDane = new Map<string, number>()

    render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const vapuesPath = document.querySelector('path[data-dane-code="97"]')
    // For zero/unknown production, the fill should be the scale at 0 (or a default)
    const expectedFill = colorScale(0)
    expect(vapuesPath?.getAttribute('fill')).toBe(expectedFill)
  })

  // ---------------------------------------------------------------------------
  // PR2-3: Hover highlight tests (REQ-CM-01–04)
  // ---------------------------------------------------------------------------

  it('mouseEnter on "Antioquia" path → that path gets strokeWidth 2.5', () => {
    const features = [antioquiaFeature, cundinamarcaFeature]
    const productionByDane = new Map<string, number>([
      ['05', 200000],
      ['25', 100000],
    ])

    render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const antioquiaPath = document.querySelector('path[data-dane-code="05"]') as SVGPathElement
    const cundinamarcaPath = document.querySelector('path[data-dane-code="25"]') as SVGPathElement
    expect(antioquiaPath).not.toBeNull()
    expect(cundinamarcaPath).not.toBeNull()

    fireEvent.mouseEnter(antioquiaPath)

    expect(antioquiaPath.getAttribute('stroke-width')).toBe('2.5')
    // Cundinamarca should not be hovered
    expect(cundinamarcaPath.getAttribute('stroke-width')).not.toBe('2.5')
  })

  it('mouseLeave on "Antioquia" → reverts to default stroke, no department hovered', () => {
    const features = [antioquiaFeature]
    const productionByDane = new Map<string, number>([['05', 200000]])

    render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const antioquiaPath = document.querySelector('path[data-dane-code="05"]') as SVGPathElement
    fireEvent.mouseEnter(antioquiaPath)
    expect(antioquiaPath.getAttribute('stroke-width')).toBe('2.5')

    fireEvent.mouseLeave(antioquiaPath)
    expect(antioquiaPath.getAttribute('stroke-width')).not.toBe('2.5')
  })

  it('mouseEnter "Cundinamarca" while "Antioquia" hovered → Cundinamarca gets hover stroke, Antioquia reverts', () => {
    const features = [antioquiaFeature, cundinamarcaFeature]
    const productionByDane = new Map<string, number>([
      ['05', 200000],
      ['25', 100000],
    ])

    render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const antioquiaPath = document.querySelector('path[data-dane-code="05"]') as SVGPathElement
    const cundinamarcaPath = document.querySelector('path[data-dane-code="25"]') as SVGPathElement

    // Hover Antioquia first
    fireEvent.mouseEnter(antioquiaPath)
    expect(antioquiaPath.getAttribute('stroke-width')).toBe('2.5')

    // Now hover Cundinamarca
    fireEvent.mouseEnter(cundinamarcaPath)
    expect(cundinamarcaPath.getAttribute('stroke-width')).toBe('2.5')
    expect(antioquiaPath.getAttribute('stroke-width')).not.toBe('2.5')
  })

  // ---------------------------------------------------------------------------
  // PR2-7: CSS fill transition tests (REQ-CM-14–16, REQ-NFR-08)
  // ---------------------------------------------------------------------------

  it('every department <path> has style.transition containing "fill" and "300ms"', () => {
    const features = [antioquiaFeature, cundinamarcaFeature]
    const productionByDane = new Map<string, number>([
      ['05', 200000],
      ['25', 100000],
    ])

    const { container } = render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const paths = Array.from(container.querySelectorAll('path[data-dane-code]'))
    expect(paths.length).toBeGreaterThan(0)
    for (const path of paths) {
      const transition = (path as HTMLElement).style.transition
      expect(transition).toContain('fill')
      expect(transition).toContain('300ms')
    }
  })

  it('after year prop change, <path> elements still have style.transition containing "fill 300ms ease"', () => {
    const features = [antioquiaFeature]
    const productionByDane = new Map<string, number>([['05', 200000]])

    const { container, rerender } = render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    // Simulate a data update (different production value simulates year change)
    const updatedProduction = new Map<string, number>([['05', 300000]])
    rerender(
      <ChoroplethMap
        features={features}
        productionByDane={updatedProduction}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const path = container.querySelector('path[data-dane-code="05"]') as HTMLElement
    expect(path.style.transition).toContain('fill 300ms ease')
    // fill should have updated
    const expectedFill = colorScale(300000)
    expect(path.getAttribute('fill')).toBe(expectedFill)
  })

  // ---------------------------------------------------------------------------
  // PR2-5: Tooltip tests (REQ-CM-05–08)
  // ---------------------------------------------------------------------------

  it('mouseEnter on "Valle del Cauca" → tooltip <g> visible with department name and production value', () => {
    const features = [valleFeature]
    const productionByDane = new Map<string, number>([['76', 12345]])

    const { container } = render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const vallePath = container.querySelector('path[data-dane-code="76"]') as SVGPathElement
    expect(vallePath).not.toBeNull()

    fireEvent.mouseEnter(vallePath, { clientX: 100, clientY: 200 })

    const tooltip = container.querySelector('[data-testid="choropleth-tooltip"]')
    expect(tooltip).not.toBeNull()
    expect(tooltip?.textContent).toContain('Valle del Cauca')
    expect(tooltip?.textContent).toContain('12,345')
  })

  it('mouseLeave → tooltip is absent', () => {
    const features = [valleFeature]
    const productionByDane = new Map<string, number>([['76', 12345]])

    const { container } = render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
      />,
    )

    const vallePath = container.querySelector('path[data-dane-code="76"]') as SVGPathElement
    fireEvent.mouseEnter(vallePath, { clientX: 100, clientY: 200 })
    // Tooltip should appear
    expect(container.querySelector('[data-testid="choropleth-tooltip"]')).not.toBeNull()

    fireEvent.mouseLeave(vallePath)
    // Tooltip should disappear
    expect(container.querySelector('[data-testid="choropleth-tooltip"]')).toBeNull()
  })

  // ---------------------------------------------------------------------------
  // PR2-9: ColorLegend integration test (REQ-CM-09)
  // ---------------------------------------------------------------------------

  it('renders <rect> swatches from ColorLegend when domainExtent prop is provided', () => {
    const features = [huilaFeature]
    const productionByDane = new Map<string, number>([['41', 300000]])

    const { container } = render(
      <ChoroplethMap
        features={features}
        productionByDane={productionByDane}
        colorScale={colorScale}
        highlightDaneCodes={[]}
        geoPath={geoPathGenerator}
        width={400}
        height={400}
        domainExtent={[0, 500000]}
      />,
    )

    // ColorLegend renders <rect> swatches inside the SVG
    const rects = container.querySelectorAll('rect')
    expect(rects.length).toBeGreaterThanOrEqual(1)
  })

  it('does NOT call d3.select or d3.transition (static guard)', async () => {
    const modules = import.meta.glob('./ChoroplethMap.tsx', { query: '?raw', import: 'default', eager: true })
    const raw = modules['./ChoroplethMap.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })
})
