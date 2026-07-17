// Pure domain data — zero imports from React, D3, or any data source.
// Protagonist departments are the Eje Cafetero + Huila + Antioquia + Tolima:
// the regions whose combined production tells the Colombian coffee story.

/** A protagonist department in the coffee narrative. */
export interface ProtagonistDepartment {
  /** Two-digit DANE department code (string to preserve leading zeros). */
  daneCode: string
  /** Official department name in Spanish. */
  name: string
}

/**
 * The six departments that anchor the scrollytelling narrative.
 * They are the primary coffee-producing regions and form the "Eje Cafetero"
 * plus the three major producing departments outside it.
 */
export const PROTAGONIST_DEPARTMENTS: readonly ProtagonistDepartment[] = [
  { daneCode: '41', name: 'Huila' },
  { daneCode: '05', name: 'Antioquia' },
  { daneCode: '73', name: 'Tolima' },
  { daneCode: '17', name: 'Caldas' },
  { daneCode: '66', name: 'Risaralda' },
  { daneCode: '63', name: 'Quindío' },
] as const

/** Pre-built Set for O(1) protagonist lookups. */
const PROTAGONIST_CODES: ReadonlySet<string> = new Set(
  PROTAGONIST_DEPARTMENTS.map(d => d.daneCode),
)

/**
 * Returns `true` when `daneCode` belongs to a protagonist department.
 * Used by visualizations to apply distinct stroke/opacity emphasis.
 */
export function isProtagonist(daneCode: string): boolean {
  return PROTAGONIST_CODES.has(daneCode)
}

/**
 * Returns the protagonist department record for a given DANE code,
 * or `undefined` when the code is not a protagonist.
 */
export function getDepartmentByDaneCode(
  daneCode: string,
): ProtagonistDepartment | undefined {
  return PROTAGONIST_DEPARTMENTS.find(d => d.daneCode === daneCode)
}
