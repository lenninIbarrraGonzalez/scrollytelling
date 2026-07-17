import { describe, it, expect } from 'vitest'
import {
  OLD_EVA_CULTIVO_FILTER,
  NEW_EVA_CULTIVO_FILTER,
  OLD_EVA_CONFIG,
  NEW_EVA_CONFIG,
  validateDatasetConfig,
} from './datasetConfig'

describe('dataset filter constants', () => {
  it('OLD_EVA_CULTIVO_FILTER is exactly CAFE — 4 chars, no diacritics', () => {
    expect(OLD_EVA_CULTIVO_FILTER).toBe('CAFE')
    expect(OLD_EVA_CULTIVO_FILTER.length).toBe(4)
    // No accent — charCodeAt all chars must be < 128 (ASCII)
    for (let i = 0; i < OLD_EVA_CULTIVO_FILTER.length; i++) {
      expect(OLD_EVA_CULTIVO_FILTER.charCodeAt(i)).toBeLessThan(128)
    }
  })

  it('NEW_EVA_CULTIVO_FILTER is exactly Café — 4 chars, with accent é', () => {
    expect(NEW_EVA_CULTIVO_FILTER).toBe('Café')
    expect(NEW_EVA_CULTIVO_FILTER.length).toBe(4)
    // The é must have a code point > 127
    const hasAccent = [...NEW_EVA_CULTIVO_FILTER].some(c => c.codePointAt(0)! > 127)
    expect(hasAccent).toBe(true)
  })
})

describe('OLD_EVA_CONFIG', () => {
  it('points to the 2007-2018 endpoint', () => {
    expect(OLD_EVA_CONFIG.endpoint).toContain('2pnw-mmge')
  })

  it('maps year field to a_o', () => {
    expect(OLD_EVA_CONFIG.fieldMap.year).toBe('a_o')
  })

  it('maps production field to producci_n_t', () => {
    expect(OLD_EVA_CONFIG.fieldMap.production).toBe('producci_n_t')
  })

  it('maps DANE code to c_d_dep', () => {
    expect(OLD_EVA_CONFIG.fieldMap.daneCode).toBe('c_d_dep')
  })

  it('uses CAFE as cultivo filter', () => {
    expect(OLD_EVA_CONFIG.cultivoFilter).toBe('CAFE')
  })
})

describe('NEW_EVA_CONFIG', () => {
  it('points to the 2019-2024 endpoint', () => {
    expect(NEW_EVA_CONFIG.endpoint).toContain('uejq-wxrr')
  })

  it('maps year field to a_o', () => {
    expect(NEW_EVA_CONFIG.fieldMap.year).toBe('a_o')
  })

  it('maps production field to producci_n (no _t suffix)', () => {
    expect(NEW_EVA_CONFIG.fieldMap.production).toBe('producci_n')
  })

  it('maps DANE code to c_digo_dane_departamento', () => {
    expect(NEW_EVA_CONFIG.fieldMap.daneCode).toBe('c_digo_dane_departamento')
  })

  it('uses Café as cultivo filter', () => {
    expect(NEW_EVA_CONFIG.cultivoFilter).toBe('Café')
  })
})

describe('validateDatasetConfig', () => {
  it('throws when cultivoFilter is empty string', () => {
    expect(() =>
      validateDatasetConfig({
        endpoint: 'https://example.com',
        cultivoFilter: '',
        fieldMap: { year: 'a_o', production: 'p', daneCode: 'c', department: 'd', areaHarvested: 'a', yield: 'y' },
        yearRange: [2007, 2018],
      }),
    ).toThrow(/cultivoFilter/)
  })

  it('does not throw for a valid config', () => {
    expect(() =>
      validateDatasetConfig(OLD_EVA_CONFIG),
    ).not.toThrow()
  })
})
