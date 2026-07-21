/** Tests for LollipopChart — D3↔React lollipop chart for weighted national yield. */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import type { YieldDatum } from '../../../domain/coffee'

// RED: import fails until module exists.
import { LollipopChart } from './LollipopChart'

const baseData: YieldDatum[] = [
  { year: 2007, production: 810000, areaHarvested: 900000, yield: 0.9 },
  { year: 2010, production: 720000, areaHarvested: 800000, yield: 0.9 },
  { year: 2015, production: 960000, areaHarvested: 800000, yield: 1.2 },
  { year: 2020, production: 1100000, areaHarvested: 850000, yield: 1.29 },
]

afterEach(() => cleanup())

describe('LollipopChart', () => {
  it('renders without crashing with empty data', () => {
    render(<LollipopChart data={[]} width={600} height={500} />)
    expect(screen.getByTestId('lollipop-chart')).toBeInTheDocument()
  })

  it('does not crash when data has zero items', () => {
    expect(() =>
      render(<LollipopChart data={[]} width={600} height={500} />),
    ).not.toThrow()
  })

  it('renders one stem per datum', () => {
    render(<LollipopChart data={baseData} width={600} height={500} />)
    const stems = document.querySelectorAll('line[data-year]')
    expect(stems.length).toBe(baseData.length)
  })

  it('renders one circle per datum', () => {
    render(<LollipopChart data={baseData} width={600} height={500} />)
    const circles = document.querySelectorAll('circle[data-year]')
    expect(circles.length).toBe(baseData.length)
  })

  it('shows tooltip with year and yield on mouseenter', () => {
    render(<LollipopChart data={baseData} width={600} height={500} />)

    expect(screen.queryByTestId('lollipop-tooltip')).toBeNull()

    const firstCircle = document.querySelector('circle[data-year]')!
    fireEvent.mouseEnter(firstCircle)
    expect(screen.getByTestId('lollipop-tooltip')).toBeInTheDocument()
  })

  it('hides tooltip on mouseleave', () => {
    render(<LollipopChart data={baseData} width={600} height={500} />)

    const firstCircle = document.querySelector('circle[data-year]')!
    fireEvent.mouseEnter(firstCircle)
    expect(screen.getByTestId('lollipop-tooltip')).toBeInTheDocument()
    fireEvent.mouseLeave(firstCircle)
    expect(screen.queryByTestId('lollipop-tooltip')).toBeNull()
  })

  it('renders Y axis label "t/ha"', () => {
    render(<LollipopChart data={baseData} width={600} height={500} />)
    expect(screen.getByText('t/ha')).toBeInTheDocument()
  })
})
