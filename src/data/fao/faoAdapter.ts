/**
 * FAO / OWiD national coffee production CSV adapter.
 *
 * Source: https://ourworldindata.org/grapher/coffee-production-by-region.csv
 * Column names: Entity, Code, Year, Coffee production (tonnes)
 *
 * This adapter is the only place that parses and filters the FAO CSV.
 * It maps Colombia rows to domain YearDatum[] and restricts the series
 * to 1990–2006 (the FAO window used in chapters 1–2 before EVA takes over).
 */

import { csvParse } from 'd3-dsv'
import type { NationalSeries, YearDatum } from '../../domain/coffee'

/** Year window for FAO data used in the narrative. */
const FAO_YEAR_START = 1990
const FAO_YEAR_END = 2006

/** Column header for production tonnes — OWiD uses a verbose header. */
const PRODUCTION_COLUMN = 'Coffee production (tonnes)'

/**
 * Parse an OWiD/FAO CSV text into a NationalSeries for Colombia.
 *
 * @param csvText - Raw CSV string from the OWiD endpoint or a test fixture.
 * @returns Array of YearDatum objects for Colombia, restricted to 1990–2006.
 */
export function parseFaoCSV(csvText: string): NationalSeries {
  const rows = csvParse(csvText)

  const series: YearDatum[] = []

  for (const row of rows) {
    const entity = row['Entity'] ?? ''
    if (entity !== 'Colombia') continue

    const year = Number(row['Year'])
    if (year < FAO_YEAR_START || year > FAO_YEAR_END) continue

    const production = Number(row[PRODUCTION_COLUMN])
    if (isNaN(production) || isNaN(year)) continue

    series.push({ year, production })
  }

  return series
}
