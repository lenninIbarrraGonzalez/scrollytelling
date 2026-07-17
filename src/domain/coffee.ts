// Pure domain types — zero imports from React, D3, or any data source.
// All numeric fields are `number` (never string). String→number coercion
// lives exclusively in src/data/ adapters.

/** One year's national coffee production figure (tonnes). */
export interface YearDatum {
  year: number
  production: number
}

/** One department's coffee production for a single year (EVA source). */
export interface DepartmentProduction {
  /** Two-digit DANE department code (kept as string to preserve leading zeros). */
  daneCode: string
  department: string
  year: number
  /** Production in tonnes. */
  production: number
  /** Harvested area in hectares — optional, not always present. */
  areaHarvested?: number
  /** Yield in kg/ha — optional, not always present. */
  yield?: number
}

/**
 * Data provenance flag for a chapter.
 * 'FAO'  = OWiD/FAOSTAT national series (1990–2006)
 * 'EVA'  = MADR/DANE departmental EVA data (2007–2024)
 */
export type ChapterSource = 'FAO' | 'EVA'

/** A single scrollytelling narrative chapter. */
export interface Chapter {
  /** Stable unique identifier — required (missing id is a TS compile error). */
  id: string
  /** Zero-based display order. */
  index: number
  /** Which data provenance this chapter uses. */
  source: ChapterSource
  /** Which visualization type to render for this chapter. */
  viz: 'line' | 'choropleth'
  /** Short chapter headline. */
  title: string
  /** Narrative body text (no JSX — plain string). */
  body: string
  /**
   * DANE department codes to highlight as protagonists.
   * Huila = '41', Caldas = '17', Quindío = '63',
   * Risaralda = '66', Antioquia = '05', Tolima = '73'.
   */
  highlightDaneCodes?: string[]
  /** Data annotations rendered on the visualization. */
  annotations?: { year: number; label: string }[]
}

/** Full national production time series. */
export type NationalSeries = YearDatum[]

/** Full departmental production series for all departments. */
export type DepartmentSeries = DepartmentProduction[]

/**
 * GeoJSON properties for a Colombia department feature.
 * Defined here (domain) so visualizations depend only on domain types,
 * not on the data/geo adapter internals.
 */
export interface DepartmentGeoProperties {
  /** 2-digit DANE code — primary join key for EVA↔GeoJSON. */
  DPTO_CCDGO: string
  /** Department name as in the TopoJSON source. */
  DPTO_CNMBR: string
  [key: string]: unknown
}
