/**
 * Tests for ColorLegend — pure presentational swatch bar component.
 *
 * Spec: REQ-CM-09–13
 * Design: Pure <g> component; steps <rect> swatches; min/max <text> labels.
 *         No hooks, no store access, no side effects.
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { scaleSequential, interpolateYlOrRd } from 'd3'

// RED: import fails until ColorLegend.tsx is created.
import { ColorLegend } from './ColorLegend'

const colorScale = (v: number) =>
  scaleSequential(interpolateYlOrRd).domain([0, 100])(v)

describe('ColorLegend', () => {
  it('renders exactly steps (default 6) <rect> elements', () => {
    const { container } = render(
      <svg>
        <ColorLegend colorScale={colorScale} domainExtent={[0, 100]} />
      </svg>,
    )
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(6)
  })

  it('renders exactly the requested number of steps', () => {
    const { container } = render(
      <svg>
        <ColorLegend colorScale={colorScale} domainExtent={[0, 100]} steps={4} />
      </svg>,
    )
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(4)
  })

  it('each <rect> has a fill matching colorScale output for the sampled value', () => {
    const steps = 6
    const domainExtent: [number, number] = [0, 100]
    const { container } = render(
      <svg>
        <ColorLegend colorScale={colorScale} domainExtent={domainExtent} steps={steps} />
      </svg>,
    )
    const rects = Array.from(container.querySelectorAll('rect'))
    expect(rects).toHaveLength(steps)

    // Each rect fill should equal colorScale(sampleValue) for evenly spaced samples
    const [min, max] = domainExtent
    rects.forEach((rect, i) => {
      const t = steps === 1 ? 0 : i / (steps - 1)
      const sampleValue = min + t * (max - min)
      const expectedFill = colorScale(sampleValue)
      expect(rect.getAttribute('fill')).toBe(expectedFill)
    })
  })

  it('renders min and max <text> labels from domainExtent', () => {
    const { container } = render(
      <svg>
        <ColorLegend colorScale={colorScale} domainExtent={[10, 500]} />
      </svg>,
    )
    const texts = Array.from(container.querySelectorAll('text'))
    const textContents = texts.map((t) => t.textContent ?? '')
    expect(textContents.some((t) => t.includes('10'))).toBe(true)
    expect(textContents.some((t) => t.includes('500'))).toBe(true)
  })

  it('does NOT use useState, useEffect, useStore, or useScrollStore (source guard)', async () => {
    const modules = import.meta.glob('./ColorLegend.tsx', {
      query: '?raw',
      import: 'default',
      eager: true,
    })
    const raw = modules['./ColorLegend.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('useState')
    expect(source).not.toContain('useEffect')
    expect(source).not.toContain('useStore')
    expect(source).not.toContain('useScrollStore')
  })
})
