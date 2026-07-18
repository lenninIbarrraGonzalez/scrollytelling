# Proposal: Three New Scrollytelling Sections (Chapters 6, 7, 8)

## Intent

EVA already fetches `areaHarvested` (ha) and `yield` (t/ha) per department, but no visualization consumes them today. This wastes available data and leaves the coffee story incomplete after the choropleth. Three new chapters exploit these fields to tell the efficiency/regional-shift narrative — with zero new data fetches.

## Scope

### In Scope
- Chapter 6 — new `'scatter'` viz: bubble chart X=areaHarvested, Y=yield, radius=production; one bubble/department for `dataYear`; excludes `areaHarvested === 0`; highlights 6 protagonists.
- Chapter 7 — new `'slope'` viz: production-ranking slope 2007 vs 2024 via new `rankingYears?: [number, number]`; top-10 (`SLOPE_TOP_N`) ∪ 6 protagonists (≤16 lines).
- Chapter 8 — reuse `viz: 'line'` with new `seriesMode?: 'production' | 'weighted-yield'`; national weighted yield = Σprod/Σarea (filter area > 0). LineChart gains `yAxisLabel?: string`.
- Domain: `viz` union → `+ 'scatter' | 'slope'`; new optional Chapter fields.
- New pure selectors + colocated tests; new `ScatterBubbleChart`/`SlopeChart` components.
- `StickyVisualization` binary-ternary → explicit per-viz branches.

### Out of Scope
- No new API calls / data fetches (all data in `departmentSeries`).
- No changes to scroll store, IntersectionObserver, ChapterText.
- No LineChart changes beyond `yAxisLabel`; no ChoroplethMap/ColorLegend changes.

## Capabilities

### New Capabilities
None.

### Modified Capabilities
- `sticky-visualization`: MUST render `scatter` and `slope` viz via explicit branches (no silent choropleth fallback); each new chart is React-owned SVG with D3 math only.
- `scroll-narrative`: chapter count grows from 5 to 8; typed content adds `rankingYears`, `seriesMode`.

## Approach

Reuse `line` for Ch.8 to cap the union at two new values and inherit its draw-on animation/tooltip. Two new components (`ScatterBubbleChart`, `SlopeChart`) follow existing convention: React owns SVG, D3 `scaleLinear` for encodings, tooltip via `useState`, protagonist highlight via stroke/color. Aggregation lives in new pure `coffeeSelectors.ts` (`buildScatterData`, `buildSlopeData`, `buildWeightedYieldSeries`), all guarding `areaHarvested > 0`. Refactor `StickyVisualization` first so unknown viz values no longer fall through to the map.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain/coffee.ts` | Modified | viz union + `rankingYears?`, `seriesMode?` |
| `src/features/coffee-story/selectors/coffeeSelectors.ts` | New | scatter/slope/weighted-yield selectors + `SLOPE_TOP_N` |
| `src/features/coffee-story/visualizations/ScatterBubbleChart.tsx` | New | Ch.6 |
| `src/features/coffee-story/visualizations/SlopeChart.tsx` | New | Ch.7 |
| `src/features/coffee-story/visualizations/StickyVisualization.tsx` | Modified | explicit branches + new props |
| `src/features/coffee-story/visualizations/LineChart.tsx` | Modified | `yAxisLabel?` prop |
| `src/features/coffee-story/content/chapters.ts` | Modified | chapters 6/7/8 |
| `src/features/coffee-story/components/Scrollytelling.tsx` | Modified | derived data per new chapter |
| `chapters.test.ts`, `staticGuards.test.ts` | Modified | length 5→8, index range, viz allowlist, new file guards |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Silent choropleth fallback on unknown viz | High | Refactor ternary first; explicit branches |
| `areaHarvested === 0` means "absent" | High | All selectors filter `> 0`; divide-by-zero guard |
| Slope chart saturation (33 depts) | Med | Cap via `SLOPE_TOP_N = 10` ∪ protagonists |
| Hardcoded test assertions break on RED | Med | Update length/index/allowlist same step (strict TDD) |
| `Scrollytelling.tsx` bloat | Low | Keep derivation in selectors, not component |

## Rollback Plan

Changes are additive and stacked in 3 PRs (domain+selectors, scatter/slope+refactor, weighted-yield line). Revert the offending PR; earlier merged PRs remain independently valid. New chapters/viz values can be removed from `chapters.ts` without touching existing chapters 1–5.

## Dependencies

None — all data available from `useCoffeeData` / `departmentSeries`.

## Success Criteria

- [ ] 8 chapters render; indexes `[0..7]`; `npm run check` green.
- [ ] Ch.6 scatter excludes zero-area departments; protagonists highlighted.
- [ ] Ch.7 slope shows ≤16 lines ranking 2007 vs 2024.
- [ ] Ch.8 line shows national weighted yield with correct `yAxisLabel`.
- [ ] No `d3.select` in new viz files; static guards pass.
