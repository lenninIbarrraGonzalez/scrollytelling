/**
 * Tests for chapters.ts typed content.
 *
 * Spec: "Typed Chapter Content", "2021 La Niña annotated", protagonist highlight.
 * Tasks: 3c.1 RED
 */

import { describe, it, expect } from 'vitest'
import type { Chapter } from '../../../domain/coffee'

// RED: import fails until module exists.
import { chapters } from './chapters'

describe('chapters content', () => {
  it('exports exactly 7 chapters', () => {
    expect(chapters).toHaveLength(7)
  })

  it('each element satisfies the Chapter type shape', () => {
    for (const ch of chapters) {
      const typed: Chapter = ch
      expect(typed.id).toBeTruthy()
      expect(typed.index).toBeTypeOf('number')
      expect(['FAO', 'EVA']).toContain(typed.source)
      expect(['line', 'choropleth', 'scatter', 'slope']).toContain(typed.viz)
      expect(typed.title).toBeTruthy()
      expect(typed.body).toBeTruthy()
    }
  })

  it('chapter indexes are 0–6 in order', () => {
    const indexes = chapters.map((ch) => ch.index)
    expect(indexes).toEqual([0, 1, 2, 3, 4, 5, 6])
  })

  it('chapters[0].source is FAO (national series, 1990s auge)', () => {
    expect(chapters[0].source).toBe('FAO')
  })

  it('chapters[1].source is FAO (2000 collapse, still national series)', () => {
    expect(chapters[1].source).toBe('FAO')
  })

  it('chapters[2].source is EVA (roya, departmental data starts here)', () => {
    expect(chapters[2].source).toBe('EVA')
  })

  it('chapters[0].viz is line (FAO chapters use line chart)', () => {
    expect(chapters[0].viz).toBe('line')
  })

  it('chapters[2].viz is choropleth (EVA chapters use choropleth)', () => {
    expect(chapters[2].viz).toBe('choropleth')
  })

  it('chapters[4].highlightDaneCodes includes "41" (Huila)', () => {
    expect(chapters[4].highlightDaneCodes).toContain('41')
  })

  it('at least one chapter has a La Niña annotation', () => {
    const withLaNina = chapters.filter((ch) =>
      ch.annotations?.some((a) => a.label.includes('La Niña')),
    )
    expect(withLaNina.length).toBeGreaterThanOrEqual(1)
  })

  it('all chapter ids are unique', () => {
    const ids = chapters.map((ch) => ch.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('choropleth chapters have highlightDaneCodes including Huila and eje cafetero', () => {
    const protagonistCodes = ['41', '17', '63', '66', '05', '73']
    const choroplethChapters = chapters.filter((ch) => ch.viz === 'choropleth')
    expect(choroplethChapters.length).toBeGreaterThan(0)
    for (const ch of choroplethChapters) {
      expect(ch.highlightDaneCodes).toBeDefined()
      // Each choropleth chapter must include Huila at minimum
      expect(ch.highlightDaneCodes).toContain('41')
      // All declared protagonist codes must be present
      for (const code of protagonistCodes) {
        expect(ch.highlightDaneCodes).toContain(code)
      }
    }
  })

  // PR2 — chapters 6 and 7 (indexes 5 and 6)
  it('chapters[5].viz is scatter', () => {
    expect(chapters[5].viz).toBe('scatter')
  })

  it('chapters[5].source is EVA', () => {
    expect(chapters[5].source).toBe('EVA')
  })

  it('chapters[5].highlightDaneCodes includes "41" (Huila)', () => {
    expect(chapters[5].highlightDaneCodes).toContain('41')
  })

  it('chapters[6].viz is slope', () => {
    expect(chapters[6].viz).toBe('slope')
  })

  it('chapters[6].source is EVA', () => {
    expect(chapters[6].source).toBe('EVA')
  })

  it('chapters[6].rankingYears is [2007, 2024]', () => {
    expect(chapters[6].rankingYears).toEqual([2007, 2024])
  })

  it('chapters[6].highlightDaneCodes includes all protagonist codes', () => {
    const protagonistCodes = ['41', '17', '63', '66', '05', '73']
    for (const code of protagonistCodes) {
      expect(chapters[6].highlightDaneCodes).toContain(code)
    }
  })
})
