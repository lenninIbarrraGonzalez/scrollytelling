/**
 * Pure data selectors for the coffee scrollytelling new visualizations.
 *
 * Rules:
 * - No React imports, no D3 DOM imports, no side effects.
 * - All functions return new arrays — no mutation.
 * - `areaHarvested === 0` (or undefined) means "absent": the adapter coerces
 *   empty CSV cells to 0. All functions guard `> 0`.
 */

import type { DepartmentProduction, ScatterDatum, SlopeDatum, YieldDatum } from '../../../domain/coffee'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of top departments (by yearB production) included in the slope chart. */
export const SLOPE_TOP_N = 10

/**
 * DANE codes for the protagonist departments (eje cafetero + Huila).
 * These are always included in the slope chart even if outside the top-N.
 */
const PROTAGONIST_CODES: readonly string[] = ['05', '17', '41', '63', '66', '73']

// ---------------------------------------------------------------------------
// buildScatterData
// ---------------------------------------------------------------------------

/**
 * Builds scatter plot data for a given year.
 *
 * Filters:
 * - Row year must match `year`
 * - production > 0
 * - areaHarvested > 0
 * - yield > 0
 *
 * @param series - Full departmental production series
 * @param year   - Year to slice
 * @returns Array of ScatterDatum, one per valid department
 */
export function buildScatterData(
  series: DepartmentProduction[],
  year: number,
): ScatterDatum[] {
  const valid = series.filter(
    (row) =>
      row.year === year &&
      row.production > 0 &&
      (row.areaHarvested ?? 0) > 0 &&
      (row.yield ?? 0) > 0,
  )

  // Deduplicate by daneCode — EVA datasets overlap at year boundaries.
  // Keep the row with the highest production when duplicates exist.
  const byCode = new Map<string, DepartmentProduction>()
  for (const row of valid) {
    const existing = byCode.get(row.daneCode)
    if (!existing || row.production > existing.production) {
      byCode.set(row.daneCode, row)
    }
  }

  return Array.from(byCode.values()).map((row) => ({
    daneCode: row.daneCode,
    department: row.department,
    production: row.production,
    areaHarvested: row.areaHarvested as number,
    yield: row.yield as number,
  }))
}

// ---------------------------------------------------------------------------
// buildWeightedYieldSeries
// ---------------------------------------------------------------------------

/**
 * Computes the national weighted yield series across all years.
 *
 * For each year:
 *   - Collect rows with areaHarvested > 0
 *   - weighted yield = Σproduction / ΣareaHarvested
 *   - Skip years where Σarea === 0 (all rows absent)
 *
 * Result is sorted ascending by year.
 *
 * @param series - Full departmental production series
 * @returns YieldDatum[] sorted by year
 */
export function buildWeightedYieldSeries(series: DepartmentProduction[]): YieldDatum[] {
  // Group rows by year
  const byYear = new Map<number, DepartmentProduction[]>()
  for (const row of series) {
    const bucket = byYear.get(row.year) ?? []
    bucket.push(row)
    byYear.set(row.year, bucket)
  }

  const result: YieldDatum[] = []

  for (const [year, rows] of byYear) {
    // Only rows with areaHarvested > 0 contribute
    const validRows = rows.filter((r) => (r.areaHarvested ?? 0) > 0)

    const totalArea = validRows.reduce((sum, r) => sum + (r.areaHarvested as number), 0)
    if (totalArea === 0) continue // avoid divide-by-zero

    const totalProduction = validRows.reduce((sum, r) => sum + r.production, 0)
    const weightedYield = totalProduction / totalArea

    result.push({
      year,
      production: totalProduction,
      areaHarvested: totalArea,
      yield: weightedYield,
    })
  }

  // Sort ascending by year
  result.sort((a, b) => a.year - b.year)
  return result
}

// ---------------------------------------------------------------------------
// buildSlopeData
// ---------------------------------------------------------------------------

/**
 * Builds slope chart data comparing two years.
 *
 * Algorithm:
 * 1. Extract production by daneCode for yearA and yearB from `series`.
 * 2. Sort all departments by yearB production descending; take top `topN`.
 * 3. Union with PROTAGONIST_CODES (always include protagonists).
 * 4. Deduplicate.
 * 5. For each department in the union set:
 *    - rankA = 1-indexed position when ALL departments are sorted by yearA production desc
 *    - rankB = 1-indexed position when ALL departments are sorted by yearB production desc
 *    - If a dept has no data for a year, its rank = total unique depts + 1 (last position).
 *
 * @param series  - Full departmental production series
 * @param yearA   - Earlier comparison year
 * @param yearB   - Later comparison year (determines top-N selection)
 * @param topN    - Number of top departments by yearB production to include
 * @returns SlopeDatum[]
 */
export function buildSlopeData(
  series: DepartmentProduction[],
  yearA: number,
  yearB: number,
  topN: number,
): SlopeDatum[] {
  if (series.length === 0) return []

  // Build production maps by daneCode for each year
  const prodA = new Map<string, number>()
  const prodB = new Map<string, number>()
  const deptName = new Map<string, string>()

  for (const row of series) {
    deptName.set(row.daneCode, row.department)
    // Keep the highest production when duplicate daneCode+year entries exist (dataset overlap).
    if (row.year === yearA && row.production > (prodA.get(row.daneCode) ?? 0))
      prodA.set(row.daneCode, row.production)
    if (row.year === yearB && row.production > (prodB.get(row.daneCode) ?? 0))
      prodB.set(row.daneCode, row.production)
  }

  // All unique department codes that appear in either year
  const allCodes = Array.from(
    new Set([...prodA.keys(), ...prodB.keys()]),
  )

  if (allCodes.length === 0) return []

  // Sort by yearB production descending, take top N
  const byProdB = [...allCodes].sort(
    (a, b) => (prodB.get(b) ?? 0) - (prodB.get(a) ?? 0),
  )
  const topNCodes = byProdB.slice(0, topN)

  // Union with protagonist codes (that have at least some data)
  const protagonistsWithData = PROTAGONIST_CODES.filter(
    (code) => prodA.has(code) || prodB.has(code),
  )

  const selectedSet = new Set([...topNCodes, ...protagonistsWithData])
  const selectedCodes = Array.from(selectedSet)

  // Build global rank tables across ALL departments (not just selected)
  // Rank is position in the full sorted list of ALL departments
  const totalDepts = allCodes.length

  // Sort all codes by yearA production desc for rank assignment
  const sortedByA = [...allCodes].sort(
    (a, b) => (prodA.get(b) ?? -1) - (prodA.get(a) ?? -1),
  )
  const rankMapA = new Map<string, number>()
  sortedByA.forEach((code, i) => {
    rankMapA.set(code, i + 1)
  })

  // Sort all codes by yearB production desc for rank assignment
  const rankMapB = new Map<string, number>()
  byProdB.forEach((code, i) => {
    rankMapB.set(code, i + 1)
  })

  // Build SlopeDatum for each selected code
  return selectedCodes.map((code) => ({
    daneCode: code,
    department: deptName.get(code) ?? code,
    rankA: prodA.has(code) ? (rankMapA.get(code) ?? totalDepts + 1) : totalDepts + 1,
    rankB: prodB.has(code) ? (rankMapB.get(code) ?? totalDepts + 1) : totalDepts + 1,
    productionA: prodA.get(code) ?? 0,
    productionB: prodB.get(code) ?? 0,
  }))
}
