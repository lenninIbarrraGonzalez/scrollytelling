# Exploration: interactive-visualizations

## Goal

Make both visualizations genuinely interactive and visually crafted ("show
effort"). The user ran the app and was unhappy: the LineChart reads as
"lines that symbolize nothing" and the ChoroplethMap "does nothing."

Full package approved:
- **LineChart**: X+Y axes with ticks & titles, subtle gridlines, gradient area
  fill, draw-on animation, mouse-follow tooltip (year + production), moving
  marker dot on the line.
- **ChoroplethMap**: hover highlight, tooltip (department name + tonnes), color
  legend, animated color transitions on year/chapter change.

## Current State

**Scroll signals available — critical finding.** The store (`useScrollStore`)
exposes only `activeChapterId: string | null`. There is NO continuous
per-chapter scroll-progress fraction. `useActiveChapter` fires discretely when a
sentinel crosses ±45% of the viewport — a step function, not a continuous [0,1]
signal.

Consequence: draw-on animation cannot be driven by scroll position with the
current infrastructure. It must be self-contained — triggered when the
visualization becomes active, not by scroll progress. Adding a continuous signal
would modify the sole-writer invariant of `useActiveChapter`, which is
out of scope.

**Relevant hooks.**
- `useActiveChapter` — sole IntersectionObserver writer to the store. Do not modify.
- `useD3Scales` — produces `colorScale` for choropleth. LineChart computes its
  own x/y scales locally via `useMemo`.
- `useDataInterpolation` — accepts external `progress` and tweens data arrays;
  available if a progress signal is ever added.

**Axes/ticks derivation (hybrid-safe).** LineChart already computes `xSc`/`ySc`
via `useMemo`. `xSc.ticks(5)` / `ySc.ticks(5)` return domain values as plain
arrays — pure D3 math. Map them to `<line>` + `<text>` JSX. No `d3.axis`, no DOM
mutation. Existing `MARGIN = { top:20, right:20, bottom:40, left:60 }` already
reserves axis space.

**Tooltip pointer coordinates.** Use `onMouseMove` on `<svg>`. Compute SVG-space
x via `clientX - svg.getBoundingClientRect().left - MARGIN.left`. Find nearest
year datum with `d3.bisector` (pure math). Store tooltip state as
`useState<{x,y,year,production} | null>`. Render tooltip as `<g>` inside the SVG
to keep coordinate space consistent.

**Choropleth interactivity.** Hover via `onMouseEnter/Leave` per `<path>`,
`hoveredDane` in `useState`. Color transitions on chapter change via
`style={{ transition: 'fill 300ms ease' }}` (browser interpolates, no rAF).
Legend as a dedicated `ColorLegend` sub-component rendering swatch `<rect>`s.

**Animation approach.** Framer Motion is already on the stack. Use `motion.path`
with animated `strokeDashoffset`, triggered on mount / when `activeViz` becomes
`'line'`. Path total length read via `ref` in `useEffect` after mount — JSDOM
does not implement `getTotalLength()`, so animation tests must mock it.

## Affected Areas

- `src/features/coffee-story/visualizations/LineChart.tsx` — axes, gradient area,
  draw-on animation, mouse-follow tooltip.
- `src/features/coffee-story/visualizations/ChoroplethMap.tsx` — hover highlight,
  tooltip, CSS fill transitions, legend delegation.
- `src/features/coffee-story/visualizations/LineChart.test.tsx` — extend.
- `src/features/coffee-story/visualizations/ChoroplethMap.test.tsx` — extend.
- New: `src/features/coffee-story/visualizations/ColorLegend.tsx` + `.test.tsx`.
- No changes: `scrollStore`, `useActiveChapter`, `useD3Scales`,
  `useDataInterpolation`, `Scrollytelling.tsx`, `StickyVisualization.tsx`.

## Approaches

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| A: Framer Motion `animate()` + React `useState` | On-stack, declarative, testable with mocks | needs `motion.path` wrapper | Medium |
| B: Custom `useDrawOnAnimation` rAF hook | zero new dep | manual easing, strict-mode fragile | Medium |
| C: CSS `@keyframes` only | zero JS cost | path length unknown at CSS time; not testable | Low (blocked by TDD) |

## Recommendation

Approach A. Framer Motion for draw-on animation, React `useState` for tooltip
and hover, `style={{ transition: 'fill 300ms ease' }}` for choropleth color
changes. Animation triggers on mount / activation, not scroll progress.
Extract `ColorLegend` as a separate presentational sub-component.

Open question for proposal: tooltip as SVG `<g>` overlay (coordinate-consistent,
`aria`-accessible) vs. HTML `<div>` overlay (easier styling). Recommend SVG `<g>`
to stay fully within the hybrid contract.

## Risks

- `getTotalLength()` not implemented in JSDOM — mock
  `SVGPathElement.prototype.getTotalLength` in animation tests.
- Tooltip pointer coordinates: use `getBoundingClientRect` on `<svg>`, not
  `offsetX/Y`.
- CSS fill transitions are not exercised by JSDOM — timing assertions won't
  reflect real behavior.
- 400-line PR budget: Medium-to-High. Splitting into two PRs (LineChart first,
  ChoroplethMap second) is strongly recommended.
- Static guard tests (raw source scan for `d3.select`/`.transition`) must keep
  passing — they will, since guards target D3 APIs specifically.

## Ready for Proposal

Yes. Next: `sdd-propose`.
