/**
 * ChoroplethMap — presentational choropleth SVG component.
 *
 * D3↔React hybrid contract (non-negotiable):
 * - React owns the DOM: <path> elements rendered as JSX with React props.
 * - D3 supplies: geoPath generator (math only), color scale (math only).
 * - ZERO d3.select / .append / .attr / d3.transition calls.
 *
 * Join key: DPTO_CCDGO (DANE department code) — matches DepartmentProduction.daneCode.
 * Text names are never used for joins (name variants across datasets make them unsafe).
 *
 * Props:
 *   features          — GeoJSON Feature array (Colombia departments)
 *   productionByDane  — Map<daneCode, production in tonnes>
 *   colorScale        — D3 scaleSequential (production → CSS color)
 *   highlightDaneCodes — DANE codes for protagonist departments (distinct stroke)
 *   geoPath           — D3 geoPath generator function
 *   width / height    — SVG viewport dimensions
 */

import type { Feature, Geometry } from 'geojson'
import type { GeoPath } from 'd3'
import type { DepartmentGeoProperties } from '../../../domain/coffee'

interface ChoroplethMapProps {
  features: Feature<Geometry, DepartmentGeoProperties>[]
  productionByDane: Map<string, number>
  colorScale: (value: number) => string
  highlightDaneCodes: string[]
  geoPath: GeoPath<unknown, Feature<Geometry, DepartmentGeoProperties>>
  width: number
  height: number
}

export function ChoroplethMap({
  features,
  productionByDane,
  colorScale,
  highlightDaneCodes,
  geoPath,
  width,
  height,
}: ChoroplethMapProps) {
  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label="Colombian coffee production choropleth map"
    >
      {features.map((feature) => {
        const daneCode = feature.properties.DPTO_CCDGO
        const departmentName = feature.properties.DPTO_CNMBR
        const production = productionByDane.get(daneCode) ?? 0
        const isProtagonist = highlightDaneCodes.includes(daneCode)

        // D3 geoPath computes the SVG path string — pure math, no DOM access.
        const pathD = geoPath(feature) ?? ''

        return (
          <path
            key={daneCode}
            data-dane-code={daneCode}
            d={pathD}
            fill={colorScale(production)}
            stroke="#fff"
            strokeWidth={isProtagonist ? 2 : 0.5}
            aria-label={`${departmentName}: ${production.toLocaleString()} tonnes`}
          />
        )
      })}
    </svg>
  )
}
