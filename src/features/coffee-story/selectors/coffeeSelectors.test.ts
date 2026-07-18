/** Unit tests for coffeeSelectors.ts — pure functions, no React/DOM/D3. */

import { describe, it, expect } from 'vitest'
import type { DepartmentProduction } from '../../../domain/coffee'
import {
  SLOPE_TOP_N,
  buildScatterData,
  buildSlopeData,
  buildWeightedYieldSeries,
} from './coffeeSelectors'

// ---------------------------------------------------------------------------
// Fixture factory
// ---------------------------------------------------------------------------

function makeDept(
  daneCode: string,
  department: string,
  year: number,
  production: number,
  areaHarvested: number,
  yieldVal: number,
): DepartmentProduction {
  return { daneCode, department, year, production, areaHarvested, yield: yieldVal }
}

// ---------------------------------------------------------------------------
// SLOPE_TOP_N
// ---------------------------------------------------------------------------

describe('SLOPE_TOP_N', () => {
  it('exports value 10', () => {
    expect(SLOPE_TOP_N).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// buildScatterData
// ---------------------------------------------------------------------------

describe('buildScatterData', () => {
  it('returns empty array on empty input', () => {
    const result = buildScatterData([], 2020)
    // Empty because there is no input data — production code ran and filtered nothing
    expect(result).toHaveLength(0)
  })

  it('excludes rows where areaHarvested is 0', () => {
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2020, 100, 0, 10),   // areaHarvested === 0 → excluded
      makeDept('17', 'Caldas', 2020, 200, 50, 4),   // valid → included
    ]
    const result = buildScatterData(series, 2020)
    expect(result).toHaveLength(1)
    expect(result[0].daneCode).toBe('17')
  })

  it('excludes rows where production is 0', () => {
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2020, 0, 80, 10),     // production === 0 → excluded
      makeDept('17', 'Caldas', 2020, 200, 50, 4),   // valid → included
    ]
    const result = buildScatterData(series, 2020)
    expect(result).toHaveLength(1)
    expect(result[0].daneCode).toBe('17')
  })

  it('excludes rows where yield is 0', () => {
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2020, 100, 80, 0),    // yield === 0 → excluded
      makeDept('17', 'Caldas', 2020, 200, 50, 4),   // valid → included
    ]
    const result = buildScatterData(series, 2020)
    expect(result).toHaveLength(1)
    expect(result[0].daneCode).toBe('17')
  })

  it('excludes rows for a different year', () => {
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2019, 100, 80, 10),   // wrong year → excluded
      makeDept('17', 'Caldas', 2020, 200, 50, 4),   // correct year → included
    ]
    const result = buildScatterData(series, 2020)
    expect(result).toHaveLength(1)
    expect(result[0].daneCode).toBe('17')
  })

  it('returns correct ScatterDatum fields for a valid row', () => {
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2020, 150, 75, 2),
    ]
    const result = buildScatterData(series, 2020)
    expect(result).toHaveLength(1)
    const datum = result[0]
    expect(datum.daneCode).toBe('41')
    expect(datum.department).toBe('Huila')
    expect(datum.production).toBe(150)
    expect(datum.areaHarvested).toBe(75)
    expect(datum.yield).toBe(2)
  })

  it('maps multiple valid rows for the given year', () => {
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2020, 150, 75, 2),
      makeDept('17', 'Caldas', 2020, 80, 40, 2),
      makeDept('05', 'Antioquia', 2019, 60, 30, 2), // wrong year → excluded
    ]
    const result = buildScatterData(series, 2020)
    expect(result).toHaveLength(2)
    const codes = result.map((d) => d.daneCode)
    expect(codes).toContain('41')
    expect(codes).toContain('17')
    expect(codes).not.toContain('05')
  })
})

// ---------------------------------------------------------------------------
// buildWeightedYieldSeries
// ---------------------------------------------------------------------------

describe('buildWeightedYieldSeries', () => {
  it('returns empty array on empty input', () => {
    const result = buildWeightedYieldSeries([])
    expect(result).toHaveLength(0)
  })

  it('computes weighted national yield as Σprod/Σarea, NOT average of individual yields', () => {
    // Two depts, year 2010:
    //   Dept A: production=100, area=10  → individual yield 10
    //   Dept B: production=200, area=20  → individual yield 10
    // Arithmetic mean of individual yields = 10
    // Weighted yield = (100+200)/(10+20) = 300/30 = 10.0
    // Both approaches produce same result here — use a case that distinguishes them:
    //   Dept A: production=100, area=10  → individual yield 10
    //   Dept B: production=200, area=40  → individual yield 5
    // Arithmetic mean = (10+5)/2 = 7.5
    // Weighted yield = (100+200)/(10+40) = 300/50 = 6.0  ← DIFFERENT
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2010, 100, 10, 10),
      makeDept('17', 'Caldas', 2010, 200, 40, 5),
    ]
    const result = buildWeightedYieldSeries(series)
    expect(result).toHaveLength(1)
    expect(result[0].year).toBe(2010)
    // Weighted: (100+200)/(10+40) = 300/50 = 6.0
    // Arithmetic mean of yields: (10+5)/2 = 7.5  ← this would FAIL
    expect(result[0].yield).toBeCloseTo(6.0)
  })

  it('excludes rows with areaHarvested 0 from both numerator and denominator', () => {
    // Dept A: area=0 → excluded from sum entirely
    // Dept B: production=200, area=50
    // Result yield = 200/50 = 4.0
    // If Dept A's production (100) were included: (100+200)/50 = 6.0  ← wrong
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2015, 100, 0, 0),    // areaHarvested=0 → excluded
      makeDept('17', 'Caldas', 2015, 200, 50, 4),  // valid
    ]
    const result = buildWeightedYieldSeries(series)
    expect(result).toHaveLength(1)
    expect(result[0].year).toBe(2015)
    expect(result[0].yield).toBeCloseTo(4.0)
  })

  it('skips years where all rows have areaHarvested 0 (avoid divide-by-zero)', () => {
    // Year 2000: only row has area=0 → no valid denominator → year skipped
    // Year 2010: valid row
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2000, 100, 0, 0),
      makeDept('17', 'Caldas', 2010, 200, 50, 4),
    ]
    const result = buildWeightedYieldSeries(series)
    expect(result).toHaveLength(1)
    expect(result[0].year).toBe(2010)
  })

  it('returns results sorted by year ascending', () => {
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2015, 100, 10, 10),
      makeDept('17', 'Caldas', 2010, 200, 40, 5),
      makeDept('63', 'Quindío', 2012, 80, 20, 4),
    ]
    const result = buildWeightedYieldSeries(series)
    expect(result).toHaveLength(3)
    expect(result[0].year).toBe(2010)
    expect(result[1].year).toBe(2012)
    expect(result[2].year).toBe(2015)
  })
})

// ---------------------------------------------------------------------------
// buildSlopeData
// ---------------------------------------------------------------------------

describe('buildSlopeData', () => {
  it('returns empty array on empty input', () => {
    const result = buildSlopeData([], 2007, 2024, 10)
    expect(result).toHaveLength(0)
  })

  it('ranks are 1-indexed, rank 1 is highest production for that year', () => {
    // 3 depts for yearA=2007, yearB=2024
    // YearA productions: 05=300, 41=200, 17=100
    // YearB productions: 05=400, 41=500, 17=150
    const series: DepartmentProduction[] = [
      makeDept('05', 'Antioquia', 2007, 300, 50, 6),
      makeDept('41', 'Huila',     2007, 200, 40, 5),
      makeDept('17', 'Caldas',    2007, 100, 20, 5),
      makeDept('05', 'Antioquia', 2024, 400, 60, 6.67),
      makeDept('41', 'Huila',     2024, 500, 80, 6.25),
      makeDept('17', 'Caldas',    2024, 150, 25, 6),
    ]
    const result = buildSlopeData(series, 2007, 2024, 10)
    const huila = result.find((d) => d.daneCode === '41')!
    const antioquia = result.find((d) => d.daneCode === '05')!
    const caldas = result.find((d) => d.daneCode === '17')!

    // YearA: 05=rank1(300), 41=rank2(200), 17=rank3(100)
    expect(antioquia.rankA).toBe(1)
    expect(huila.rankA).toBe(2)
    expect(caldas.rankA).toBe(3)

    // YearB: 41=rank1(500), 05=rank2(400), 17=rank3(150)
    expect(huila.rankB).toBe(1)
    expect(antioquia.rankB).toBe(2)
    expect(caldas.rankB).toBe(3)
  })

  it('returns correct SlopeDatum fields', () => {
    const series: DepartmentProduction[] = [
      makeDept('41', 'Huila', 2007, 200, 40, 5),
      makeDept('41', 'Huila', 2024, 500, 80, 6.25),
    ]
    const result = buildSlopeData(series, 2007, 2024, 10)
    expect(result).toHaveLength(1)
    const datum = result[0]
    expect(datum.daneCode).toBe('41')
    expect(datum.department).toBe('Huila')
    expect(datum.rankA).toBe(1)
    expect(datum.rankB).toBe(1)
    expect(datum.productionA).toBe(200)
    expect(datum.productionB).toBe(500)
  })

  it('returns top-N by yearB production union protagonist codes, no duplicates', () => {
    // Build 15 depts — top-10 by yearB production.
    // Protagonist codes: ['05','17','41','63','66','73']
    // Dept codes d01..d15 with production values 1500 down to 100 for yearB.
    // Codes 05,17,41 are in top-10 naturally. 63,66,73 are NOT (positions 11,12,13).
    // topN=10: result should contain d01..d10 (top 10 by yearB) + 63,66,73 (protagonists not in top-10)
    // = 13 entries, deduplicated.
    const series: DepartmentProduction[] = []

    const allCodes = ['d01','d02','d03','d04','d05','05','17','41','d09','d10','d11','d12','63','66','73']
    allCodes.forEach((code, i) => {
      // yearB production: rank by descending index → code at index 0 has highest production
      const prodB = (allCodes.length - i) * 100
      const prodA = prodB - 50
      series.push(makeDept(code, `dept-${code}`, 2007, prodA, 20, 5))
      series.push(makeDept(code, `dept-${code}`, 2024, prodB, 20, 5))
    })

    const result = buildSlopeData(series, 2007, 2024, 10)

    // Top 10 by yearB: d01(1500),d02(1400),...,d10(600) = d01,d02,d03,d04,d05,05,17,41,d09,d10
    // Protagonists not in top-10: 63(position 12→prod=400),66(position 13→prod=300),73(position 14→prod=200)
    const resultCodes = result.map((d) => d.daneCode)

    // All top-10 must be present
    expect(resultCodes).toContain('d01')
    expect(resultCodes).toContain('d10')

    // Protagonist codes 63,66,73 (outside top-10) must still be present
    expect(resultCodes).toContain('63')
    expect(resultCodes).toContain('66')
    expect(resultCodes).toContain('73')

    // 05, 17, 41 are already in top-10 → no duplicates
    const countOf05 = resultCodes.filter((c) => c === '05').length
    expect(countOf05).toBe(1)

    // Total: 10 top + 3 extra protagonists = 13
    expect(result).toHaveLength(13)

    // No duplicates overall
    const unique = new Set(resultCodes)
    expect(unique.size).toBe(resultCodes.length)
  })

  it('assigns rank N+1 when a dept has no data for a year', () => {
    // Dept 41 only has yearB data, not yearA → rankA should be last position
    // Dept 17 has both years
    // allCodes = {17, 41} → totalDepts = 2 → N+1 = 3
    const series: DepartmentProduction[] = [
      makeDept('17', 'Caldas', 2007, 100, 20, 5),
      makeDept('41', 'Huila',  2024, 500, 80, 6.25),
      makeDept('17', 'Caldas', 2024, 200, 30, 6.67),
    ]
    const result = buildSlopeData(series, 2007, 2024, 10)
    const huila = result.find((d) => d.daneCode === '41')!
    // totalDepts = 2 (17 and 41), 41 has no yearA → rankA = totalDepts + 1 = 3
    expect(huila.rankA).toBe(3)
  })
})
