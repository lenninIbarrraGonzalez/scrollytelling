/**
 * Tests for Scrollytelling container.
 *
 * Spec: scroll-narrative integration smoke, load/error states via App wiring.
 * Tasks: 6.4 RED
 *
 * Mocking strategy:
 *   - StickyVisualization: vi.mock to avoid D3/geo complexity in integration tests.
 *   - useActiveChapter: vi.mock — no real IntersectionObserver in jsdom.
 *   - useScrollStore: used directly; Zustand works in jsdom.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { Chapter } from '../../../domain/coffee'

// Provide minimal mocks before importing the component under test.

// Mock StickyVisualization to avoid D3/geo complexity in layout tests.
vi.mock('../visualizations/StickyVisualization', () => ({
  StickyVisualization: () => <div data-testid="sticky-viz-mock" />,
}))

// Mock useActiveChapter — no real IntersectionObserver in jsdom.
vi.mock('../hooks/useActiveChapter', () => ({
  useActiveChapter: vi.fn(),
}))

// Mock useD3Scales to avoid needing real domain extents in tests.
vi.mock('../visualizations/useD3Scales', () => ({
  useD3Scales: () => ({
    xScale: (v: number) => v,
    yScale: (v: number) => v,
    colorScale: () => '#ccc',
  }),
}))

// RED: import fails until module exists.
import { Scrollytelling } from './Scrollytelling'
import { useScrollStore } from '../store/scrollStore'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockChapters: Chapter[] = [
  {
    id: 'ch-1',
    index: 0,
    source: 'FAO',
    viz: 'line',
    title: 'Title 1',
    body: 'Body 1',
  },
  {
    id: 'ch-2',
    index: 1,
    source: 'FAO',
    viz: 'line',
    title: 'Title 2',
    body: 'Body 2',
  },
  {
    id: 'ch-3',
    index: 2,
    source: 'EVA',
    viz: 'choropleth',
    title: 'Title 3',
    body: 'Body 3',
    highlightDaneCodes: ['41'],
  },
  {
    id: 'ch-4',
    index: 3,
    source: 'EVA',
    viz: 'choropleth',
    title: 'Title 4',
    body: 'Body 4',
    highlightDaneCodes: ['41'],
  },
  {
    id: 'ch-5',
    index: 4,
    source: 'EVA',
    viz: 'choropleth',
    title: 'Title 5',
    body: 'Body 5',
    highlightDaneCodes: ['41'],
  },
]

const mockNationalSeries = [
  { year: 2000, production: 600000 },
  { year: 2001, production: 620000 },
]

const mockDepartmentSeries = [
  { daneCode: '41', department: 'Huila', year: 2010, production: 150000 },
]

const mockGeoFeatures = {
  type: 'FeatureCollection' as const,
  features: [],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scrollytelling', () => {
  beforeEach(() => {
    // Reset store between tests
    useScrollStore.setState({ activeChapterId: null })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders a chapter sentinel div for each chapter (5 total)', () => {
    render(
      <Scrollytelling
        chapters={mockChapters}
        nationalSeries={mockNationalSeries}
        departmentSeries={mockDepartmentSeries}
        geoFeatures={mockGeoFeatures}
      />,
    )

    const sentinels = document.querySelectorAll('[data-chapter-id]')
    expect(sentinels).toHaveLength(5)
  })

  it('each sentinel has a data-chapter-id matching the chapter id', () => {
    render(
      <Scrollytelling
        chapters={mockChapters}
        nationalSeries={mockNationalSeries}
        departmentSeries={mockDepartmentSeries}
        geoFeatures={mockGeoFeatures}
      />,
    )

    for (const ch of mockChapters) {
      const sentinel = document.querySelector(`[data-chapter-id="${ch.id}"]`)
      expect(sentinel).toBeInTheDocument()
    }
  })

  it('renders the sticky visualization column', () => {
    render(
      <Scrollytelling
        chapters={mockChapters}
        nationalSeries={mockNationalSeries}
        departmentSeries={mockDepartmentSeries}
        geoFeatures={mockGeoFeatures}
      />,
    )

    // The mock StickyVisualization renders with data-testid="sticky-viz-mock"
    expect(screen.getByTestId('sticky-viz-mock')).toBeInTheDocument()
  })

  it('has a 2-column layout wrapper element', () => {
    const { container } = render(
      <Scrollytelling
        chapters={mockChapters}
        nationalSeries={mockNationalSeries}
        departmentSeries={mockDepartmentSeries}
        geoFeatures={mockGeoFeatures}
      />,
    )

    // The outer grid wrapper should be present
    const wrapper = container.querySelector('[data-testid="scrollytelling-grid"]')
    expect(wrapper).toBeInTheDocument()
  })
})
