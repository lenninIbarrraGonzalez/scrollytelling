/**
 * Tests for ChoroplethMap — presentational choropleth SVG component.
 *
 * Spec: "D3 scale output → React SVG attrs", "Protagonist distinct stroke",
 *       "Non-protagonist default style", "No d3.select on SVG elements".
 * Design: React renders <path> per feature. Fill derived from D3 color scale
 *         and EVA production joined by DANE code (DPTO_CCDGO). Zero d3.select.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
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
