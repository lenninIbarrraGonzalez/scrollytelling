/**
 * LineChart — presentational SVG line chart component.
 *
 * D3↔React hybrid contract (non-negotiable):
 * - React owns the DOM: all SVG elements rendered as JSX.
 * - D3 supplies only math: d3.line generator for path d attribute,
 *   useD3Scales for scale functions.
 * - ZERO d3.select / .append / .attr / d3.transition calls.
 *
 * Receives:
 *   data         — NationalSeries (YearDatum[])
 *   width        — SVG viewport width in px
 *   height       — SVG viewport height in px
 *   annotations  — optional year+label markers (e.g. La Niña 2021)
 *   sourceLabel  — optional source-switch label (e.g. "FAO → EVA (2007)")
 */

import { useMemo } from 'react'
import { line as d3Line, extent, scaleLinear } from 'd3'
import type { NationalSeries } from '../../../domain/coffee'

const MARGIN = { top: 20, right: 20, bottom: 40, left: 60 }

interface Annotation {
  year: number
  label: string
}

interface LineChartProps {
  data: NationalSeries
  width: number
  height: number
  annotations?: Annotation[]
  sourceLabel?: string
}

export function LineChart({
  data,
  width,
  height,
  annotations = [],
  sourceLabel,
}: LineChartProps) {
  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const { xScale, yScale, lineD } = useMemo(() => {
    if (data.length === 0) {
      return { xScale: null, yScale: null, lineD: '' }
    }

    const [minYear, maxYear] = extent(data, (d) => d.year) as [number, number]
    const [, maxProd] = extent(data, (d) => d.production) as [number, number]

    const xSc = scaleLinear().domain([minYear, maxYear]).range([0, innerWidth])
    const ySc = scaleLinear().domain([0, maxProd * 1.1]).range([innerHeight, 0])

    const generator = d3Line<{ year: number; production: number }>()
      .x((d) => xSc(d.year))
      .y((d) => ySc(d.production))

    return {
      xScale: xSc,
      yScale: ySc,
      lineD: generator(data) ?? '',
    }
  }, [data, innerWidth, innerHeight])

  return (
    <svg width={width} height={height} role="img" aria-label="Coffee production line chart">
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Main production line */}
        {lineD && (
          <path
            d={lineD}
            fill="none"
            stroke="#6b4c11"
            strokeWidth={2}
          />
        )}

        {/* Annotation markers — only rendered when the data year is present */}
        {annotations.map((ann) => {
          if (!xScale || !yScale) return null
          const point = data.find((d) => d.year === ann.year)
          if (!point) return null

          const x = xScale(ann.year)
          const y = yScale(point.production)

          return (
            <g key={ann.year} role="img" aria-label={ann.label}>
              <circle cx={x} cy={y} r={5} fill="#c0392b" />
              <text
                x={x + 8}
                y={y - 8}
                fontSize={11}
                fill="#c0392b"
              >
                {ann.label}
              </text>
            </g>
          )
        })}

        {/* Source-switch label */}
        {sourceLabel && xScale && (
          <text
            x={xScale(2007)}
            y={innerHeight + 30}
            textAnchor="middle"
            fontSize={10}
            fill="#555"
          >
            {sourceLabel}
          </text>
        )}
      </g>
    </svg>
  )
}
