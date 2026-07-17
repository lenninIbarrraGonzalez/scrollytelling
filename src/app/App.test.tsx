/**
 * Tests for App.tsx — load/error/data states with useCoffeeData.
 *
 * Spec: "Load and error states"
 * Tasks: 6.7 RED
 *
 * Mocking strategy:
 *   - useCoffeeData: vi.mock so no network calls in tests.
 *   - Scrollytelling: vi.mock to avoid deep rendering (tested separately).
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

// Mock useCoffeeData before importing App.
vi.mock('../data/useCoffeeData', () => ({
  useCoffeeData: vi.fn(),
}))

// Mock Scrollytelling to keep App tests focused on load/error branching.
vi.mock('../features/coffee-story/components/Scrollytelling', () => ({
  Scrollytelling: () => <div data-testid="scrollytelling-mock">Scrollytelling</div>,
}))

import App from './App'
import { useCoffeeData } from '../data/useCoffeeData'

const mockUseCoffeeData = vi.mocked(useCoffeeData)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockData = {
  nationalSeries: [{ year: 2000, production: 500000 }],
  departmentSeries: [{ daneCode: '41', department: 'Huila', year: 2010, production: 150000 }],
  geoFeatures: { type: 'FeatureCollection' as const, features: [] },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('App', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders a loading indicator when loading is true', () => {
    mockUseCoffeeData.mockReturnValue({ data: null, loading: true, error: null })

    render(<App />)

    // Should show some form of loading text or indicator.
    const loadingEl = screen.getByTestId('loading-state')
    expect(loadingEl).toBeInTheDocument()
  })

  it('renders an error message when error is non-null', () => {
    const testError = new Error('Network error')
    mockUseCoffeeData.mockReturnValue({ data: null, loading: false, error: testError })

    render(<App />)

    const errorEl = screen.getByTestId('error-state')
    expect(errorEl).toBeInTheDocument()
    expect(errorEl.textContent).toContain('Network error')
  })

  it('renders Scrollytelling when data is available', () => {
    mockUseCoffeeData.mockReturnValue({ data: mockData, loading: false, error: null })

    render(<App />)

    expect(screen.getByTestId('scrollytelling-mock')).toBeInTheDocument()
  })

  it('does not render Scrollytelling while loading', () => {
    mockUseCoffeeData.mockReturnValue({ data: null, loading: true, error: null })

    render(<App />)

    expect(screen.queryByTestId('scrollytelling-mock')).not.toBeInTheDocument()
  })

  it('does not render Scrollytelling when error occurs', () => {
    mockUseCoffeeData.mockReturnValue({
      data: null,
      loading: false,
      error: new Error('Failed'),
    })

    render(<App />)

    expect(screen.queryByTestId('scrollytelling-mock')).not.toBeInTheDocument()
  })
})
