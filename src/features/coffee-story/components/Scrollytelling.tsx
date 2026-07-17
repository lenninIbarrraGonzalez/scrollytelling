/**
 * Scrollytelling — main layout container for the coffee narrative.
 *
 * Architecture (non-negotiable):
 * - 2-column CSS grid: sticky graphic column (left) + scrolling text column (right).
 * - Subscribes to Zustand store to read activeChapterId.
 * - Derives activeViz from the active chapter's viz field and passes it as a prop
 *   to StickyVisualization (which is purely presentational — no store access).
 * - Calls useActiveChapter to register the IntersectionObserver over chapter sentinels.
 * - Renders one sentinel div[data-chapter-id] per chapter (IntersectionObserver target).
 * - Receives all data as props (nationalSeries, departmentSeries, geoFeatures) — does
 *   NOT fetch data itself. useCoffeeData is called in App.tsx.
 *
 * D3 math hooks (useD3Scales) are called here, then threaded into StickyVisualization.
 * Responsive CSS lives in Scrollytelling.css (media query for < 768 px stacks columns).
 */

import { useRef, useMemo } from 'react'
import type { RefObject } from 'react'
import type { Feature, Geometry } from 'geojson'
import { geoMercator, geoPath } from 'd3'
import type { ExtendedFeatureCollection } from 'd3-geo'
import type { NationalSeries, DepartmentSeries, DepartmentGeoProperties, Chapter } from '../../../domain/coffee'
import type { ColombiaFeatureCollection } from '../../../data/geo/colombiaGeoLoader'
import { useScrollStore } from '../store/scrollStore'
import { useActiveChapter } from '../hooks/useActiveChapter'
import { useD3Scales } from '../visualizations/useD3Scales'
import { StickyVisualization } from '../visualizations/StickyVisualization'
import { ChapterText } from './ChapterText'
import './Scrollytelling.css'

// Default SVG dimensions — consistent across all chapters.
const VIZ_WIDTH = 600
const VIZ_HEIGHT = 500

interface ScrollytellingProps {
  chapters: Chapter[]
  nationalSeries: NationalSeries
  departmentSeries: DepartmentSeries
  geoFeatures: ColombiaFeatureCollection | { type: 'FeatureCollection'; features: Feature<Geometry, DepartmentGeoProperties>[] }
}

export function Scrollytelling({
  chapters,
  nationalSeries,
  departmentSeries,
  geoFeatures,
}: ScrollytellingProps) {
  const activeChapterId = useScrollStore((s) => s.activeChapterId)

  // Build a stable Map of sentinel refs (one per chapter).
  // useMemo ensures the Map identity is stable across renders.
  const sentinelRefs = useMemo(() => {
    const map = new Map<string, RefObject<HTMLElement | null>>()
    return map
  }, [])

  // We use a ref of refs pattern: one stable Map, values are ref objects.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const refsContainer = useRef<Map<string, RefObject<HTMLElement | null>>>(sentinelRefs)

  // Ensure all chapters have refs in the container map.
  for (const chapter of chapters) {
    if (!refsContainer.current.has(chapter.id)) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      refsContainer.current.set(chapter.id, { current: null })
    }
  }

  // Register the IntersectionObserver — the sole writer to the store.
  useActiveChapter(chapters, refsContainer.current)

  // Derive the active chapter object (falls back to first chapter when null).
  const activeChapter = chapters.find((ch) => ch.id === activeChapterId) ?? chapters[0]
  const activeViz = activeChapter?.viz ?? 'line'

  // Derive props for the active chapter (choropleth-specific).
  const highlightDaneCodes = activeChapter?.highlightDaneCodes ?? []
  const annotations = activeChapter?.annotations ?? []

  // D3 scale math — computed here and passed down to keep viz components pure.
  const productionExtent = useMemo(() => {
    const allValues = [
      ...nationalSeries.map((d) => d.production),
      ...departmentSeries.map((d) => d.production),
    ]
    if (allValues.length === 0) return [0, 1000000] as [number, number]
    return [0, Math.max(...allValues)] as [number, number]
  }, [nationalSeries, departmentSeries])

  const { colorScale } = useD3Scales({
    domainExtent: productionExtent,
    xRange: [0, VIZ_WIDTH],
    yRange: [VIZ_HEIGHT, 0],
  })

  // D3 geo projection + path generator for choropleth.
  const geoPathGenerator = useMemo(() => {
    // d3-geo's fitSize expects ExtendedFeatureCollection (with optional bbox/crs).
    // Our domain type is a plain FeatureCollection — structurally compatible at runtime.
    const projection = geoMercator().fitSize(
      [VIZ_WIDTH, VIZ_HEIGHT],
      geoFeatures as unknown as ExtendedFeatureCollection,
    )
    return geoPath(projection)
  }, [geoFeatures])

  return (
    <div
      data-testid="scrollytelling-grid"
      className="scrollytelling-grid"
    >
      {/* Left column — sticky visualization */}
      <div className="scrollytelling-viz-column">
        <StickyVisualization
          nationalSeries={nationalSeries}
          departmentSeries={departmentSeries}
          geoFeatures={geoFeatures as { features: Feature<Geometry, DepartmentGeoProperties>[] }}
          colorScale={colorScale}
          geoPath={geoPathGenerator}
          width={VIZ_WIDTH}
          height={VIZ_HEIGHT}
          activeViz={activeViz}
          highlightDaneCodes={highlightDaneCodes}
          annotations={annotations}
        />
      </div>

      {/* Right column — scrolling chapter text */}
      <div className="scrollytelling-text-column">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            data-chapter-id={chapter.id}
            className="scrollytelling-chapter-section"
            ref={(el) => {
              const entry = refsContainer.current.get(chapter.id)
              if (entry) {
                // Assign the DOM element to the ref object.
                ;(entry as { current: HTMLElement | null }).current = el
              }
            }}
          >
            <ChapterText
              chapter={chapter}
              isActive={chapter.id === activeChapterId}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
