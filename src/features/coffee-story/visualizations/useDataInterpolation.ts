/**
 * useDataInterpolation — tweens DATA values between two chapter datasets.
 *
 * Design contract (non-negotiable):
 * - Uses d3.interpolate to tween numeric production values — never d3.transition.
 * - Keys: year for NationalSeries, daneCode for DepartmentSeries.
 * - React re-renders SVG from the interpolated state on each animation frame.
 * - This hook returns interpolated data; the caller drives animation progress
 *   (0 → 1) via Framer Motion useMotionValue or manual rAF.
 *
 * The overloaded generic handles both NationalSeries and DepartmentSeries
 * transparently by detecting which key type is present.
 */

import { useMemo } from 'react'
import { interpolate } from 'd3'
import type { YearDatum, DepartmentProduction } from '../../../domain/coffee'

type DataItem = YearDatum | DepartmentProduction

function isYearDatum(item: DataItem): item is YearDatum {
  return !('daneCode' in item)
}

function getKey(item: DataItem): string {
  if (isYearDatum(item)) return String(item.year)
  return (item as DepartmentProduction).daneCode
}

export interface UseDataInterpolationInput<T extends DataItem> {
  fromData: T[]
  toData: T[]
  /** Animation progress from 0 (fromData) to 1 (toData). */
  progress: number
}

/**
 * Returns the interpolated dataset at the given progress fraction.
 * Matches items by year (NationalSeries) or daneCode (DepartmentSeries).
 * Items present in fromData but missing in toData are carried forward unchanged.
 */
export function useDataInterpolation<T extends DataItem>({
  fromData,
  toData,
  progress,
}: UseDataInterpolationInput<T>): T[] {
  return useMemo(() => {
    // Build a fast lookup of toData by key.
    const toMap = new Map<string, T>()
    for (const item of toData) {
      toMap.set(getKey(item), item)
    }

    return fromData.map((fromItem) => {
      const key = getKey(fromItem)
      const toItem = toMap.get(key)

      if (!toItem) {
        // No matching destination — keep source item unchanged.
        return fromItem
      }

      // d3.interpolate handles numbers, objects, etc. transparently.
      // For plain objects it interpolates each numeric property.
      const interp = interpolate(fromItem, toItem)
      return interp(progress) as T
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromData, toData, progress])
}
