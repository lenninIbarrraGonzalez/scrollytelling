/**
 * LollipopChart — national weighted coffee yield per year.
 *
 * D3↔React hybrid contract (non-negotiable):
 * - React owns the DOM: all SVG elements rendered as JSX.
 * - D3 supplies only math: scaleLinear, scale.ticks(), d3.format.
 * - ZERO d3.select / .append / .attr / d3.transition calls.
 *
 * Each year is a vertical stem (line from baseline to value) topped
 * by a circle, all in the café brown (#8A5A2B). Tooltip via useState.
 */

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { extent, scaleLinear, format as d3Format } from 'd3'
import type { YieldDatum } from '../../../domain/coffee'

const MARGIN = { top: 20, right: 30, bottom: 50, left: 55 }

type LollipopTooltip = { x: number; y: number; year: number; yield: number } | null

interface LollipopChartProps {
  data: YieldDatum[]
  width: number
  height: number
}

export function LollipopChart({ data, width, height }: LollipopChartProps) {
  const innerWidth = width - MARGIN.left - MARGIN.right
  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const [tooltip, setTooltip] = useState<LollipopTooltip>(null)

  const { xScale, yScale, yTicks, xTicks } = useMemo(() => {
    if (data.length === 0) {
      return { xScale: null, yScale: null, yTicks: [], xTicks: [] }
    }

    const [minYear, maxYear] = extent(data, (d) => d.year) as [number, number]
    const [, maxYield] = extent(data, (d) => d.yield) as [number, number]

    const xSc = scaleLinear().domain([minYear, maxYear]).range([0, innerWidth])
    const ySc = scaleLinear().domain([0, maxYield * 1.15]).range([innerHeight, 0])

    const fmt = d3Format('.2f')

    return {
      xScale: xSc,
      yScale: ySc,
      yTicks: ySc.ticks(5).map((v) => ({ value: v, y: ySc(v), label: fmt(v) })),
      xTicks: xSc.ticks(9).map((v) => ({ value: v, x: xSc(v), label: String(Math.round(v)) })),
    }
  }, [data, innerWidth, innerHeight])

  return (
    <svg
      data-testid="lollipop-chart"
      width={width}
      height={height}
      role="img"
      aria-label="National weighted coffee yield lollipop chart"
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {yTicks.map(({ value, y, label }) => (
          <g key={value}>
            <line
              x1={0}
              x2={innerWidth}
              y1={y}
              y2={y}
              stroke="#cdc9be"
              strokeOpacity={0.7}
              strokeDasharray="3 3"
            />
            <text
              x={-8}
              y={y}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={14}
              fill="#6B6F4E"
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
            fill="#6B6F4E"
          >
            {label}
          </text>
        ))}

        <text
          x={-(innerHeight / 2)}
          y={-42}
          textAnchor="middle"
          fontSize={15}
          fill="#6B6F4E"
          transform="rotate(-90)"
        >
          t/ha
        </text>

        <text
          x={innerWidth / 2}
          y={innerHeight + 42}
          textAnchor="middle"
          fontSize={15}
          fill="#6B6F4E"
        >
          Año
        </text>

        {xScale && yScale && data.map((d, i) => {
          const x = xScale(d.year)
          const y = yScale(d.yield)
          return (
            <g key={d.year}>
              <motion.line
                data-year={d.year}
                x1={x}
                x2={x}
                y1={innerHeight}
                y2={y}
                stroke="#8A5A2B"
                strokeWidth={1.5}
                initial={{ y2: innerHeight }}
                animate={{ y2: y }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
              />
              <motion.circle
                data-year={d.year}
                cx={x}
                cy={y}
                r={5}
                fill="#8A5A2B"
                stroke="#fff"
                strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 + 0.4 }}
                style={{ transformOrigin: `${x}px ${y}px` }}
                onMouseEnter={() => setTooltip({ x, y, year: d.year, yield: d.yield })}
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          )
        })}

        {tooltip && (() => {
          const CARD_W = 110
          const flipLeft = tooltip.x + 8 + CARD_W > innerWidth
          const rectX = flipLeft ? tooltip.x - 8 - CARD_W : tooltip.x + 8
          const textX = rectX + CARD_W / 2
          return (
            <g data-testid="lollipop-tooltip">
              <rect
                x={rectX}
                y={tooltip.y - 42}
                width={CARD_W}
                height={46}
                rx={4}
                fill="#E6E0D6"
                stroke="#cdc9be"
                strokeWidth={1}
              />
              <text
                x={textX}
                y={tooltip.y - 26}
                textAnchor="middle"
                fontSize={15}
                fill="#1C2430"
                fontWeight="bold"
              >
                {tooltip.year}
              </text>
              <text
                x={textX}
                y={tooltip.y - 8}
                textAnchor="middle"
                fontSize={14}
                fill="#6B6F4E"
              >
                {tooltip.yield.toFixed(2)} t/ha
              </text>
            </g>
          )
        })()}
      </g>
    </svg>
  )
}
