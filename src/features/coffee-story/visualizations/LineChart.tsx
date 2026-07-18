/**
 * LineChart — presentational SVG line chart component.
 *
 * D3↔React hybrid contract (non-negotiable):
 * - React owns the DOM: all SVG elements rendered as JSX.
 * - D3 supplies only math: d3.line generator, scale.ticks(), d3.area,
 *   d3.bisector, d3.format.
 * - ZERO d3.select / .append / .attr / d3.transition calls.
 *
 * Features:
 *   - X/Y axes and gridlines (pure JSX from scale.ticks())
 *   - Gradient area fill (linearGradient in <defs>, d3.area generator)
 *   - Draw-on animation (Framer Motion motion.path, plays once via hasAnimated ref)
 *   - Mouse-follow tooltip (d3.bisector, getBoundingClientRect, SVG <g> overlay)
 *
 * Receives:
 *   data         — NationalSeries (YearDatum[])
 *   width        — SVG viewport width in px
 *   height       — SVG viewport height in px
 *   annotations  — optional year+label markers (e.g. La Niña 2021)
 *   sourceLabel  — optional source-switch label (e.g. "FAO → EVA (2007)")
 */

import { useMemo, useRef, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  line as d3Line,
  area as d3Area,
  extent,
  scaleLinear,
  bisector,
  format as d3Format,
} from 'd3'
import type { NationalSeries } from '../../../domain/coffee'

const MARGIN = { top: 20, right: 20, bottom: 40, left: 60 }

const GRADIENT_ID = 'lineGradient'

type LineTooltip = {
  x: number
  y: number
  year: number
  production: number
} | null

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

  const svgRef = useRef<SVGSVGElement>(null)
  const hasAnimated = useRef(false)

  const [tooltip, setTooltip] = useState<LineTooltip>(null)

  // pathLength animates from 0→1 once; hasAnimated ref prevents replay on re-render
  const [animated, setAnimated] = useState(false)

  const { xScale, yScale, lineD, areaD, yTicks, xTicks } = useMemo(() => {
    if (data.length === 0) {
      return { xScale: null, yScale: null, lineD: '', areaD: '', yTicks: [], xTicks: [] }
    }

    const [minYear, maxYear] = extent(data, (d) => d.year) as [number, number]
    const [, maxProd] = extent(data, (d) => d.production) as [number, number]

    const xSc = scaleLinear().domain([minYear, maxYear]).range([0, innerWidth])
    const ySc = scaleLinear().domain([0, maxProd * 1.1]).range([innerHeight, 0])

    const lineGenerator = d3Line<{ year: number; production: number }>()
      .x((d) => xSc(d.year))
      .y((d) => ySc(d.production))

    const areaGenerator = d3Area<{ year: number; production: number }>()
      .x((d) => xSc(d.year))
      .y0(innerHeight)
      .y1((d) => ySc(d.production))

    const fmt = d3Format('.2s')

    return {
      xScale: xSc,
      yScale: ySc,
      lineD: lineGenerator(data) ?? '',
      areaD: areaGenerator(data) ?? '',
      yTicks: ySc.ticks(5).map((v) => ({ value: v, y: ySc(v), label: fmt(v) })),
      xTicks: xSc.ticks(6).map((v) => ({ value: v, x: xSc(v), label: String(Math.round(v)) })),
    }
  }, [data, innerWidth, innerHeight])

  // Draw-on animation: triggers once after first mount, never replays
  useEffect(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true
    setAnimated(true)
  }, [])

  // Mouse-follow tooltip handler
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !xScale || !yScale || data.length === 0) return

    const rect = svgRef.current.getBoundingClientRect()
    const xPos = e.clientX - rect.left - MARGIN.left
    const yearValue = xScale.invert(xPos)

    const bis = bisector<{ year: number; production: number }, number>((d) => d.year)
    const idx = bis.left(data, yearValue)

    // Clamp to valid index range and pick nearest neighbor
    const i = Math.max(0, Math.min(idx, data.length - 1))
    const prev = idx > 0 ? data[idx - 1] : null
    const curr = data[i]
    const nearest =
      prev && Math.abs(yearValue - prev.year) < Math.abs(yearValue - curr.year) ? prev : curr

    setTooltip({
      x: xScale(nearest.year),
      y: yScale(nearest.production),
      year: nearest.year,
      production: nearest.production,
    })
  }

  const handleMouseLeave = () => setTooltip(null)

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      role="img"
      aria-label="Coffee production line chart"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b4c11" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#6b4c11" stopOpacity={0} />
        </linearGradient>
      </defs>

      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {yTicks.map(({ value, y, label }) => (
          <g key={value}>
            <line
              x1={0}
              x2={innerWidth}
              y1={y}
              y2={y}
              stroke="#ddd"
              strokeOpacity={0.7}
              strokeDasharray="3 3"
            />
            <text
              x={-8}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={11}
              fill="#666"
            >
              {label}
            </text>
          </g>
        ))}

        {xTicks.map(({ value, x, label }) => (
          <text
            key={value}
            x={x}
            y={innerHeight + 20}
            textAnchor="middle"
            fontSize={11}
            fill="#666"
          >
            {label}
          </text>
        ))}

        <text
          x={-(innerHeight / 2)}
          y={-45}
          textAnchor="middle"
          fontSize={12}
          fill="#555"
          transform={`rotate(-90)`}
        >
          Toneladas
        </text>

        <text
          x={innerWidth / 2}
          y={innerHeight + 38}
          textAnchor="middle"
          fontSize={12}
          fill="#555"
        >
          Año
        </text>

        {areaD && (
          <path d={areaD} fill={`url(#${GRADIENT_ID})`} />
        )}

        {/* Main production line — pathLength animates 0→1 once on first activation */}
        {lineD && (
          <motion.path
            data-testid="line-path"
            d={lineD}
            fill="none"
            stroke="#6b4c11"
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: animated ? 1 : 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        )}

        {annotations.map((ann) => {
          if (!xScale || !yScale) return null
          const point = data.find((d) => d.year === ann.year)
          if (!point) return null

          const x = xScale(ann.year)
          const y = yScale(point.production)

          return (
            <g key={ann.year} role="img" aria-label={ann.label}>
              <circle cx={x} cy={y} r={5} fill="#c0392b" />
              <text x={x + 8} y={y - 8} fontSize={11} fill="#c0392b">
                {ann.label}
              </text>
            </g>
          )
        })}

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

        {tooltip && (
          <g data-testid="tooltip">
            <line
              x1={tooltip.x}
              x2={tooltip.x}
              y1={0}
              y2={innerHeight}
              stroke="#6b4c11"
              strokeWidth={1}
              strokeDasharray="4 2"
              strokeOpacity={0.7}
            />
            <circle
              cx={tooltip.x}
              cy={tooltip.y}
              r={5}
              fill="#6b4c11"
              stroke="#fff"
              strokeWidth={2}
            />
            <text
              x={tooltip.x + 8}
              y={tooltip.y - 12}
              fontSize={12}
              fill="#333"
              fontWeight="bold"
            >
              {tooltip.year}
            </text>
            <text
              x={tooltip.x + 8}
              y={tooltip.y + 4}
              fontSize={11}
              fill="#555"
            >
              {tooltip.production.toLocaleString()}
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}
