/**
 * Static analysis guards — project-wide.
 *
 * Spec: "No d3.select on SVG elements", "Components never receive raw API field names".
 * Tasks: 6.13, 6.14
 *
 * These tests scan source text (without importing modules) to enforce architecture rules.
 * They run as part of the normal vitest suite so CI catches violations immediately.
 */

import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// 6.13 — No d3.select in visualization source files
// ---------------------------------------------------------------------------

describe('Static guard: no d3.select in visualization layer', () => {
  it('LineChart.tsx has no d3.select call', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/visualizations/LineChart.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/visualizations/LineChart.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '') // strip block comments
      .replace(/\/\/.*/g, '')           // strip line comments
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })

  it('ChoroplethMap.tsx has no d3.select call', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/visualizations/ChoroplethMap.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/visualizations/ChoroplethMap.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })

  it('StickyVisualization.tsx has no d3.select call', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/visualizations/StickyVisualization.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/visualizations/StickyVisualization.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })

  it('Scrollytelling.tsx has no d3.select call', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/components/Scrollytelling.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/components/Scrollytelling.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })

  it('ScatterBubbleChart.tsx has no d3.select call', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/visualizations/ScatterBubbleChart.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/visualizations/ScatterBubbleChart.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })

  it('SlopeChart.tsx has no d3.select call', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/visualizations/SlopeChart.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/visualizations/SlopeChart.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })

  it('LollipopChart.tsx has no d3.select call', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/visualizations/LollipopChart.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/visualizations/LollipopChart.tsx'] as string
    const source = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*/g, '')
    expect(source).not.toContain('d3.select(')
    expect(source).not.toContain('.transition(')
  })
})

// ---------------------------------------------------------------------------
// 6.14 — No raw Socrata field names outside data/ layer
// ---------------------------------------------------------------------------

const RAW_FIELDS = [
  'producci_n_t',
  'rea_sembrada_ha',
  'c_d_dep',
  'c_digo_dane_departamento',
]

// We scan component and feature files — raw fields must stay inside src/data/.
describe('Static guard: no raw API field names in feature/component layers', () => {
  it('Scrollytelling.tsx contains no raw Socrata field names', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/components/Scrollytelling.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/components/Scrollytelling.tsx'] as string
    for (const field of RAW_FIELDS) {
      expect(raw, `Found raw field "${field}" in Scrollytelling.tsx`).not.toContain(field)
    }
  })

  it('StickyVisualization.tsx contains no raw Socrata field names', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/visualizations/StickyVisualization.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/visualizations/StickyVisualization.tsx'] as string
    for (const field of RAW_FIELDS) {
      expect(raw, `Found raw field "${field}" in StickyVisualization.tsx`).not.toContain(field)
    }
  })

  it('chapters.ts contains no raw Socrata field names', async () => {
    const modules = import.meta.glob(
      '../features/coffee-story/content/chapters.ts',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../features/coffee-story/content/chapters.ts'] as string
    for (const field of RAW_FIELDS) {
      expect(raw, `Found raw field "${field}" in chapters.ts`).not.toContain(field)
    }
  })

  it('App.tsx contains no raw Socrata field names', async () => {
    const modules = import.meta.glob(
      '../app/App.tsx',
      { query: '?raw', import: 'default', eager: true },
    )
    const raw = modules['../app/App.tsx'] as string
    for (const field of RAW_FIELDS) {
      expect(raw, `Found raw field "${field}" in App.tsx`).not.toContain(field)
    }
  })
})
