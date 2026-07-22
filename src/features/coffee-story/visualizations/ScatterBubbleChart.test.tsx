/**
 * Tests for ScatterBubbleChart — D3↔React scatter/bubble chart.
 *
 * Spec: "ScatterBubbleChart renders one bubble per valid datum",
 *       "protagonist departments get distinct stroke",
 *       "tooltip shows on mouseenter / hides on mouseleave".
 *
 * Design: React owns SVG DOM; D3 math only (no d3.select).
 * Tasks: 2.3 RED
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { ScatterDatum } from '../../../domain/coffee'

// RED: import fails until module exists.
import { ScatterBubbleChart } from './ScatterBubbleChart'

const baseData: ScatterDatum[] = [
  { daneCode: '41', department: 'Huila', production: 300000, areaHarvested: 120000, yield: 2.5 },
  { daneCode: '17', department: 'Caldas', production: 100000, areaHarvested: 50000, yield: 2.0 },
  { daneCode: '99', department: 'Otro', production: 50000, areaHarvested: 20000, yield: 2.5 },
]

const PROTAGONIST_CODES = ['05', '17', '41', '63', '66', '73']

afterEach(() => cleanup())

describe('ScatterBubbleChart', () => {
  it('renders without crashing with empty data', () => {
    render(
      <ScatterBubbleChart data={[]} width={400} height={400} />,
    )
    expect(screen.getByTestId('scatter-chart')).toBeInTheDocument()
  })

  it('renders one circle per datum', () => {
    render(
      <ScatterBubbleChart data={baseData} width={400} height={400} />,
    )
    const circles = document.querySelectorAll('circle[data-dane-code]')
    expect(circles.length).toBe(baseData.length)
  })

  it('does not crash when data has zero items', () => {
    expect(() =>
      render(<ScatterBubbleChart data={[]} width={400} height={400} />),
    ).not.toThrow()
  })

  it('protagonist departments get darker stroke via highlightDaneCodes', () => {
    render(
      <ScatterBubbleChart
        data={baseData}
        width={400}
        height={400}
        highlightDaneCodes={PROTAGONIST_CODES}
      />,
    )

    // Huila ('41') and Caldas ('17') are protagonists — should have the protagonist stroke color
    const huilaCircle = document.querySelector('circle[data-dane-code="41"]')
    const otroCircle = document.querySelector('circle[data-dane-code="99"]')

    expect(huilaCircle).not.toBeNull()
    expect(otroCircle).not.toBeNull()

    // Protagonists have stroke="#8A5A2B", non-protagonists have stroke="rgba(107,111,78,0.5)"
    expect(huilaCircle?.getAttribute('stroke')).toBe('#8A5A2B')
    expect(otroCircle?.getAttribute('stroke')).toBe('rgba(107,111,78,0.5)')
  })

  it('shows tooltip on mouseenter and hides on mouseleave', () => {
    render(
      <ScatterBubbleChart data={baseData} width={400} height={400} />,
    )

    // No tooltip initially
    expect(screen.queryByTestId('scatter-tooltip')).toBeNull()

    // Trigger mouseenter on first circle
    const firstCircle = document.querySelector('circle[data-dane-code]')!
    fireEvent.mouseEnter(firstCircle)
    expect(screen.getByTestId('scatter-tooltip')).toBeInTheDocument()

    // Trigger mouseleave
    fireEvent.mouseLeave(firstCircle)
    expect(screen.queryByTestId('scatter-tooltip')).toBeNull()
  })
})
