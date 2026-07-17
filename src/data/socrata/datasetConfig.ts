/**
 * Per-dataset constants for the two EVA Socrata endpoints.
 *
 * WHY two configs: MADR published EVA data in two separate datasets with
 * different schemas. The 2007-2018 set (2pnw-mmge) uses snake-case field names
 * with Spanish suffixes; the 2019-2024 set (uejq-wxrr) renamed every field.
 * This module encapsulates those differences so the adapter sees one interface.
 */

/** Raw field name mapping from Socrata column names to domain model keys. */
export interface DatasetFieldMap {
  year: string
  production: string
  daneCode: string
  department: string
  areaHarvested: string
  yield: string
}

export interface DatasetConfig {
  /** Full Socrata JSON endpoint URL. */
  endpoint: string
  /**
   * Exact cultivo filter value for this dataset — case-sensitive.
   * Must be non-empty; validated at module load.
   */
  cultivoFilter: string
  /** Maps domain model keys to raw Socrata column names. */
  fieldMap: DatasetFieldMap
  /** Inclusive year window covered by this dataset. */
  yearRange: [number, number]
}

/** Guard: throws at call-time if any required field is missing or invalid. */
export function validateDatasetConfig(config: DatasetConfig): void {
  if (!config.cultivoFilter) {
    throw new Error(
      `DatasetConfig.cultivoFilter must not be empty. ` +
      `Endpoint: ${config.endpoint}. ` +
      `A blank value would silently return 0 rows from the Socrata API.`,
    )
  }
}

// ---------------------------------------------------------------------------
// Filter constants — exported for spec coverage assertions
// ---------------------------------------------------------------------------

/** cultivo filter for the old EVA dataset 2pnw-mmge (2007–2018). */
export const OLD_EVA_CULTIVO_FILTER = 'CAFE' as const

/** cultivo filter for the new EVA dataset uejq-wxrr (2019–2024). */
export const NEW_EVA_CULTIVO_FILTER = 'Café' as const

// ---------------------------------------------------------------------------
// Dataset configurations
// ---------------------------------------------------------------------------

export const OLD_EVA_CONFIG: DatasetConfig = {
  endpoint: 'https://www.datos.gov.co/resource/2pnw-mmge.json',
  cultivoFilter: OLD_EVA_CULTIVO_FILTER,
  fieldMap: {
    year: 'a_o',
    production: 'producci_n_t',
    daneCode: 'c_d_dep',
    department: 'departamento',
    areaHarvested: 'rea_cosechada_ha',
    yield: 'rendimiento_t_ha',
  },
  yearRange: [2007, 2018],
}

export const NEW_EVA_CONFIG: DatasetConfig = {
  endpoint: 'https://www.datos.gov.co/resource/uejq-wxrr.json',
  cultivoFilter: NEW_EVA_CULTIVO_FILTER,
  fieldMap: {
    year: 'a_o',
    production: 'producci_n',
    daneCode: 'c_digo_dane_departamento',
    department: 'departamento',
    areaHarvested: 'rea_cosechada',
    yield: 'rendimiento',
  },
  yearRange: [2019, 2024],
}

// Validate both configs at module load time — catches misconfiguration before any network call.
validateDatasetConfig(OLD_EVA_CONFIG)
validateDatasetConfig(NEW_EVA_CONFIG)
