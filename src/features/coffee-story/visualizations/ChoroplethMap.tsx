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
 *   domainExtent      — optional [min, max] production range for the color legend
 */

import { useState, useRef } from 'react'
import type { Feature, Geometry } from 'geojson'
import type { GeoPath } from 'd3'
import { motion, AnimatePresence } from 'framer-motion'
import type { DepartmentGeoProperties } from '../../../domain/coffee'
import { ColorLegend } from './ColorLegend'

interface TipState {
  x: number
  y: number
  name: string
  production: number
}

interface ChoroplethMapProps {
  features: Feature<Geometry, DepartmentGeoProperties>[]
  productionByDane: Map<string, number>
  colorScale: (value: number) => string
  highlightDaneCodes: string[]
  geoPath: GeoPath<unknown, Feature<Geometry, DepartmentGeoProperties>>
  width: number
  height: number
  domainExtent?: [number, number]
}

export function ChoroplethMap({
  features,
  productionByDane,
  colorScale,
  highlightDaneCodes,
  geoPath,
  width,
  height,
  domainExtent,
}: ChoroplethMapProps) {
  const [hoveredDane, setHoveredDane] = useState<string | null>(null)
  const [tip, setTip] = useState<TipState | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const svgRef = useRef<SVGSVGElement>(null)

  return (
    <div style={{ position: 'relative' }}>
    <AnimatePresence>
      {!hasInteracted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'absolute',
            bottom: 56,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'rgba(75, 30, 35, 0.85)',
            color: '#fff',
            fontSize: '0.7rem',
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            padding: '5px 12px',
            borderRadius: 999,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
          aria-hidden="true"
        >
          ✦ Explora el mapa
        </motion.div>
      )}
    </AnimatePresence>
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ maxWidth: '100%', display: 'block' }}
      role="img"
      aria-label="Colombian coffee production choropleth map"
      onTouchStart={() => setHasInteracted(true)}
    >
      {features.map((feature) => {
        const daneCode = feature.properties.DPTO_CCDGO
        const departmentName = feature.properties.DPTO_CNMBR
        const production = productionByDane.get(daneCode) ?? 0
        const isProtagonist = highlightDaneCodes.includes(daneCode)
        const isHovered = hoveredDane === daneCode

        // D3 geoPath computes the SVG path string — pure math, no DOM access.
        const pathD = geoPath(feature) ?? ''

        return (
          <path
            key={daneCode}
            data-dane-code={daneCode}
            d={pathD}
            fill={isHovered ? '#8A5A2B' : colorScale(production)}
            stroke={isHovered ? '#1C2430' : '#fff'}
            strokeWidth={isHovered ? 2.5 : isProtagonist ? 2 : 0.5}
            style={{ transition: 'fill 300ms ease' }}
            aria-label={`${departmentName}: ${production.toLocaleString()} toneladas`}
            onMouseEnter={(e) => {
              setHoveredDane(daneCode)
              if (!hasInteracted) setHasInteracted(true)
              const { left = 0, top = 0 } = svgRef.current?.getBoundingClientRect() ?? {}
              setTip({
                x: e.clientX - left,
                y: e.clientY - top,
                name: departmentName,
                production,
              })
            }}
            onMouseLeave={() => {
              setHoveredDane(null)
              setTip(null)
            }}
          />
        )
      })}

      {/* Tooltip overlay — SVG <g> inside the map SVG */}
      {tip && (
        <g
          data-testid="choropleth-tooltip"
          transform={`translate(${Math.min(Math.max(tip.x + 8, 0), width - 185)}, ${Math.min(Math.max(tip.y - 8, 18), height - 28)})`}
        >
          <rect
            x={0}
            y={-18}
            width={185}
            height={46}
            fill="white"
            fillOpacity={0.9}
            rx={3}
          />
          <text x={8} y={0} fontSize={15} fontWeight="bold" fill="#1C2430">
            {tip.name}
          </text>
          <text x={8} y={18} fontSize={14} fill="#6B6F4E">
            {tip.production.toLocaleString('en-US')} toneladas
          </text>
        </g>
      )}

    </svg>

    {/* Color legend — below the map SVG, centered */}
    {domainExtent && (
      <svg
        width={220}
        height={48}
        style={{ display: 'block', margin: '6px auto 0' }}
      >
        <g transform="translate(0, 16)">
          <ColorLegend
            colorScale={colorScale}
            domainExtent={domainExtent}
            label="Toneladas"
          />
        </g>
      </svg>
    )}
    </div>
  )
}
