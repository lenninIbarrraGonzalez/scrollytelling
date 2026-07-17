# Apply Progress: interactive-visualizations (PR1 + PR2)

## Change: interactive-visualizations
## Mode: Strict TDD
## Work Units: PR1 (LineChart) — complete; PR2 (ChoroplethMap + ColorLegend) — complete
## Date: 2026-07-17

---

## Completed Tasks

### PR1 — LineChart

- [x] PR1-1 — Global mock for `SVGPathElement.prototype.getTotalLength` (returning 500) in `beforeAll`/`afterAll`; `vi` imported from vitest. jsdom lacks SVGPathElement natively — stub class created on `globalThis` in `beforeAll`.
- [x] PR1-2 — Failing tests added for Y-tick labels, X-tick labels, gridline `<line>` elements, Y-axis title "Tonnes", X-axis title "Year".
- [x] PR1-3 — `LineChart.tsx` updated with Y/X scale ticks → JSX gridlines + labels using `d3.format('.2s')`; rotated Y-axis title; X-axis title. Zero `d3.select`/`.append()`.
- [x] PR1-4 — Failing tests added for `<defs>`, `<linearGradient>` with non-empty id, area `<path>` with `fill="url(#gradientId)"`.
- [x] PR1-5 — `LineChart.tsx` updated with `<defs>`+`<linearGradient id="lineGradient">`, `d3.area` generator, area `<path fill="url(#lineGradient)">` below main line.
- [x] PR1-6 — Failing tests added: (a) `data-testid="line-path"` element present after mount, (b) re-render does not reset animation (hasAnimated stays true), (c) mounts without throw when `getTotalLength` absent.
- [x] PR1-7 — `LineChart.tsx` updated: main line converted to `<motion.path data-testid="line-path">`, `pathRef`+`hasAnimated` refs added, `useEffect` reads `getTotalLength?.() ?? 0` and sets `animState` once, graceful fallback.
- [x] PR1-8 — Failing tooltip tests added: mousemove → tooltip `<g data-testid="tooltip">` with year text; mouseLeave → tooltip absent; source scan for `d3.bisector`/`getBoundingClientRect`/no `offsetX`.
- [x] PR1-9 — `LineChart.tsx` updated with `tooltip`/`setTooltip` state, `onMouseMove` using `getBoundingClientRect` + `d3.bisector`, `onMouseLeave` clears; tooltip `<g>` contains crosshair `<line>`, marker `<circle>`, year+production `<text>`.
- [x] PR1-10 — [VERIFY] D3-guard test confirmed passing in full `npm run check` run. All 186 tests pass across 23 test files.

### PR2 — ChoroplethMap + ColorLegend

- [x] PR2-1 — [RED] `ColorLegend.test.tsx` created with 5 tests: (a) default 6 `<rect>` swatches, (b) custom steps count, (c) each `<rect>` fill matches colorScale output, (d) min/max `<text>` labels from domainExtent, (e) source guard: no useState/useEffect/useStore/useScrollStore.
- [x] PR2-2 — [GREEN] `ColorLegend.tsx` created: pure presentational `<g>`; `steps` evenly-spaced `<rect>` swatches sampled across domainExtent; min/max `<text>` labels. No hooks, no side effects.
- [x] PR2-3 — [RED] Hover tests added to `ChoroplethMap.test.tsx`: (a) mouseEnter "Antioquia" → strokeWidth 2.5, "Cundinamarca" not hovered; (b) mouseLeave → reverts; (c) mouseEnter "Cundinamarca" while "Antioquia" hovered → mutual exclusive hover.
- [x] PR2-4 — [GREEN] `ChoroplethMap.tsx` updated: `useState<string | null>(null)` for hoveredDane; `onMouseEnter` sets daneCode; `onMouseLeave` clears; hovered path gets `strokeWidth={2.5}` and `stroke="#333"`.
- [x] PR2-5 — [RED] Tooltip tests added to `ChoroplethMap.test.tsx`: (a) mouseEnter "Valle del Cauca" → tooltip `<g data-testid="choropleth-tooltip">` with name + production text; (b) mouseLeave → tooltip null.
- [x] PR2-6 — [GREEN] `ChoroplethMap.tsx` updated: `useState<TipState | null>(null)` for tip; `useRef<SVGSVGElement>` on svg; `onMouseEnter` sets tip with name+production; `onMouseLeave` clears; tooltip `<g>` with rect background + two text elements.
- [x] PR2-7 — [RED] CSS transition tests added to `ChoroplethMap.test.tsx`: (a) every `path[data-dane-code]` has style.transition containing "fill" and "300ms"; (b) after data update, transition still present and fill updated.
- [x] PR2-8 — [GREEN] `ChoroplethMap.tsx` — `style={{ transition: 'fill 300ms ease' }}` present on every department `<path>` (was co-implemented with PR2-6; tests confirmed GREEN). No `d3.transition`.
- [x] PR2-9 — [RED] Integration test added: with `domainExtent` prop, `<rect>` swatches ≥ 1 rendered inside SVG.
- [x] PR2-10 — [GREEN] `ChoroplethMap.tsx` — accepts `domainExtent?: [number, number]`; renders `<ColorLegend colorScale={colorScale} domainExtent={domainExtent} />` inside the SVG when domainExtent is provided (co-implemented with PR2-6).
- [x] PR2-11 — [SCOPE-FLAG] `StickyVisualization.tsx` — added optional `domainExtent?: [number, number]` to props interface and destructuring; passes `domainExtent={domainExtent}` to `<ChoroplethMap>`.
- [x] PR2-12 — [SCOPE-FLAG] `Scrollytelling.tsx` — passes `domainExtent={productionExtent}` to `<StickyVisualization>`. One-line addition.
- [x] PR2-13 — [VERIFY] `npm run check` → tsc clean, 24 test files, 199 tests passed (up from 186 in PR1). D3-guard tests still green. All ColorLegend and ChoroplethMap tests pass.

---

## TDD Cycle Evidence

### PR1

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| PR1-1 | `LineChart.test.tsx` | Unit/Integration | ✅ 6/6 | ✅ Written (mock needed for subsequent tasks) | ✅ 6 passed | ➖ Infrastructure mock | ✅ Clean |
| PR1-2 | `LineChart.test.tsx` | Integration | ✅ 6/6 | ✅ Written → 13 failing | ✅ Passed after PR1-3 | ✅ 5 axis scenarios | ➖ None needed |
| PR1-3 | `LineChart.tsx` | Integration | ✅ 6/6 | via PR1-2 | ✅ All axis tests green | ✅ Covered by PR1-2 cases | ➖ None needed |
| PR1-4 | `LineChart.test.tsx` | Integration | ✅ 6/6 | ✅ Written → failing | ✅ Passed after PR1-5 | ✅ 3 gradient scenarios | ➖ None needed |
| PR1-5 | `LineChart.tsx` | Integration | ✅ 6/6 | via PR1-4 | ✅ All gradient tests green | ✅ Covered by PR1-4 cases | ➖ None needed |
| PR1-6 | `LineChart.test.tsx` | Integration | ✅ 6/6 | ✅ Written → failing | ✅ Passed after PR1-7 | ✅ 3 animation scenarios | ➖ None needed |
| PR1-7 | `LineChart.tsx` | Integration | ✅ 6/6 | via PR1-6 | ✅ All animation tests green | ✅ Covered by PR1-6 cases | ➖ None needed |
| PR1-8 | `LineChart.test.tsx` | Integration | ✅ 6/6 | ✅ Written → failing | ✅ Passed after PR1-9 | ✅ 3 tooltip scenarios | ✅ Replaced `require()` with static imports |
| PR1-9 | `LineChart.tsx` | Integration | ✅ 6/6 | via PR1-8 | ✅ All tooltip tests green | ✅ Covered by PR1-8 cases | ➖ None needed |
| PR1-10 | Full suite | All | N/A | via existing guard test | ✅ 186/186 passed, tsc clean | ✅ Guard still green | ➖ None needed |

### PR2

| Task | Test File | Layer | RED | GREEN | Notes |
|------|-----------|-------|-----|-------|-------|
| PR2-1 | `ColorLegend.test.tsx` | Unit | ✅ Import error (module absent) | ✅ 5/5 after PR2-2 | Full RED confirmed |
| PR2-2 | `ColorLegend.tsx` | Unit | via PR2-1 | ✅ 5/5 ColorLegend tests | Pure presentational |
| PR2-3 | `ChoroplethMap.test.tsx` | Integration | ✅ 3 hover tests failing | ✅ Passed after PR2-4 | fireEvent.mouseEnter/Leave |
| PR2-4 | `ChoroplethMap.tsx` | Integration | via PR2-3 | ✅ 9/9 (was 6) | hoveredDane state |
| PR2-5 | `ChoroplethMap.test.tsx` | Integration | ✅ 2 tooltip tests failing | ✅ Passed after PR2-6 | choropleth-tooltip testid |
| PR2-6 | `ChoroplethMap.tsx` | Integration | via PR2-5 | ✅ 11/11 | tip state + SVG <g> overlay |
| PR2-7 | `ChoroplethMap.test.tsx` | Integration | co-impl with PR2-8 | ✅ 13/13 | style.transition present |
| PR2-8 | `ChoroplethMap.tsx` | Integration | via PR2-7 | ✅ 13/13 | style={{ transition: 'fill 300ms ease' }} |
| PR2-9 | `ChoroplethMap.test.tsx` | Integration | n/a (co-impl) | ✅ 14/14 | ColorLegend rects in SVG |
| PR2-10 | `ChoroplethMap.tsx` | Integration | via PR2-9 | ✅ 14/14 | domainExtent → ColorLegend |
| PR2-11 | `StickyVisualization.tsx` | Scope-flag | n/a | ✅ tsc clean | One-line prop passthrough |
| PR2-12 | `Scrollytelling.tsx` | Scope-flag | n/a | ✅ tsc clean | productionExtent → domainExtent |
| PR2-13 | Full suite | All | n/a | ✅ 199/199 | 24 test files, tsc clean |

**Note on PR2-7/8 co-implementation**: `style={{ transition: 'fill 300ms ease' }}` was added during the PR2-6 GREEN step. PR2-7 tests were added afterward and immediately GREEN. The RED gate was not strict for this specific style attribute since it was bundled in the tooltip implementation pass. This is noted as a minor deviation.

---

## Work Unit Evidence

| Evidence | Value |
|---|---|
| Focused test command (ColorLegend) | `npx vitest run ColorLegend.test.tsx` → 5 passed |
| Focused test command (ChoroplethMap) | `npx vitest run ChoroplethMap.test.tsx` → 14 passed |
| Full suite command | `npm run check` (tsc -b && vitest run) → 24 test files, 199 tests passed, exit 0 |
| Runtime harness | Dev server: hover departments, verify legend appears — manual verification |
| Rollback boundary | `git revert` PR2 commit; ChoroplethMap reverts to static; ColorLegend removed; StickyVisualization/Scrollytelling prop removed |

---

## Files Changed

| File | Action | What Changed |
|------|--------|-------------|
| `src/features/coffee-story/visualizations/ColorLegend.tsx` | Created | Pure presentational swatch bar: `steps` `<rect>` + min/max `<text>` labels. No hooks. |
| `src/features/coffee-story/visualizations/ColorLegend.test.tsx` | Created | 5 tests: swatch count, custom steps, fill correctness, label text, source guard |
| `src/features/coffee-story/visualizations/ChoroplethMap.tsx` | Modified | hover state (`hoveredDane`), tooltip state (`tip`+svgRef), CSS transition style, `domainExtent` prop, ColorLegend integration |
| `src/features/coffee-story/visualizations/ChoroplethMap.test.tsx` | Modified | Added 8 new tests: hover (3), CSS transition (2), tooltip (2), ColorLegend integration (1) |
| `src/features/coffee-story/visualizations/StickyVisualization.tsx` | Modified | Added optional `domainExtent?: [number, number]` prop; passes through to ChoroplethMap |
| `src/features/coffee-story/components/Scrollytelling.tsx` | Modified | Passes `domainExtent={productionExtent}` to StickyVisualization |

---

## Deviations from Design

- **PR2-7/8 co-implementation**: The `style={{ transition: 'fill 300ms ease' }}` was added during the PR2-6 GREEN pass (tooltip implementation), not as a separate RED→GREEN cycle for PR2-7. This is a minor TDD sequencing deviation — the production code was correct, and the PR2-7 tests still verified the behavior. All tests pass.
- **Tooltip `toLocaleString` locale**: Used `toLocaleString('en-US')` in the tooltip display (vs bare `toLocaleString()`) because the test environment uses a locale that formats numbers with periods (12.345 instead of 12,345). The `en-US` explicit locale ensures consistent comma-formatted output in tests and production.

## Status

23/23 tasks complete (10 PR1 + 13 PR2). Ready for sdd-verify.
