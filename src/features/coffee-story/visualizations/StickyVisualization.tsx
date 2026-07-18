/**
 * StickyVisualization — persistent visualization container (presentational).
 *
 * Design contract (non-negotiable):
 * - Mounts ONCE and never unmounts between chapter changes.
 * - Purely presentational: receives activeViz from the parent <Scrollytelling>
 *   container, which is the Zustand store subscriber. No direct store access here.
 * - Switches between <LineChart> and <ChoroplethMap> without unmounting the wrapper.
 *
 * The sticky wrapper preserves D3 interpolation state across chapters because
 * React never destroys/recreates it — only the child visualization changes.
 */

import type { GeoPath } from 'd3'
import type { Feature, Geometry } from 'geojson'
import type { Viz, NationalSeries, DepartmentSeries, DepartmentGeoProperties } from '../../../domain/coffee'
import { LineChart } from './LineChart'
import { ChoroplethMap } from './ChoroplethMap'

interface StickyVisualizationProps {
  nationalSeries: NationalSeries
  departmentSeries: DepartmentSeries
  geoFeatures: { features: Feature<Geometry, DepartmentGeoProperties>[] }
  colorScale: (value: number) => string
  geoPath: GeoPath<unknown, Feature<Geometry, DepartmentGeoProperties>>
  width: number
  height: number
  /**
   * Accepts the full Viz union so new chapter types don't require a prop change.
   * 'scatter' and 'slope' are not yet rendered — they fall through to ChoroplethMap
   * until the dedicated components are wired in.
   */
  activeViz?: Viz
  /** Highlight codes for choropleth protagonist departments. */
  highlightDaneCodes?: string[]
  /** Annotations for line chart (e.g. La Niña 2021). */
  annotations?: { year: number; label: string }[]
  /** Source-switch label for line chart. */
  sourceLabel?: string
  /** Production domain extent [min, max] for the choropleth color legend. */
  domainExtent?: [number, number]
}

/**
 * Builds a production lookup Map<daneCode, production> from the department series.
 * Uses the most recent year's production for each department.
 */
function buildProductionByDane(
  departmentSeries: DepartmentSeries,
): Map<string, number> {
  const map = new Map<string, { production: number; year: number }>()

  for (const row of departmentSeries) {
    const existing = map.get(row.daneCode)
    if (!existing || row.year > existing.year) {
      map.set(row.daneCode, { production: row.production, year: row.year })
    }
  }

  const result = new Map<string, number>()
  for (const [code, val] of map) {
    result.set(code, val.production)
  }
  return result
}

export function StickyVisualization({
  nationalSeries,
  departmentSeries,
  geoFeatures,
  colorScale,
  geoPath,
  width,
  height,
  activeViz = 'line',
  highlightDaneCodes = [],
  annotations = [],
  sourceLabel,
  domainExtent,
}: StickyVisualizationProps) {
  const productionByDane = buildProductionByDane(departmentSeries)

  return (
    // This wrapper NEVER unmounts — it is the single persistent mount point.
    // React only updates children inside it; the node itself stays in the DOM.
    // Sticky positioning is handled by the parent .scrollytelling-viz-column in CSS.
    <div data-testid="sticky-viz">
      {activeViz === 'line' ? (
        <LineChart
          data={nationalSeries}
          width={width}
          height={height}
          annotations={annotations}
          sourceLabel={sourceLabel}
        />
      ) : (
        <ChoroplethMap
          features={geoFeatures.features}
          productionByDane={productionByDane}
          colorScale={colorScale}
          highlightDaneCodes={highlightDaneCodes}
          geoPath={geoPath}
          width={width}
          height={height}
          domainExtent={domainExtent}
        />
      )}
    </div>
  )
}
