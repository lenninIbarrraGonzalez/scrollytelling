/**
 * Socrata EVA adapter — raw string rows → domain DepartmentProduction[].
 *
 * This is the only place where string→number coercion occurs for EVA data.
 * It normalises both EVA schemas (2007-2018 and 2019-2024) using per-dataset
 * field maps from datasetConfig.ts.
 */

import type { DepartmentProduction } from '../../domain/coffee'
import type { DatasetConfig } from './datasetConfig'

/** Raw row shape from Socrata — all values are strings. */
export type RawRow = Record<string, string>

/**
 * Map raw Socrata rows to DepartmentProduction domain objects.
 *
 * Throws a descriptive error when the cultivo value in any row does not match
 * the expected filter constant — this catches silent 0-row mismatches early.
 */
export function socrataAdapter(
  rawRows: RawRow[],
  config: DatasetConfig,
): DepartmentProduction[] {
  if (rawRows.length === 0) {
    throw new Error(
      `socrataAdapter received 0 rows for endpoint ${config.endpoint}. ` +
      `Expected cultivo='${config.cultivoFilter}'. ` +
      `A wrong filter value returns 0 rows from Socrata silently.`,
    )
  }

  const { fieldMap, cultivoFilter } = config

  return rawRows.map((row, index) => {
    // Validate cultivo on every row to catch schema mismatches early.
    const rowCultivo = row['cultivo'] ?? ''
    if (rowCultivo !== cultivoFilter) {
      throw new Error(
        `socrataAdapter: row[${index}] has cultivo='${rowCultivo}' ` +
        `but expected '${cultivoFilter}' for endpoint ${config.endpoint}. ` +
        `Check the cultivoFilter constant — wrong case or accent causes 0 valid rows.`,
      )
    }

    const production = Number(row[fieldMap.production])
    const year = Number(row[fieldMap.year])
    const daneCode = String(row[fieldMap.daneCode])
    const department = String(row[fieldMap.department] ?? '')
    const areaHarvested = fieldMap.areaHarvested
      ? Number(row[fieldMap.areaHarvested])
      : undefined
    const yieldValue = fieldMap.yield
      ? Number(row[fieldMap.yield])
      : undefined

    return {
      daneCode,
      department,
      year,
      production,
      areaHarvested,
      yield: yieldValue,
    } satisfies DepartmentProduction
  })
}
