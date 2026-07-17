/**
 * Colombia department TopoJSON loader.
 *
 * Source: https://raw.githubusercontent.com/caticoa3/colombia_mapa/master/colombia_2018_simplified.topojson
 * Object key: MGN_DPTO_POLITICO (33 departments)
 * Join key: DPTO_CCDGO (2-digit DANE code) — authoritative for EVA joins.
 *
 * WHY DANE code only: department name variants (QUINDIO / Quindío / QUINDÍO)
 * across datasets make string joins unsafe. DANE codes are stable identifiers.
 */

import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology } from 'topojson-specification'
import { createCache } from '../cache'
import type { DepartmentGeoProperties } from '../../domain/coffee'

const TOPOJSON_URL =
  'https://raw.githubusercontent.com/caticoa3/colombia_mapa/master/colombia_2018_simplified.topojson'

/** TopoJSON object key for department-level polygons. */
const TOPO_OBJECT_KEY = 'MGN_DPTO_POLITICO'

/** Re-export domain type for callers who import from this module (backwards compat). */
export type { DepartmentGeoProperties as DepartmentProperties } from '../../domain/coffee'

export type ColombiaFeatureCollection = FeatureCollection<
  Geometry,
  DepartmentGeoProperties
>

// Module-level cache — one fetch per application session.
const geoCache = createCache<ColombiaFeatureCollection>()

/**
 * Fetch and parse the Colombia TopoJSON, returning a GeoJSON FeatureCollection.
 *
 * Cached after first call: subsequent calls return the same promise without
 * making another HTTP request.
 */
export async function loadColombiaGeo(): Promise<ColombiaFeatureCollection> {
  return geoCache.get(TOPOJSON_URL, async () => {
    const response = await fetch(TOPOJSON_URL)
    if (!response.ok) {
      throw new Error(
        `Colombia TopoJSON fetch failed: ${response.status} ${response.statusText} — ${TOPOJSON_URL}`,
      )
    }

    const topology = (await response.json()) as Topology
    const obj = topology.objects[TOPO_OBJECT_KEY]

    if (!obj) {
      throw new Error(
        `TopoJSON object '${TOPO_OBJECT_KEY}' not found. ` +
          `Available keys: ${Object.keys(topology.objects).join(', ')}`,
      )
    }

    // topojson-client.feature() converts TopoJSON to GeoJSON FeatureCollection.
    // The cast is safe: we know the source schema and validate DPTO_CCDGO presence.
    return feature(topology, obj) as unknown as ColombiaFeatureCollection
  })
}
