# Proposal: Interactive, Crafted Visualizations

## Intent

This is a Frontend Senior **portfolio** piece; visible craftsmanship is the deliverable. Today both graphics fail that bar: the LineChart "symbolizes nothing" (no axes to anchor the data) and the ChoroplethMap "does nothing" (no interaction). We make both genuinely interactive and editorial-grade so the work reads as senior-level.

## Scope

### In Scope
- **LineChart**: X+Y axes (ticks, titles), subtle gridlines, gradient area fill; draw-on animation that plays **once** on first activation (NYT tone); mouse-follow tooltip (year + formatted production) with vertical crosshair guide and a marker dot sliding along the line.
- **ChoroplethMap**: hover highlight + tooltip (department name + tonnes); a color legend; animated color transitions on chapter/year change.
- New presentational sub-component `ColorLegend` (+ tests). Extend both existing viz test suites (strict TDD).

### Out of Scope
- Scroll-tied / progress-driven animation (no continuous [0,1] signal exists).
- Any change to `useActiveChapter` (sole store writer) or a new store signal.
- Data-layer, `useD3Scales`, `useDataInterpolation`, `Scrollytelling.tsx`, `StickyVisualization.tsx` changes.
- Replaying the line draw-on on every revisit.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `sticky-visualization`: adds interactivity requirements — LineChart axes/gridlines/gradient/draw-on-once/tooltip; ChoroplethMap hover/tooltip/legend/animated fill. Reaffirms the React-owns-SVG / D3-math-only contract for all new elements.

## Approach

Exploration Approach A. Framer Motion `motion.path` with animated `strokeDashoffset` for draw-on, triggered on mount/activation (not scroll). Axes/gridlines from `scale.ticks()` mapped to `<line>`/`<text>` JSX. Tooltip via `onMouseMove` + `d3.bisector` (pure math) + `useState`, rendered as an SVG `<g>` overlay to stay coordinate-consistent and within the hybrid contract. Choropleth hover via `onMouseEnter/Leave` + `useState`; color change via CSS `style={{ transition: 'fill 300ms ease' }}`. Zero `d3.select/.append/.attr/.transition`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/coffee-story/visualizations/LineChart.tsx` | Modified | Axes, gradient area, draw-on, tooltip |
| `src/features/coffee-story/visualizations/ChoroplethMap.tsx` | Modified | Hover, tooltip, CSS fill transition, legend |
| `src/features/coffee-story/visualizations/ColorLegend.tsx` | New | Legend swatches |
| `*.test.tsx` (both viz + ColorLegend) | New/Modified | Extend/add suites |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `getTotalLength()` absent in JSDOM | High | Mock `SVGPathElement.prototype.getTotalLength` in animation tests |
| Tooltip pointer coords wrong | Med | Use `getBoundingClientRect` on `<svg>`, not `offsetX/Y` |
| CSS fill transition untestable in JSDOM | Med | Assert style prop presence, not timing |
| 400-line PR budget exceeded | High | Split into 2 PRs (LineChart, then ChoroplethMap) |
| Static D3-guard tests regress | Low | Guards target D3 APIs; JSX-only additions keep them green |

## Rollback Plan

Per-slice `git revert` of the PR. Both viz are self-contained presentational components; reverting restores prior static rendering with no store, data, or hook impact.

## Dependencies

- Framer Motion (already on stack). No new dependencies.

## Rollout — 2 Slices

- **PR 1 — LineChart**: axes, gridlines, gradient, draw-on-once, tooltip/crosshair/marker.
- **PR 2 — ChoroplethMap + ColorLegend**: hover, tooltip, legend, animated fill.

## Success Criteria

- [ ] LineChart shows labeled axes, gridlines, gradient fill; draw-on plays once on first activation.
- [ ] Line tooltip tracks the cursor with crosshair + sliding marker (year + production).
- [ ] Choropleth highlights on hover, shows department + tonnes tooltip, renders a legend, and animates fill on chapter/year change.
- [ ] D3-guard and full test suites pass; no `d3.select/.transition` introduced.
- [ ] Delivered as 2 review-focused PRs under the 400-line budget.
