# Design: Three New Scrollytelling Sections (Chapters 6, 7, 8)

## Technical Approach

Extend the D3↔React hybrid pipeline additively. Two new viz union values (`scatter`, `slope`) get dedicated React-owned SVG components; chapter 8 reuses `LineChart` via a new `seriesMode` + `yAxisLabel`. All aggregation moves to a new pure `coffeeSelectors.ts` (zero React/D3-DOM), consumed by `Scrollytelling.tsx` via `useMemo` and threaded through `StickyVisualization`. `StickyVisualization`'s binary ternary is refactored to an explicit conditional chain so unknown viz values render `null` instead of a silent choropleth fallback. Delivered as 3 stacked PRs.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|----------|--------|----------|-----------|
| Ch.8 viz | Reuse `line` + `seriesMode`/`yAxisLabel` | New `weighted-yield` viz value | Caps union at 2 new values; inherits draw-on animation + tooltip |
| Aggregation home | New pure `coffeeSelectors.ts` + colocated test | Inline in `Scrollytelling.tsx` | Keeps container thin, selectors unit-testable without render |
| Viz switch | Explicit conditional chain → `null` default | Keep binary ternary | Removes silent choropleth fallback (High risk in proposal) |
| Absent-data guard | Filter `areaHarvested > 0` in every selector | Trust optional type | Adapter coerces empty→`0`; `0` means absent, divide-by-zero risk |
| Slope cardinality | `SLOPE_TOP_N = 10` ∪ protagonists (≤16 lines) | Render all 33 depts | Prevents slope saturation |
| Bubble radius | `scaleSqrt` on production | `scaleLinear` | Area-accurate encoding (radius² ∝ value) |

## Data Flow

    departmentSeries ──► coffeeSelectors (pure) ──► useMemo in Scrollytelling ──► StickyVisualization ──► viz component
       │  buildScatterData(series, year)        ► scatterData ──────────────────────────────────► ScatterBubbleChart
       │  buildSlopeData(series, yA, yB, topN)  ► slopeData ────────────────────────────────────► SlopeChart
       └  buildWeightedYieldSeries(series)      ► weightedYieldSeries (as `data`) + yAxisLabel ──► LineChart

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/domain/coffee.ts` | Modify | `viz` union + `'scatter'\|'slope'`; add `rankingYears?`, `seriesMode?`; add `ScatterDatum`, `SlopeDatum`, `YieldDatum` |
| `src/features/coffee-story/selectors/coffeeSelectors.ts` | Create | 3 selectors + `SLOPE_TOP_N = 10` |
| `.../selectors/coffeeSelectors.test.ts` | Create | Unit tests for all selectors (guards, edges) |
| `.../visualizations/ScatterBubbleChart.tsx` | Create | Ch.6 bubble chart |
| `.../visualizations/SlopeChart.tsx` | Create | Ch.7 slope chart |
| `.../visualizations/StickyVisualization.tsx` | Modify | Explicit branch chain + `scatterData?`/`slopeData?` props + widen `activeViz` |
| `.../visualizations/LineChart.tsx` | Modify | Add `yAxisLabel?: string` (default `"Toneladas"`) |
| `.../components/Scrollytelling.tsx` | Modify | Derive scatter/slope/weighted-yield via `useMemo`; pass `yAxisLabel` |
| `.../content/chapters.ts` | Modify | Add chapters 6/7/8 |
| `.../content/chapters.test.ts` | Modify | Length 5→8, index `[0..7]`, viz allowlist |
| `src/test/staticGuards.test.ts` | Modify | Add no-`d3.select` guards for new viz files |

## Interfaces / Contracts

```ts
// domain/coffee.ts
export type Viz = 'line' | 'choropleth' | 'scatter' | 'slope'
export interface ScatterDatum { daneCode: string; department: string; areaHarvested: number; yield: number; production: number }
export interface SlopeDatum { daneCode: string; department: string; rankA: number; rankB: number }
export interface YieldDatum { year: number; production: number; areaHarvested: number; yield: number }
// Chapter += rankingYears?: [number, number]; seriesMode?: 'production' | 'weighted-yield'
```

Selector behavior:
- `buildScatterData(series, year)`: filter `year`, drop `areaHarvested===0 || production===0 || yield===0`, map to `ScatterDatum`.
- `buildSlopeData(series, yearA, yearB, topN)`: production-by-dept for each year → sort `yearB` desc → take `topN` ∪ protagonist codes → rank (1-indexed) both years → `SlopeDatum[]`.
- `buildWeightedYieldSeries(series)`: group by year, sum `production` and `areaHarvested` (`>0` only), `yield = Σprod/Σarea`, sort by year → `YieldDatum[]`.

Component SVG layout:
- **ScatterBubbleChart** margins `{20,30,50,60}`; `scaleLinear` X(area)/Y(yield), `scaleSqrt` radius(production); protagonists stroke `#6b4c11`+wider, others semi-transparent; `useState` tooltip on enter/leave (dept, prod t, area ha, yield t/ha); `motion.circle` `scale 0→1`; axes `scale.ticks(5)` as JSX; labels "Área cosechada (ha)" / "Rendimiento (t/ha)".
- **SlopeChart** two columns at left/right margins (year labels top); `scaleLinear` Y `[1,maxRank]→[top,bottom]` (rank 1 top); per datum left+right dot + `motion.path` (`pathLength 0→1`); labels outside columns (left-aligned left, right-aligned right); protagonists bold + `#6b4c11`, others `#aaa`; no tooltip.
- **LineChart** replace hardcoded `"Toneladas"` with `yAxisLabel` prop default `"Toneladas"`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | selectors: zero-area exclusion, ranking order, top-N∪protagonists, weighted-yield math, divide-by-zero guard | Vitest, small fixture factories (`makeSeries()`) |
| Component | Scatter bubbles/highlight/tooltip; Slope lines/labels; LineChart `yAxisLabel` | RTL `render`+`cleanup`, real D3 scales as props, `getTotalLength` stub |
| Integration | StickyVisualization renders each viz branch; `null` on unknown | RTL prop-driven `activeViz` cases |
| Static | no `d3.select`/`.transition(` in new viz files; chapter length/index/allowlist | `staticGuards.test.ts` raw-source scan; `chapters.test.ts` |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Pure client-side data transforms and SVG rendering.

## Migration / Rollout

No data migration. Additive across 3 stacked PRs: PR1 `pruebas-pr1` (domain + selectors + tests), PR2 `pruebas-pr2` (Scatter + Slope + Sticky refactor + chapters 6/7), PR3 `pruebas-pr3` (LineChart `yAxisLabel` + chapter 8 + staticGuards). Revert offending PR; earlier PRs stay independently valid.

## Open Questions

- [ ] `yield` unit mismatch: domain comment declares kg/ha; intent and axis label use t/ha. Confirm the adapter emits t/ha (or convert) before Ch.6/Ch.8 axis labels are correct. Non-blocking for structure but affects displayed values.
- [ ] Confirm PR chain targeting: stacked onto `main` vs. feature-branch chain (each child targets previous PR branch).
