/**
 * useCoffeeData — orchestrates all data fetches and exposes typed domain models.
 *
 * This hook is the single entry point for components to access coffee data.
 * It fetches in parallel: FAO CSV (1990-2006 national), two EVA datasets
 * (2007-2018 and 2019-2024 departmental), and the Colombia TopoJSON.
 *
 * Components NEVER see raw API field names — all coercion happens inside adapters.
 */

import { useEffect, useState } from 'react'
import type { NationalSeries, DepartmentSeries } from '../domain/coffee'
import type { ColombiaFeatureCollection } from './geo/colombiaGeoLoader'
import { loadColombiaGeo } from './geo/colombiaGeoLoader'
import { parseFaoCSV } from './fao/faoAdapter'
import { socrataClient } from './socrata/client'
import { socrataAdapter } from './socrata/adapter'
import { OLD_EVA_CONFIG, NEW_EVA_CONFIG } from './socrata/datasetConfig'

/** OWiD/FAO CSV endpoint for national Colombian production data (1990-2006). */
const FAO_CSV_URL =
  'https://ourworldindata.org/grapher/coffee-production-by-region.csv'

/** Loaded and adapted coffee data, ready for visualization. */
export interface CoffeeData {
  /** National annual production series from FAO (1990–2006). */
  nationalSeries: NationalSeries
  /** Department-level annual production from both EVA datasets (2007–2024). */
  departmentSeries: DepartmentSeries
  /** Colombia department GeoJSON FeatureCollection. */
  geoFeatures: ColombiaFeatureCollection
}

/** Hook return type — matches load/error/data pattern. */
export interface UseCoffeeDataResult {
  data: CoffeeData | null
  loading: boolean
  error: Error | null
}

/**
 * Fetch FAO CSV text and return NationalSeries via the adapter.
 * Uses a plain fetch since the FAO CSV doesn't go through socrataClient.
 */
async function fetchFaoSeries(): Promise<NationalSeries> {
  const response = await fetch(FAO_CSV_URL)
  if (!response.ok) {
    throw new Error(
      `FAO CSV fetch failed: ${response.status} ${response.statusText} — ${FAO_CSV_URL}`,
    )
  }
  const text = await response.text()
  return parseFaoCSV(text)
}

/**
 * Fetch one EVA dataset and return DepartmentSeries via the adapter.
 * Uses socrataClient which handles SoQL query building.
 */
async function fetchEvaSeries(
  config: typeof OLD_EVA_CONFIG,
): Promise<DepartmentSeries> {
  const rows = await socrataClient(config.endpoint)
    .select(
      [
        config.fieldMap.year,
        config.fieldMap.production,
        config.fieldMap.daneCode,
        config.fieldMap.department,
        config.fieldMap.areaHarvested,
        config.fieldMap.yield,
        'cultivo',
      ].join(','),
    )
    .where(`cultivo='${config.cultivoFilter}'`)
    .limit(50000)
    .fetchJson()

  return socrataAdapter(rows, config)
}

/**
 * Orchestrate all parallel data fetches and return typed domain models.
 * On any fetch failure, throws with a descriptive error.
 */
export function useCoffeeData(): UseCoffeeDataResult {
  const [data, setData] = useState<CoffeeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [nationalSeries, oldEvaSeries, newEvaSeries, geoFeatures] =
          await Promise.all([
            fetchFaoSeries(),
            fetchEvaSeries(OLD_EVA_CONFIG),
            fetchEvaSeries(NEW_EVA_CONFIG),
            loadColombiaGeo(),
          ])

        if (cancelled) return

        // Combine both EVA datasets into a single department series
        const departmentSeries: DepartmentSeries = [
          ...oldEvaSeries,
          ...newEvaSeries,
        ]

        setData({ nationalSeries, departmentSeries, geoFeatures })
      } catch (err) {
        if (cancelled) return
        setError(
          err instanceof Error
            ? err
            : new Error('Unknown error loading coffee data'),
        )
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { data, loading, error }
}
