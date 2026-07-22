/**
 * ScatterBubbleChart — presentational SVG scatter/bubble chart.
 *
 * D3↔React hybrid contract (non-negotiable):
 * - React owns the DOM: all SVG elements rendered as JSX.
 * - D3 supplies only math: scaleLinear, scaleSqrt, scale.ticks(), d3.format.
 * - ZERO d3.select / .append / .attr / d3.transition calls.
 *
 * Layout:
 *   X axis — areaHarvested (ha) — scaleLinear
 *   Y axis — yield (t/ha) — scaleLinear, inverted for SVG
 *   Radius — production (t) — scaleSqrt for area-accurate bubbles
 *
 * Protagonist DANE codes (darker fill + stroke): ['05','17','41','63','66','73']
 * Tooltip on mouseenter/mouseleave — shows dept name, production, area, yield.
 * Framer Motion motion.circle — scale 0→1 stagger animation.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { scaleLinear, scaleSqrt, format as d3Format } from 'd3'
import type { ScatterDatum } from '../../../domain/coffee'

const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 }

const PROTAGONIST_STROKE = '#6b4c11'
const PROTAGONIST_STROKE_WIDTH = 2
const OTHER_STROKE = '#ccc'
const OTHER_STROKE_WIDTH = 1
const PROTAGONIST_FILL = 'rgba(107,76,17,0.6)'
const OTHER_FILL = 'rgba(150,150,150,0.4)'

type TooltipState = {
  x: number
  y: number
  datum: ScatterDatum
} | null

interface ScatterBubbleChartProps {
  data: ScatterDatum[]
  width: number
  height: number
  highlightDaneCodes?: string[]
}

export function ScatterBubbleChart({
  data,
  width,
  height,
  highlightDaneCodes = [],
}: ScatterBubbleChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const { xScale, yScale, rScale, xTicks, yTicks } = useMemo(() => {
    if (data.length === 0) {
      return {
        xScale: scaleLinear().domain([0, 1]).range([0, innerWidth]),
        yScale: scaleLinear().domain([0, 1]).range([innerHeight, 0]),
        rScale: scaleSqrt().domain([0, 1]).range([3, 24]),
        xTicks: [] as { value: number; x: number; label: string }[],
        yTicks: [] as { value: number; y: number; label: string }[],
      }
    }

    const maxArea = Math.max(...data.map((d) => d.areaHarvested))
    const maxYield = Math.max(...data.map((d) => d.yield))
    const maxProd = Math.max(...data.map((d) => d.production))

    const xSc = scaleLinear().domain([0, maxArea * 1.05]).range([0, innerWidth])
    const ySc = scaleLinear().domain([0, maxYield * 1.05]).range([innerHeight, 0])
    const rSc = scaleSqrt().domain([0, maxProd]).range([3, 24])

    const fmt = d3Format(',.0f')

    return {
      xScale: xSc,
      yScale: ySc,
      rScale: rSc,
      xTicks: xSc.ticks(5).map((v) => ({ value: v, x: xSc(v), label: fmt(v) })),
      yTicks: ySc.ticks(5).map((v) => ({ value: v, y: ySc(v), label: String(v.toFixed(2)) })),
    }
  }, [data, innerWidth, innerHeight])

  const fmtNum = d3Format(',.0f')

  return (
    <svg
      data-testid="scatter-chart"
      width={width}
      height={height}
      role="img"
      aria-label="Coffee production scatter bubble chart"
    >
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
              fontSize={14}
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
            fontSize={14}
            fill="#666"
          >
            {label}
          </text>
        ))}

        <text
          x={innerWidth / 2}
          y={innerHeight + 44}
          textAnchor="middle"
          fontSize={15}
          fill="#555"
        >
          Área cosechada (ha)
        </text>

        <text
          x={-(innerHeight / 2)}
          y={-48}
          textAnchor="middle"
          fontSize={15}
          fill="#555"
          transform="rotate(-90)"
        >
          Rendimiento (t/ha)
        </text>

        {data.map((d, index) => {
          const isProtagonist = highlightDaneCodes.includes(d.daneCode)
          const cx = xScale(d.areaHarvested)
          const cy = yScale(d.yield)
          const r = rScale(d.production)

          return (
            <motion.circle
              key={d.daneCode}
              data-dane-code={d.daneCode}
              cx={cx}
              cy={cy}
              r={r}
              fill={isProtagonist ? PROTAGONIST_FILL : OTHER_FILL}
              stroke={isProtagonist ? PROTAGONIST_STROKE : OTHER_STROKE}
              strokeWidth={isProtagonist ? PROTAGONIST_STROKE_WIDTH : OTHER_STROKE_WIDTH}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.02 }}
              onMouseEnter={() =>
                setTooltip({
                  x: cx,
                  y: cy,
                  datum: d,
                })
              }
              onMouseLeave={() => setTooltip(null)}
              style={{ cursor: 'pointer' }}
            />
          )
        })}

        {tooltip && (
          <g
            data-testid="scatter-tooltip"
            transform={`translate(${tooltip.x + 12},${tooltip.y - 10})`}
          >
            <rect
              x={-4}
              y={-18}
              width={185}
              height={90}
              rx={4}
              fill="white"
              stroke="#ccc"
              strokeWidth={1}
              opacity={0.95}
            />
            <text fontSize={15} fontWeight="bold" fill="#333" y={0}>
              {tooltip.datum.department}
            </text>
            <text fontSize={14} fill="#555" y={20}>
              {fmtNum(tooltip.datum.production)} t
            </text>
            <text fontSize={14} fill="#555" y={38}>
              {fmtNum(tooltip.datum.areaHarvested)} ha
            </text>
            <text fontSize={14} fill="#555" y={56}>
              {tooltip.datum.yield.toFixed(2)} t/ha
            </text>
          </g>
        )}
      </g>
    </svg>
  )
}
