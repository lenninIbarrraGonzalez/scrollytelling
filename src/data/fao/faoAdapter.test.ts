import { describe, it, expect } from 'vitest'
import { parseFaoCSV } from './faoAdapter'

// ---------------------------------------------------------------------------
// Inline CSV fixture — mirrors ACTUAL OWiD coffee-production-by-region.csv format
// Header verified 2026-07-17: Entity,Code,Year,Green coffee - Production (tonnes)
// ---------------------------------------------------------------------------
const FIXTURE_CSV = `Entity,Code,Year,Green coffee - Production (tonnes)
Colombia,COL,1990,1065000
Colombia,COL,1995,900000
Colombia,COL,1999,547000
Colombia,COL,2000,630000
Colombia,COL,2001,600000
Colombia,COL,2005,682000
Colombia,COL,2006,688000
Brazil,BRA,1990,1200000
Brazil,BRA,1999,1400000
`

describe('parseFaoCSV', () => {
  it('returns NationalSeries (array of YearDatum objects)', () => {
    const series = parseFaoCSV(FIXTURE_CSV)
    expect(Array.isArray(series)).toBe(true)
    expect(series.length).toBeGreaterThan(0)
    expect(typeof series[0].year).toBe('number')
    expect(typeof series[0].production).toBe('number')
  })

  it('filters to Colombia only — Brazil rows excluded', () => {
    const series = parseFaoCSV(FIXTURE_CSV)
    // If Brazil were included we would have > 7 entries; fixture has 7 Colombia rows
    expect(series).toHaveLength(7)
    series.forEach(d => {
      expect(d.year).toBeGreaterThanOrEqual(1990)
    })
  })

  it('year 1999 trough production is approximately 547,000 within ±10,000', () => {
    const series = parseFaoCSV(FIXTURE_CSV)
    const row1999 = series.find(d => d.year === 1999)
    expect(row1999).toBeDefined()
    expect(row1999!.production).toBeGreaterThanOrEqual(537000)
    expect(row1999!.production).toBeLessThanOrEqual(557000)
  })

  it('series minimum year is <= 1990', () => {
    const series = parseFaoCSV(FIXTURE_CSV)
    const minYear = Math.min(...series.map(d => d.year))
    expect(minYear).toBeLessThanOrEqual(1990)
  })

  it('year 1990 peak is approximately 1,065,000', () => {
    const series = parseFaoCSV(FIXTURE_CSV)
    const row1990 = series.find(d => d.year === 1990)
    expect(row1990).toBeDefined()
    expect(row1990!.production).toBeCloseTo(1065000, -4)
  })

  it('production values are numbers, not strings', () => {
    const series = parseFaoCSV(FIXTURE_CSV)
    series.forEach(d => {
      expect(typeof d.production).toBe('number')
      expect(typeof d.year).toBe('number')
    })
  })

  it('restricts series to 1990–2006 range', () => {
    // All fixture rows are within range — but adapter should not include rows outside it
    const csvWithOutOfRange = FIXTURE_CSV + 'Colombia,COL,2010,700000\n'
    const series = parseFaoCSV(csvWithOutOfRange)
    const years = series.map(d => d.year)
    expect(Math.max(...years)).toBeLessThanOrEqual(2006)
  })
})
