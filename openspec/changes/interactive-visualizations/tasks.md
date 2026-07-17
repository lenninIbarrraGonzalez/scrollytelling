# Tasks: Interactive, Crafted Visualizations

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | PR1 ≈ 180–220 lines; PR2 ≈ 200–260 lines (total ≈ 380–480) |
| 400-line budget risk | Medium (each PR stays well under 400; total split is safe) |
| Chained PRs recommended | Yes |
| Suggested split | PR1 → LineChart only; PR2 → ChoroplethMap + ColorLegend + one-line prop thread |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | LineChart: axes, gradient, draw-on animation, tooltip | PR1 | `npm run check` (tsc -b && vitest run -- LineChart) | Dev server: open scrollytelling chapter 2–3, inspect chart | `git revert` PR1 commit; LineChart reverts to static |
| 2 | ChoroplethMap: hover, tooltip, CSS transition, ColorLegend; prop thread | PR2 | `npm run check` (tsc -b && vitest run -- ChoroplethMap ColorLegend) | Dev server: hover departments, verify legend appears | `git revert` PR2 commit; ChoroplethMap reverts to static |

---

## PR1 — LineChart

### PR1 Phase 1: Test Setup

- [x] **PR1-1** [RED] `src/features/coffee-story/visualizations/LineChart.test.tsx` — add global mock for `SVGPathElement.prototype.getTotalLength` returning `500` in `beforeAll`, with `afterAll` cleanup; import `vi` from vitest. (Covers REQ-LC-14, REQ-NFR-07)

### PR1 Phase 2: Axes and Gridlines

- [x] **PR1-2** [RED] `LineChart.test.tsx` — add failing tests: (a) SVG contains `<text>` elements with Y-tick labels (numeric strings), (b) contains `<text>` with X-axis year values, (c) contains `<line>` gridline elements, (d) contains `<text>` Y-axis title "Tonnes", (e) contains `<text>` X-axis title "Year". (Covers REQ-LC-01–06)
- [x] **PR1-3** [GREEN] `LineChart.tsx` — add Y-scale ticks: map `yScale.ticks(5)` → `<line>` + `<text>` JSX for gridlines + tick labels using `d3.format('.2s')`; add X-scale ticks: map `xScale.ticks(6)` → `<text>` JSX; add rotated `<text>` axis titles for both axes. Zero `d3.select`/`.append()`. (Covers REQ-LC-01–06, REQ-NFR-01–02)

### PR1 Phase 3: Gradient Area Fill

- [x] **PR1-4** [RED] `LineChart.test.tsx` — add failing tests: (a) rendered SVG contains `<defs>`, (b) `<linearGradient>` with non-empty `id` inside `<defs>`, (c) `<path>` with `fill` attribute matching `url(#<gradientId>)`. (Covers REQ-LC-07–09)
- [x] **PR1-5** [GREEN] `LineChart.tsx` — add `<defs>` + `<linearGradient id="lineGradient">` with two `<stop>` elements (opaque at top, transparent at baseline); add `d3.area().y0(innerHeight).y1(ySc(d.production))` generator; render area `<path fill="url(#lineGradient)">` below the main line `<path>`. (Covers REQ-LC-07–09, REQ-NFR-02)

### PR1 Phase 4: Draw-on Animation

- [x] **PR1-6** [RED] `LineChart.test.tsx` — add failing tests: (a) main line is a `motion.path` with `strokeDasharray`/`strokeDashoffset` props present after mount (with getTotalLength mocked to 500); (b) re-render does not reset offset to 500 (hasAnimated stays true); (c) component mounts without throwing when `getTotalLength` is undefined (remove mock for this sub-test). (Covers REQ-LC-10–14)
- [x] **PR1-7** [GREEN] `LineChart.tsx` — convert main line `<path>` to `<motion.path>`; add `pathRef = useRef<SVGPathElement>(null)`; add `hasAnimated = useRef(false)`; in `useEffect`, if `!hasAnimated.current`, read `pathRef.current?.getTotalLength?.() ?? 0`, set `strokeDasharray`/`strokeDashoffset` via Framer Motion `animate`, set `hasAnimated.current = true`. Graceful fallback to length 0 if `getTotalLength` absent. (Covers REQ-LC-10–14, REQ-NFR-01)

### PR1 Phase 5: Mouse-Follow Tooltip

- [x] **PR1-8** [RED] `LineChart.test.tsx` — add failing tests: (a) `fireEvent.mouseMove` on SVG (with `getBoundingClientRect` mocked) renders a tooltip `<g>` containing `"2001"` text, a vertical `<line>` crosshair, and a `<circle>` marker dot; (b) `fireEvent.mouseLeave` on SVG removes the tooltip `<g>`; (c) source scan: `"d3.bisector"` present, `"getBoundingClientRect"` present, `"offsetX"` absent. (Covers REQ-LC-15–21)
- [x] **PR1-9** [GREEN] `LineChart.tsx` — add `[tooltip, setTooltip] = useState<LineTooltip>(null)`; add `onMouseMove` handler: compute `x = e.clientX - svgRef.current.getBoundingClientRect().left - MARGIN.left`, use `d3.bisector(d => d.year).left(data, xScale.invert(x))` for nearest point, call `setTooltip({x, y, year, production})`; add `onMouseLeave` → `setTooltip(null)`; render tooltip as `<g>` containing `<line>` crosshair, `<circle>` dot, `<text>` year+production. (Covers REQ-LC-15–21, REQ-NFR-04)

### PR1 Phase 6: D3-Guard Verification

- [x] **PR1-10** [VERIFY] `LineChart.test.tsx` — confirm existing D3-guard test (source scan for `"d3.select"`, `".append("`, `".attr("`, `"d3.axis"`) still passes without modification. Run `npm run check`. (Covers REQ-LC-06, REQ-NFR-03)

---

## PR2 — ChoroplethMap + ColorLegend

> Base: merged PR1 on `main`. PR2 targets `main`.

### PR2 Phase 1: ColorLegend Component (new file — no upstream deps)

- [ ] **PR2-1** [RED] Create `src/features/coffee-story/visualizations/ColorLegend.test.tsx` — tests: (a) renders exactly `steps` (default 6) `<rect>` elements; (b) each `<rect>` has correct `fill` from `colorScale`; (c) renders min/max `<text>` labels from `domainExtent`; (d) source scan: `"useState"`, `"useEffect"`, `"useStore"`, `"useScrollStore"` absent. (Covers REQ-CM-09–13)
- [ ] **PR2-2** [GREEN] Create `src/features/coffee-story/visualizations/ColorLegend.tsx` — pure presentational `<g>`; sample `colorScale` at `steps` evenly spaced values across `domainExtent`; render `steps` `<rect>` swatches + min/max `<text>` labels. Props: `colorScale: (v: number) => string`, `domainExtent: [number, number]`, `width?: number` (default 200), `steps?: number` (default 6). No hooks, no side effects. (Covers REQ-CM-09–12)

### PR2 Phase 2: ChoroplethMap — Hover Highlight

- [ ] **PR2-3** [RED] `ChoroplethMap.test.tsx` — add failing tests: (a) `mouseEnter` on "Antioquia" path → that path has `strokeWidth` 2.5, "Cundinamarca" has default stroke; (b) `mouseLeave` on "Antioquia" → reverts to default stroke, no department hovered; (c) `mouseEnter` "Cundinamarca" while "Antioquia" hovered → "Cundinamarca" gets hover stroke, "Antioquia" reverts. (Covers REQ-CM-01–04)
- [ ] **PR2-4** [GREEN] `ChoroplethMap.tsx` — add `[hoveredDane, setHoveredDane] = useState<string | null>(null)`; add `onMouseEnter={() => setHoveredDane(dane)}` + `onMouseLeave={() => setHoveredDane(null)}` to each department `<path>`; conditionally apply `strokeWidth={2.5} stroke="#333"` when `hoveredDane === dane`. Zero `d3.select`. (Covers REQ-CM-01–04, REQ-NFR-05)

### PR2 Phase 3: ChoroplethMap — Tooltip

- [ ] **PR2-5** [RED] `ChoroplethMap.test.tsx` — add failing tests: (a) `mouseEnter` on "Valle del Cauca" → tooltip `<g>` (or element) visible with text "Valle del Cauca" and value "12345" (or formatted); (b) `mouseLeave` → tooltip absent. (Covers REQ-CM-05–08)
- [ ] **PR2-6** [GREEN] `ChoroplethMap.tsx` — add `[tip, setTip] = useState<TipState | null>(null)`; on `onMouseEnter` set tip with `{x, y, name, production}`; on `onMouseLeave` clear tip; render tip as SVG `<g>` overlay with department name + production text. (Covers REQ-CM-05–08)

### PR2 Phase 4: CSS Fill Transition

- [ ] **PR2-7** [RED] `ChoroplethMap.test.tsx` — add failing tests: (a) any department `<path>` has `style.transition` containing `"fill"` and `"300ms"`; (b) after year prop change, each `<path>` still has `style.transition` containing `"fill 300ms ease"` and `fill` has updated. (Covers REQ-CM-14–16, REQ-NFR-08)
- [ ] **PR2-8** [GREEN] `ChoroplethMap.tsx` — add `style={{ transition: 'fill 300ms ease' }}` to every department `<path>`. No `d3.transition`. (Covers REQ-CM-14–15)

### PR2 Phase 5: ColorLegend Integration + domainExtent Prop Thread [SCOPE-FLAG]

- [ ] **PR2-9** [RED] `ChoroplethMap.test.tsx` — add failing test: with `domainExtent` prop provided, a `ColorLegend` child is rendered (query for `<rect>` swatches ≥ 1). (Covers REQ-CM-09)
- [ ] **PR2-10** [GREEN] `ChoroplethMap.tsx` — accept optional `domainExtent?: [number, number]` prop; render `<ColorLegend colorScale={colorScale} domainExtent={domainExtent ?? [0, 1]} />` inside the SVG. (Covers REQ-CM-09–11)
- [ ] **PR2-11** [SCOPE-FLAG] `src/features/coffee-story/visualizations/StickyVisualization.tsx` — accept and pass through optional `domainExtent?: [number, number]` prop to `<ChoroplethMap>`. One-line prop addition. (Design: prop thread)
- [ ] **PR2-12** [SCOPE-FLAG] `src/features/coffee-story/components/Scrollytelling.tsx` — pass existing `productionExtent` (already computed lines 88–95) as `domainExtent` prop to `<StickyVisualization>`. One-line addition. (Design: prop thread)

### PR2 Phase 6: D3-Guard + Full Suite Verification

- [ ] **PR2-13** [VERIFY] Run `npm run check` — confirm: (a) existing D3-guard tests pass; (b) all new `ColorLegend.test.tsx` and `ChoroplethMap.test.tsx` cases pass; (c) no TypeScript errors. (Covers REQ-NFR-03, REQ-NFR-06, REQ-NFR-09)
