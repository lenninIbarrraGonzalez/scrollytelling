/**
 * Tests for shared formatters.
 *
 * Spec: display production figures with locale formatting.
 * Tasks: 6.10 RED
 */

import { describe, it, expect } from 'vitest'

// RED: import fails until module exists.
import { formatTonnes, formatYear } from './formatters'

describe('formatTonnes', () => {
  it('formats 828904 as "828,904 t"', () => {
    expect(formatTonnes(828904)).toBe('828,904 t')
  })

  it('formats 626798 as "626,798 t"', () => {
    expect(formatTonnes(626798)).toBe('626,798 t')
  })

  it('formats 0 as "0 t"', () => {
    expect(formatTonnes(0)).toBe('0 t')
  })

  it('formats a million as "1,000,000 t"', () => {
    expect(formatTonnes(1000000)).toBe('1,000,000 t')
  })
})

describe('formatYear', () => {
  it('formats 2007 as "2007"', () => {
    expect(formatYear(2007)).toBe('2007')
  })

  it('formats 1990 as "1990"', () => {
    expect(formatYear(1990)).toBe('1990')
  })

  it('returns a string (not a number)', () => {
    expect(typeof formatYear(2021)).toBe('string')
  })
})
