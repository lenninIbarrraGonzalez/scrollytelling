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

import { useRef, useMemo, useState, useEffect } from 'react'
import type { RefObject } from 'react'
import type { Feature, Geometry } from 'geojson'
import { geoMercator, geoPath } from 'd3'
import type { ExtendedFeatureCollection } from 'd3-geo'
import { motion, AnimatePresence } from 'framer-motion'
import type { NationalSeries, DepartmentSeries, DepartmentGeoProperties, Chapter } from '../../../domain/coffee'
import { useScrollStore } from '../store/scrollStore'
import { useActiveChapter } from '../hooks/useActiveChapter'
import { useD3Scales } from '../visualizations/useD3Scales'
import { StickyVisualization } from '../visualizations/StickyVisualization'
import { ChapterText } from './ChapterText'
import { buildScatterData, buildSlopeData, buildWeightedYieldSeries, SLOPE_TOP_N } from '../selectors/coffeeSelectors'
import './Scrollytelling.css'

// Default SVG dimensions — consistent across all chapters.
const VIZ_WIDTH = 600
const VIZ_HEIGHT = 500

interface ScrollytellingProps {
  chapters: Chapter[]
  nationalSeries: NationalSeries
  departmentSeries: DepartmentSeries
  geoFeatures: { type: 'FeatureCollection'; features: Feature<Geometry, DepartmentGeoProperties>[] }
}

export function Scrollytelling({
  chapters,
  nationalSeries,
  departmentSeries,
  geoFeatures,
}: ScrollytellingProps) {
  const activeChapterId = useScrollStore((s) => s.activeChapterId)

  const [hasScrolled, setHasScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setHasScrolled(true)
    window.addEventListener('scroll', onScroll, { once: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const sentinelRefs = useMemo(() => {
    const map = new Map<string, RefObject<HTMLElement | null>>()
    return map
  }, [])

  // useRef is the stable anchor — React guarantees its identity across renders.
  // sentinelRefs provides the initial value; the cast below is needed because
  // RefObject.current is readonly in strict mode and we assign through it in the ref callback.
  const refsContainer = useRef<Map<string, RefObject<HTMLElement | null>>>(sentinelRefs)

  // Ensure all chapters have refs in the container map.
  for (const chapter of chapters) {
    if (!refsContainer.current.has(chapter.id)) {
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

  // Filter departmentSeries to the chapter's narrative year so each choropleth
  // chapter shows the data that matches its story, not the most recent year.
  const chapterDepartmentSeries = useMemo(() => {
    const year = activeChapter?.dataYear
    if (!year) return departmentSeries
    return departmentSeries.filter((d) => d.year === year)
  }, [activeChapter, departmentSeries])

  // Scatter data for chapter 6 (ScatterBubbleChart).
  const scatterData = useMemo(
    () =>
      activeChapter.viz === 'scatter' && activeChapter.dataYear
        ? buildScatterData(departmentSeries, activeChapter.dataYear)
        : [],
    [departmentSeries, activeChapter.viz, activeChapter.dataYear],
  )

  // Weighted yield series for chapter 8 — computed once over full departmentSeries.
  const weightedYieldSeries = useMemo(
    () => buildWeightedYieldSeries(departmentSeries),
    [departmentSeries],
  )

  // Slope data for chapter 7 (SlopeChart).
  const slopeData = useMemo(
    () =>
      activeChapter.viz === 'slope' && activeChapter.rankingYears
        ? buildSlopeData(
            departmentSeries,
            activeChapter.rankingYears[0],
            activeChapter.rankingYears[1],
            SLOPE_TOP_N,
          )
        : [],
    [departmentSeries, activeChapter.viz, activeChapter.rankingYears],
  )

  // For chapter 8 (seriesMode = weighted-yield), substitute the national line data
  // with weighted yield values mapped to the same NationalSeries shape.
  const lineData = useMemo(
    () =>
      activeChapter.seriesMode === 'weighted-yield'
        ? weightedYieldSeries.map((d) => ({ year: d.year, production: d.yield }))
        : nationalSeries,
    [activeChapter.seriesMode, weightedYieldSeries, nationalSeries],
  )

  // Y-axis label: override to t/ha for the weighted-yield chapter.
  const yAxisLabel = activeChapter.seriesMode === 'weighted-yield' ? 't/ha' : undefined

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
    <>
    <header className="scrollytelling-header">
      <h1 className="scrollytelling-title">
        Café Colombiano — Evolución de la Producción
      </h1>
    </header>
    <div
      data-testid="scrollytelling-grid"
      className="scrollytelling-grid"
    >
      <div className="scrollytelling-viz-column">
        <StickyVisualization
          nationalSeries={lineData}
          departmentSeries={chapterDepartmentSeries}
          geoFeatures={geoFeatures as { features: Feature<Geometry, DepartmentGeoProperties>[] }}
          colorScale={colorScale}
          geoPath={geoPathGenerator}
          width={VIZ_WIDTH}
          height={VIZ_HEIGHT}
          activeViz={activeViz}
          highlightDaneCodes={highlightDaneCodes}
          annotations={annotations}
          domainExtent={productionExtent}
          scatterData={scatterData}
          slopeData={slopeData}
          slopeYearA={activeChapter.rankingYears?.[0] ?? 2007}
          slopeYearB={activeChapter.rankingYears?.[1] ?? 2024}
          yAxisLabel={yAxisLabel}
        />
      </div>

      <div className="scrollytelling-text-column">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            data-chapter-id={chapter.id}
            className="scrollytelling-chapter-section"
            ref={(el) => {
              const entry = refsContainer.current.get(chapter.id)
              if (entry) {
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

    <AnimatePresence>
      {!hasScrolled && (
        <motion.div
          className="scroll-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.5 }, y: { repeat: Infinity, duration: 1.4, ease: 'easeInOut' } }}
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          <span>Scroll</span>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  )
}
