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
  it('exports exactly 5 chapters', () => {
    expect(chapters).toHaveLength(5)
  })

  it('each element satisfies the Chapter type shape', () => {
    for (const ch of chapters) {
      const typed: Chapter = ch
      expect(typed.id).toBeTruthy()
      expect(typed.index).toBeTypeOf('number')
      expect(['FAO', 'EVA']).toContain(typed.source)
      expect(['line', 'choropleth']).toContain(typed.viz)
      expect(typed.title).toBeTruthy()
      expect(typed.body).toBeTruthy()
    }
  })

  it('chapter indexes are 0–4 in order', () => {
    const indexes = chapters.map((ch) => ch.index)
    expect(indexes).toEqual([0, 1, 2, 3, 4])
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
})
