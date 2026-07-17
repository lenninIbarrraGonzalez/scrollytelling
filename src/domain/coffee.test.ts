import { describe, it, expect } from 'vitest'
import type {
  YearDatum,
  DepartmentProduction,
  ChapterSource,
  Chapter,
  NationalSeries,
  DepartmentSeries,
} from './coffee'

// ---------------------------------------------------------------------------
// Task 2.1 — Type-level constraints
// ---------------------------------------------------------------------------

describe('YearDatum — structure', () => {
  it('production field is typed as number (not string)', () => {
    const datum: YearDatum = { year: 2012, production: 626798 }
    // If production were string, assigning a number would be a TS error.
    expect(typeof datum.production).toBe('number')
    expect(datum.production).toBe(626798)
  })

  it('year field is typed as number', () => {
    const datum: YearDatum = { year: 1999, production: 547000 }
    expect(typeof datum.year).toBe('number')
    expect(datum.year).toBe(1999)
  })
})

describe('DepartmentProduction — structure', () => {
  it('required fields map correctly', () => {
    const dp: DepartmentProduction = {
      daneCode: '41',
      department: 'Huila',
      year: 2012,
      production: 626798,
    }
    expect(dp.daneCode).toBe('41')
    expect(dp.department).toBe('Huila')
    expect(dp.year).toBe(2012)
    expect(dp.production).toBe(626798)
  })

  it('optional fields can be absent', () => {
    const dp: DepartmentProduction = {
      daneCode: '17',
      department: 'Caldas',
      year: 2007,
      production: 100000,
    }
    expect(dp.areaHarvested).toBeUndefined()
    expect(dp.yield).toBeUndefined()
  })

  it('optional fields can be present', () => {
    const dp: DepartmentProduction = {
      daneCode: '41',
      department: 'Huila',
      year: 2012,
      production: 626798,
      areaHarvested: 95432.5,
      yield: 6.56,
    }
    expect(dp.areaHarvested).toBe(95432.5)
    expect(typeof dp.areaHarvested).toBe('number')
  })
})

describe('ChapterSource — union values', () => {
  it('accepts FAO', () => {
    const src: ChapterSource = 'FAO'
    expect(src).toBe('FAO')
  })

  it('accepts EVA', () => {
    const src: ChapterSource = 'EVA'
    expect(src).toBe('EVA')
  })
})

describe('Chapter — structure', () => {
  it('required fields construct correctly', () => {
    const ch: Chapter = {
      id: 'chapter-1',
      index: 0,
      source: 'FAO',
      viz: 'line',
      title: '1990s Auge',
      body: 'Colombia reached peak production in the 1990s.',
    }
    expect(ch.id).toBe('chapter-1')
    expect(ch.source).toBe('FAO')
    expect(ch.viz).toBe('line')
  })

  it('viz field accepts choropleth', () => {
    const ch: Chapter = {
      id: 'chapter-3',
      index: 2,
      source: 'EVA',
      viz: 'choropleth',
      title: 'La Roya',
      body: 'The coffee rust crisis hit hardest in 2012.',
    }
    expect(ch.viz).toBe('choropleth')
    expect(ch.source).toBe('EVA')
  })

  it('optional highlightDaneCodes can be provided', () => {
    const ch: Chapter = {
      id: 'chapter-3',
      index: 2,
      source: 'EVA',
      viz: 'choropleth',
      title: 'La Roya',
      body: 'The coffee rust crisis.',
      highlightDaneCodes: ['41', '17', '63', '66', '05', '73'],
    }
    expect(ch.highlightDaneCodes).toContain('41')
    expect(ch.highlightDaneCodes).toHaveLength(6)
  })

  it('optional annotations can be provided', () => {
    const ch: Chapter = {
      id: 'chapter-4',
      index: 3,
      source: 'EVA',
      viz: 'choropleth',
      title: 'Recovery',
      body: 'Recovery after la roya.',
      annotations: [{ year: 2021, label: 'La Niña' }],
    }
    expect(ch.annotations).toHaveLength(1)
    expect(ch.annotations?.[0]?.label).toBe('La Niña')
    expect(ch.annotations?.[0]?.year).toBe(2021)
  })
})

describe('NationalSeries and DepartmentSeries — type aliases', () => {
  it('NationalSeries is an array of YearDatum', () => {
    const series: NationalSeries = [
      { year: 1990, production: 1100000 },
      { year: 1999, production: 547000 },
    ]
    expect(series).toHaveLength(2)
    expect(series[0]?.year).toBe(1990)
  })

  it('DepartmentSeries is an array of DepartmentProduction', () => {
    const series: DepartmentSeries = [
      { daneCode: '41', department: 'Huila', year: 2007, production: 200000 },
      { daneCode: '17', department: 'Caldas', year: 2007, production: 150000 },
    ]
    expect(series).toHaveLength(2)
    expect(series[1]?.daneCode).toBe('17')
  })
})

// ---------------------------------------------------------------------------
// Type-error assertions (compile-time only — verified via @ts-expect-error)
// ---------------------------------------------------------------------------

describe('Chapter — @ts-expect-error compile-time checks', () => {
  it('id field is required — missing id would be a TS compile error', () => {
    // The following would be a TS compile error without the @ts-expect-error:
    // @ts-expect-error — id is required
    const _invalid: Chapter = {
      index: 0,
      source: 'FAO',
      viz: 'line',
      title: 'Test',
      body: 'Body',
    }
    // If the line above does NOT produce a TS error, this test fails at compile time.
    // At runtime we just confirm the variable exists (the TS error was the real check).
    expect(_invalid).toBeDefined()
  })

  it('production on YearDatum must be a number — string would be a TS compile error', () => {
    // @ts-expect-error — production must be number, not string
    const _invalid: YearDatum = { year: 2012, production: '626798' }
    expect(_invalid).toBeDefined()
  })
})
