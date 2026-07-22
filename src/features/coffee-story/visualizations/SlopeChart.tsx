/**
 * SlopeChart — presentational SVG slope/ranking change chart.
 *
 * D3↔React hybrid contract (non-negotiable):
 * - React owns the DOM: all SVG elements rendered as JSX.
 * - D3 supplies only math: scaleLinear.
 * - ZERO d3.select / .append / .attr / d3.transition calls.
 *
 * Layout:
 *   Two vertical columns — left (yearA) and right (yearB).
 *   Y scale — domain [1, maxRank], range [top, bottom] — rank 1 at TOP.
 *   Each datum: left dot, right dot, motion.path connecting them.
 *   Labels on both sides (department names).
 *   Year labels at the top of each column.
 *
 * Protagonist DANE codes: ['05','17','41','63','66','73']
 *   stroke="#6b4c11" strokeWidth=2 label fontWeight=700
 *   Others: stroke="#aaa" strokeWidth=1 label fontWeight=400
 *
 * Framer Motion motion.path — pathLength 0→1 stagger animation.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { scaleLinear } from 'd3'
import type { SlopeDatum } from '../../../domain/coffee'

const MARGIN = { top: 40, right: 120, bottom: 20, left: 120 }

const PROTAGONIST_STROKE = '#6b4c11'
const PROTAGONIST_STROKE_WIDTH = 2
const PROTAGONIST_FONT_WEIGHT = 700
const OTHER_STROKE = '#aaa'
const OTHER_STROKE_WIDTH = 1
const OTHER_FONT_WEIGHT = 400

const DOT_RADIUS = 5

interface SlopeChartProps {
  data: SlopeDatum[]
  width: number
  height: number
  yearA: number
  yearB: number
  highlightDaneCodes?: string[]
}

export function SlopeChart({
  data,
  width,
  height,
  yearA,
  yearB,
  highlightDaneCodes = [],
}: SlopeChartProps) {
  const leftX = MARGIN.left
  const rightX = width - MARGIN.right

  const innerHeight = height - MARGIN.top - MARGIN.bottom

  const yScale = useMemo(() => {
    const allRanks = data.flatMap((d) => [d.rankA, d.rankB])
    const maxRank = allRanks.length > 0 ? Math.max(...allRanks) : 1

    return scaleLinear()
      .domain([1, maxRank])
      .range([MARGIN.top, MARGIN.top + innerHeight])
  }, [data, innerHeight])

  return (
    <svg
      data-testid="slope-chart"
      width={width}
      height={height}
      role="img"
      aria-label="Coffee production ranking slope chart"
    >
      <text
        x={leftX}
        y={MARGIN.top - 16}
        textAnchor="middle"
        fontSize={16}
        fontWeight={600}
        fill="#333"
      >
        {yearA}
      </text>
      <text
        x={rightX}
        y={MARGIN.top - 16}
        textAnchor="middle"
        fontSize={16}
        fontWeight={600}
        fill="#333"
      >
        {yearB}
      </text>

      <line
        x1={leftX}
        x2={leftX}
        y1={MARGIN.top}
        y2={MARGIN.top + innerHeight}
        stroke="#e0e0e0"
        strokeWidth={1}
      />
      <line
        x1={rightX}
        x2={rightX}
        y1={MARGIN.top}
        y2={MARGIN.top + innerHeight}
        stroke="#e0e0e0"
        strokeWidth={1}
      />

      {data.map((d, index) => {
        const isProtagonist = highlightDaneCodes.includes(d.daneCode)
        const stroke = isProtagonist ? PROTAGONIST_STROKE : OTHER_STROKE
        const strokeWidth = isProtagonist ? PROTAGONIST_STROKE_WIDTH : OTHER_STROKE_WIDTH
        const fontWeight = isProtagonist ? PROTAGONIST_FONT_WEIGHT : OTHER_FONT_WEIGHT

        const yA = yScale(d.rankA)
        const yB = yScale(d.rankB)

        return (
          <g key={d.daneCode}>
            <motion.path
              data-dane-code={d.daneCode}
              d={`M ${leftX},${yA} L ${rightX},${yB}`}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            />

            <circle cx={leftX} cy={yA} r={DOT_RADIUS} fill={stroke} />
            <circle cx={rightX} cy={yB} r={DOT_RADIUS} fill={stroke} />

            <text
              x={leftX - 8}
              y={yA}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={14}
              fontWeight={fontWeight}
              fill={isProtagonist ? PROTAGONIST_STROKE : '#555'}
            >
              {d.department}
            </text>

            <text
              x={rightX + 8}
              y={yB}
              textAnchor="start"
              dominantBaseline="middle"
              fontSize={14}
              fontWeight={fontWeight}
              fill={isProtagonist ? PROTAGONIST_STROKE : '#555'}
            >
              {d.department}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
