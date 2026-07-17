import { describe, it, expect } from 'vitest'
import {
  PROTAGONIST_DEPARTMENTS,
  isProtagonist,
  getDepartmentByDaneCode,
} from './coffeeDepartments'

// ---------------------------------------------------------------------------
// Protagonist department list
// ---------------------------------------------------------------------------

describe('PROTAGONIST_DEPARTMENTS', () => {
  it('contains exactly 6 protagonist departments', () => {
    expect(PROTAGONIST_DEPARTMENTS).toHaveLength(6)
  })

  it('includes Huila with DANE code 41', () => {
    const huila = PROTAGONIST_DEPARTMENTS.find(d => d.daneCode === '41')
    expect(huila).toBeDefined()
    expect(huila?.name).toBe('Huila')
  })

  it('includes Antioquia with DANE code 05', () => {
    const antioquia = PROTAGONIST_DEPARTMENTS.find(d => d.daneCode === '05')
    expect(antioquia).toBeDefined()
    expect(antioquia?.name).toBe('Antioquia')
  })

  it('includes Tolima with DANE code 73', () => {
    const tolima = PROTAGONIST_DEPARTMENTS.find(d => d.daneCode === '73')
    expect(tolima).toBeDefined()
    expect(tolima?.name).toBe('Tolima')
  })

  it('includes Caldas with DANE code 17', () => {
    const caldas = PROTAGONIST_DEPARTMENTS.find(d => d.daneCode === '17')
    expect(caldas).toBeDefined()
    expect(caldas?.name).toBe('Caldas')
  })

  it('includes Risaralda with DANE code 66', () => {
    const risaralda = PROTAGONIST_DEPARTMENTS.find(d => d.daneCode === '66')
    expect(risaralda).toBeDefined()
    expect(risaralda?.name).toBe('Risaralda')
  })

  it('includes Quindío with DANE code 63', () => {
    const quindio = PROTAGONIST_DEPARTMENTS.find(d => d.daneCode === '63')
    expect(quindio).toBeDefined()
    expect(quindio?.name).toBe('Quindío')
  })
})

// ---------------------------------------------------------------------------
// isProtagonist helper
// ---------------------------------------------------------------------------

describe('isProtagonist', () => {
  it('returns true for Huila (DANE code 41)', () => {
    expect(isProtagonist('41')).toBe(true)
  })

  it('returns true for Quindío (DANE code 63)', () => {
    expect(isProtagonist('63')).toBe(true)
  })

  it('returns false for a non-protagonist department (Vaupés, code 97)', () => {
    expect(isProtagonist('97')).toBe(false)
  })

  it('returns false for an empty string', () => {
    expect(isProtagonist('')).toBe(false)
  })

  it('returns false for a non-existent code', () => {
    expect(isProtagonist('99')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getDepartmentByDaneCode helper
// ---------------------------------------------------------------------------

describe('getDepartmentByDaneCode', () => {
  it('returns the correct department for Huila (41)', () => {
    const dept = getDepartmentByDaneCode('41')
    expect(dept).toBeDefined()
    expect(dept?.name).toBe('Huila')
    expect(dept?.daneCode).toBe('41')
  })

  it('returns the correct department for Caldas (17)', () => {
    const dept = getDepartmentByDaneCode('17')
    expect(dept).toBeDefined()
    expect(dept?.name).toBe('Caldas')
  })

  it('preserves the leading zero for Antioquia (05) — the join key is a string, not a number', () => {
    const dept = getDepartmentByDaneCode('05')
    expect(dept).toBeDefined()
    expect(dept?.name).toBe('Antioquia')
    expect(dept?.daneCode).toBe('05')
  })

  it('does not match a numeric-coerced code (5 !== "05")', () => {
    expect(getDepartmentByDaneCode('5')).toBeUndefined()
  })

  it('returns undefined for a non-protagonist department code', () => {
    const dept = getDepartmentByDaneCode('97')
    expect(dept).toBeUndefined()
  })

  it('returns undefined for an empty string', () => {
    const dept = getDepartmentByDaneCode('')
    expect(dept).toBeUndefined()
  })
})
