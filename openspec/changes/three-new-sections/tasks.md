# Tasks: Three New Scrollytelling Sections (Chapters 6, 7, 8)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | PR1 ~180, PR2 ~320, PR3 ~120 — total ~620 |
| 400-line budget risk | High (total; each individual PR is under 400) |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → PR2 → PR3 (stacked-to-main) |
| Delivery strategy | chained PRs, stacked-to-main |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Domain types + pure selectors (TDD) | PR1 branch `pruebas-pr1` → main | `npm run check` | N/A — pure logic, no browser runtime | Revert `coffee.ts` additions + delete `coffeeSelectors.ts` + test |
| 2 | Scatter + Slope components + StickyVisualization refactor + chapters 6/7 | PR2 branch `pruebas-pr2` → main | `npm run check` | N/A — RTL unit tests cover render branches | Revert PR2 branch; PR1 remains valid |
| 3 | LineChart yAxisLabel + chapter 8 + weighted-yield wire-up | PR3 branch `pruebas-pr3` → main | `npm run check` | N/A — RTL + static guards cover wiring | Revert PR3 branch; PR1+PR2 remain valid |

---

## Phase 1 — Domain Foundation (PR1)

- [x] 1.1 **RED** — In `src/features/coffee-story/selectors/coffeeSelectors.test.ts` (create file): write failing test for `SLOPE_TOP_N === 10` (spec: SLOPE_TOP_N export value is 10)
- [x] 1.2 **RED** — In same test file: write failing tests for `buildScatterData` — empty-input returns `[]`, excludes `areaHarvested===0`, excludes `production===0`, returns correct `ScatterDatum` fields (spec scenarios: buildScatterData x4)
- [x] 1.3 **RED** — In same test file: write failing tests for `buildWeightedYieldSeries` — empty-input returns `[]`, excludes `areaHarvested===0` rows, weighted-yield math `Σprod/Σarea` (spec scenarios: buildWeightedYieldSeries x3)
- [x] 1.4 **RED** — In same test file: write failing tests for `buildSlopeData` — empty-input returns `[]`, top-N∪protagonists no duplicates, 1-indexed ranks descending by production (spec scenarios: buildSlopeData x3)
- [x] 1.5 Run `npm run check` — confirm **RED** (compile or test failures expected)
- [x] 1.6 **GREEN** — In `src/domain/coffee.ts`: extend `viz` union to `'line' | 'choropleth' | 'scatter' | 'slope'`; add `rankingYears?: [number, number]` and `seriesMode?: 'production' | 'weighted-yield'` to `Chapter`; export `ScatterDatum`, `SlopeDatum`, `YieldDatum` interfaces (design contracts)
- [x] 1.7 **GREEN** — Create `src/features/coffee-story/selectors/coffeeSelectors.ts`: export `SLOPE_TOP_N = 10`; implement `buildScatterData`, `buildSlopeData`, `buildWeightedYieldSeries` with `areaHarvested > 0` guards, protagonist DANE codes `['05','17','41','63','66','73']`, `scaleSqrt`-ready weighted yield math
- [x] 1.8 Run `npm run check` — confirm **GREEN** (all 11 selector scenarios pass)

---

## Phase 2 — Scatter + Slope Components + Sticky Refactor (PR2)

- [ ] 2.1 **RED** — In `src/features/coffee-story/visualizations/StickyVisualization.test.tsx`: add failing cases for `activeViz='scatter'` renders `ScatterBubbleChart`, `activeViz='slope'` renders `SlopeChart`, `activeViz='unknown'` renders nothing / null (spec: no silent fallback)
- [ ] 2.2 **RED** — In `src/features/coffee-story/content/chapters.test.ts`: update length assertion to `8`, add index assertions for `[5]`, `[6]`, `[7]`, add viz-allowlist assertion covering `'scatter'` and `'slope'`
- [ ] 2.3 **RED** — Create `src/features/coffee-story/visualizations/ScatterBubbleChart.test.tsx`: failing tests — renders bubbles for valid data, excludes zero-area entry, protagonist has distinct stroke, tooltip shown on enter (spec: ScatterBubbleChart scenarios)
- [ ] 2.4 **RED** — Create `src/features/coffee-story/visualizations/SlopeChart.test.tsx`: failing tests — renders line per datum, protagonist has bold/distinct style, left+right labels rendered (spec: SlopeChart scenarios)
- [ ] 2.5 **RED** — In `src/test/staticGuards.test.ts`: add no-`d3.select` guard covering `ScatterBubbleChart.tsx` and `SlopeChart.tsx` (spec: no d3.select in new viz files)
- [ ] 2.6 Run `npm run check` — confirm **RED**
- [ ] 2.7 **GREEN** — Modify `src/features/coffee-story/visualizations/StickyVisualization.tsx`: replace binary ternary with explicit chain (`'line'` → `LineChart`, `'choropleth'` → `ChoroplethMap`, `'scatter'` → `ScatterBubbleChart`, `'slope'` → `SlopeChart`, default → `null`); add `scatterData?` and `slopeData?` props; widen `activeViz` prop type to `Viz`
- [ ] 2.8 **GREEN** — Create `src/features/coffee-story/visualizations/ScatterBubbleChart.tsx`: React-owns-SVG; D3 `scaleLinear` X(areaHarvested)/Y(yield), `scaleSqrt` radius(production); `motion.circle` scale 0→1; protagonist stroke `#6b4c11`; `useState` tooltip; axes via JSX `scale.ticks(5)`; labels "Área cosechada (ha)"/"Rendimiento (t/ha)"
- [ ] 2.9 **GREEN** — Create `src/features/coffee-story/visualizations/SlopeChart.tsx`: React-owns-SVG; D3 `scaleLinear` Y `[1,maxRank]→[top,bottom]`; `motion.path` pathLength 0→1 per datum; left/right dot + label columns; protagonist bold+`#6b4c11`, others `#aaa`; no tooltip; no `d3.select`
- [ ] 2.10 **GREEN** — Modify `src/features/coffee-story/content/chapters.ts`: add chapter objects at indexes 5, 6, 7 with `viz: 'scatter'`, `viz: 'slope'`, and correct `rankingYears`; set `source: 'EVA'` on all three; `chapters[6].rankingYears = [2007, 2024]`
- [ ] 2.11 **GREEN** — Modify `src/features/coffee-story/components/Scrollytelling.tsx`: add `useMemo` for `scatterData` (`buildScatterData(departmentSeries, dataYear)`) and `slopeData` (`buildSlopeData(departmentSeries, yearA, yearB, SLOPE_TOP_N)`); pass both to `StickyVisualization`
- [ ] 2.12 Run `npm run check` — confirm **GREEN** (all PR2 tests pass, static guard passes)

---

## Phase 3 — LineChart yAxisLabel + Chapter 8 + Weighted-Yield Wire-up (PR3)

- [ ] 3.1 **RED** — In `src/features/coffee-story/visualizations/LineChart.test.tsx`: add failing test — renders with custom `yAxisLabel` prop (e.g., `'t/ha'`) in Y-axis label element; default renders `'Toneladas'` when prop omitted (spec: LineChart yAxisLabel)
- [ ] 3.2 **RED** — In `src/features/coffee-story/content/chapters.test.ts`: add assertion that `chapters[7].seriesMode === 'weighted-yield'`; assert `chapters[7].source === 'EVA'`
- [ ] 3.3 **RED** — In `src/features/coffee-story/visualizations/StickyVisualization.test.tsx`: add failing case — `activeViz='line'` with `seriesMode='weighted-yield'` passes `yAxisLabel='t/ha'` to `LineChart`
- [ ] 3.4 Run `npm run check` — confirm **RED**
- [ ] 3.5 **GREEN** — Modify `src/features/coffee-story/visualizations/LineChart.tsx`: add optional `yAxisLabel?: string` prop defaulting to `'Toneladas'`; replace hardcoded `"Toneladas"` string in Y-axis label with the prop value
- [ ] 3.6 **GREEN** — Modify `src/features/coffee-story/content/chapters.ts`: add chapter 8 at index 7 with `viz: 'line'`, `seriesMode: 'weighted-yield'`, `source: 'EVA'`
- [ ] 3.7 **GREEN** — Modify `src/features/coffee-story/components/Scrollytelling.tsx`: add `useMemo` for `weightedYieldSeries` (`buildWeightedYieldSeries(departmentSeries)`); in `StickyVisualization` call, when `activeChapter.seriesMode === 'weighted-yield'` pass `data={weightedYieldSeries}` and `yAxisLabel='t/ha'`
- [ ] 3.8 **GREEN** — Modify `src/features/coffee-story/visualizations/StickyVisualization.tsx`: thread `yAxisLabel` prop to `LineChart` when `seriesMode === 'weighted-yield'`
- [ ] 3.9 Run `npm run check` — confirm **GREEN** (full suite including all 3 PR slices passes)

---

## Phase 4 — Cross-Cutting Verification

- [ ] 4.1 Confirm `npm run check` exits 0 with all selector tests (11 scenarios), component tests (Scatter/Slope/LineChart), integration tests (StickyVisualization branches), chapter tests (length 8, indexes, allowlist, seriesMode), and staticGuards (no `d3.select` in new files) passing
- [ ] 4.2 Verify open question from design: confirm `departmentSeries` adapter emits `rendimiento` in t/ha (not kg/ha) before axis labels `"Rendimiento (t/ha)"` and `yAxisLabel='t/ha'` are correct — escalate if unit mismatch found
