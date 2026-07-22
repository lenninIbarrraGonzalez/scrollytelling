/**
 * Tests for SlopeChart — D3↔React slope/ranking change chart.
 *
 * Spec: "SlopeChart renders one path per datum",
 *       "protagonist departments get bold/distinct style",
 *       "year labels rendered at top of each column".
 *
 * Design: React owns SVG DOM; D3 math only (no d3.select).
 *         motion.path with pathLength 0→1 animation per line.
 * Tasks: 2.4 RED
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { SlopeDatum } from '../../../domain/coffee'

// RED: import fails until module exists.
import { SlopeChart } from './SlopeChart'

const slopeData: SlopeDatum[] = [
  { daneCode: '41', department: 'Huila', rankA: 4, rankB: 1, productionA: 200000, productionB: 350000 },
  { daneCode: '17', department: 'Caldas', rankA: 1, rankB: 2, productionA: 300000, productionB: 300000 },
  { daneCode: '99', department: 'Otro', rankA: 3, rankB: 3, productionA: 150000, productionB: 120000 },
]

const PROTAGONIST_CODES = ['05', '17', '41', '63', '66', '73']

afterEach(() => cleanup())

describe('SlopeChart', () => {
  it('renders without crashing with empty data', () => {
    render(
      <SlopeChart data={[]} width={400} height={400} yearA={2007} yearB={2024} />,
    )
    expect(screen.getByTestId('slope-chart')).toBeInTheDocument()
  })

  it('renders one path per datum', () => {
    render(
      <SlopeChart
        data={slopeData}
        width={400}
        height={400}
        yearA={2007}
        yearB={2024}
      />,
    )

    // Each datum gets one connecting path with data-dane-code
    const paths = document.querySelectorAll('path[data-dane-code]')
    expect(paths.length).toBe(slopeData.length)
  })

  it('renders year labels for both yearA and yearB', () => {
    render(
      <SlopeChart
        data={slopeData}
        width={400}
        height={400}
        yearA={2007}
        yearB={2024}
      />,
    )

    // Both year labels must be visible
    expect(screen.getByText('2007')).toBeInTheDocument()
    expect(screen.getByText('2024')).toBeInTheDocument()
  })

  it('protagonist departments get bold label style', () => {
    render(
      <SlopeChart
        data={slopeData}
        width={400}
        height={400}
        yearA={2007}
        yearB={2024}
        highlightDaneCodes={PROTAGONIST_CODES}
      />,
    )

    // Protagonist paths get stroke="#8A5A2B", non-protagonists get "rgba(107,111,78,0.55)"
    const huilaPath = document.querySelector('path[data-dane-code="41"]')
    const outrPath = document.querySelector('path[data-dane-code="99"]')

    expect(huilaPath).not.toBeNull()
    expect(outrPath).not.toBeNull()

    expect(huilaPath?.getAttribute('stroke')).toBe('#8A5A2B')
    expect(outrPath?.getAttribute('stroke')).toBe('rgba(107,111,78,0.55)')
  })
})
