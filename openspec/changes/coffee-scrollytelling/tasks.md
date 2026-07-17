# Tasks: Coffee Scrollytelling — Evolution of Colombian Coffee Production

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,800 (greenfield: ~35 new files, tests + impl + config) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR-A (scaffold + domain) → PR-B (data layer) → PR-C (store + D3 hooks + visualizations) → PR-D (layout + content + wiring + polish) |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain (feat/coffee-scaffold-domain → PR-A) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

> **Action required before apply**: choose a chain strategy — `stacked-to-main`, `feature-branch-chain`, or `size-exception` — then confirm before `sdd-apply` starts.

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| PR-A | Vite scaffold + domain types | PR 1 | `npx vitest run src/domain` | N/A — no UI; tsc validates types | Delete `vite.config.ts`, `src/domain/`, config files |
| PR-B | Data layer (cache, Socrata, FAO, geo, load/error hook) | PR 2 | `npx vitest run src/data` | N/A — adapters use fixture data, no network | Delete `src/data/` |
| PR-C | Store + observer hook + D3 math hooks + SVG components | PR 3 | `npx vitest run src/features/coffee-story/store src/features/coffee-story/hooks src/features/coffee-story/visualizations` | N/A — RTL asserts SVG attrs under jsdom; IO mock | Delete `src/features/coffee-story/{store,hooks,visualizations}` |
| PR-D | Layout composition + typed content + App wiring + polish | PR 4 | `npx vitest run` | `npx vite preview` — manual scroll smoke (all 5 chapters, tween visible) | Delete `src/features/coffee-story/{components,content}`, `src/app/App.tsx` |

---

## Parallel Execution Map

```
Phase 1 → Phase 2 → (Phase 3a and Phase 3b and Phase 3c in parallel) → Phase 4 → Phase 5 → Phase 6
```

After Phase 2 (domain) is committed, three tracks can proceed simultaneously:
- Track A: Phase 3a — data layer (cache, Socrata, FAO, geo)
- Track B: Phase 3b — Zustand store + useActiveChapter
- Track C: Phase 3c — typed chapter content

Phase 4 (D3 math hooks) starts only after Track A and Track B both complete.
Phase 5 (SVG components + StickyVisualization) starts after Phase 4.
Phase 6 (composition + wiring + polish) starts after Phase 5 and Track C both complete.

---

## Phase 1: Project Scaffolding (Greenfield Bootstrap)

No spec scenario — all tasks are prerequisites. This is the first commit.

- [x] 1.1 Run `npm create vite@latest . -- --template react-ts` in repo root; confirm `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx` are generated.
- [x] 1.2 Install runtime deps: `npm install react react-dom d3 zustand framer-motion topojson-client`; confirm no peer-dep conflicts.
- [x] 1.3 Install dev deps: `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/d3 @types/react @types/react-dom @types/topojson-client`.
- [x] 1.4 Add `test` block to `vite.config.ts`: `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test/setup.ts']`; configure `coverage` provider. (implemented in vitest.config.ts — separate file avoids TS type conflict with vite's UserConfigExport)
- [x] 1.5 Create `src/test/setup.ts` with `import '@testing-library/jest-dom'`; write smoke test `src/test/smoke.test.ts` (`expect(1 + 1).toBe(2)`); run `npx vitest run` — must be green.
- [x] 1.6 Create feature-first folder skeleton (empty `index.ts` or `.gitkeep`): `src/features/coffee-story/{components,visualizations,hooks,store,content}/`, `src/data/{socrata,geo,fao}/`, `src/domain/`, `src/shared/`, `src/app/`.
- [x] 1.7 Create `src/app/App.tsx` as empty shell (`export default function App() { return null; }`) and wire into `src/main.tsx`.
- [x] 1.8 Gate: `npx tsc --noEmit` passes; `npx vitest run` passes smoke test.

---

## Phase 2: Domain Types (PR-A — Pure TS, No Runtime Deps)

Spec coverage: scroll-narrative "Typed Chapter Content", "Missing chapter id is a type error"; coffee-data "String-to-Numeric Domain Mapping".

- [x] 2.1 **RED** — Create `src/domain/coffee.test.ts`; write type-level test using `@ts-expect-error` asserting that a `Chapter` constructed without `id` is a compile error; assert `YearDatum.production` typed as `number` (not `string`); `npx vitest run src/domain` → fail or tsc catches error.
- [x] 2.2 **GREEN** — Create `src/domain/coffee.ts`; export: `YearDatum { year: number; production: number }`, `DepartmentProduction { daneCode: string; department: string; year: number; production: number; areaHarvested?: number; yield?: number }`, `ChapterSource = 'FAO' | 'EVA'`, `Chapter { id: string; index: number; source: ChapterSource; viz: 'line' | 'choropleth'; title: string; body: string; highlightDaneCodes?: string[]; annotations?: { year: number; label: string }[] }`, `NationalSeries = YearDatum[]`, `DepartmentSeries = DepartmentProduction[]`. Zero runtime logic; zero React/D3 imports.
- [x] 2.3 **VERIFY** — `npx tsc --noEmit` passes; domain tests green.

---

## Phase 3a: Data Layer — Cache, Socrata Client, Adapters, FAO, Geo (PR-B)

Spec coverage: coffee-data "Fetch-Once Cache", "Per-Dataset Coffee Filter Constants", "String-to-Numeric Domain Mapping", "EVA–GeoJSON Join by DANE Code", "FAO National Series Coverage", "Load and Error States".

### 3a.1 — Cache

- [ ] 3.1 **RED** — Create `src/data/cache.test.ts`; mock `fetch`; test: second call to `fetchOnce(url)` resolves same data with `fetch` called exactly once; test: two different URLs → two fetch calls; test: two concurrent calls to same URL deduplicate to one in-flight. *(spec: "Second call returns cached result", "Cache keyed per dataset")*
- [ ] 3.2 **GREEN** — Create `src/data/cache.ts`; export `createCache<T>()` returning `{ get(url, fetcher): Promise<T> }` backed by `Map<string, Promise<T>>`; store the promise (not resolved value) to deduplicate concurrent calls.
- [ ] 3.3 **VERIFY** — Cache tests green.

### 3a.2 — Socrata Client + Dataset Config

- [ ] 3.4 **RED** — Create `src/data/socrata/client.test.ts`; test: fluent builder `.select('a_o').where("cultivo='CAFE'").limit(5000).toURL(base)` produces correct SoQL query string; test: `.fetchJson<T>()` calls `fetch` and returns parsed JSON. *(design contract)*
- [ ] 3.5 **GREEN** — Create `src/data/socrata/client.ts`; export `socrataClient(baseUrl)` with fluent builder: `.select()`, `.where()`, `.group()`, `.order()`, `.limit()`, `.toURL()`, `.fetchJson<T>()`; delegate fetch to cache from 3.2.
- [ ] 3.6 **RED** — Create `src/data/socrata/datasetConfig.test.ts`; test: `OLD_EVA_CULTIVO_FILTER === 'CAFE'` (3 chars, no diacritics); test: `NEW_EVA_CULTIVO_FILTER === 'Café'` (4 chars, accent); test: importing a config with empty `cultivoFilter` throws before any network call. *(spec: "Old dataset filter CAFE", "New dataset filter Café", "Non-empty assertion fires at module load")*
- [ ] 3.7 **GREEN** — Create `src/data/socrata/datasetConfig.ts`; export `OLD_EVA_CULTIVO_FILTER = 'CAFE'`, `NEW_EVA_CULTIVO_FILTER = 'Café'`, `DatasetConfig` interface, `OLD_EVA_CONFIG` (endpoint `2pnw-mmge`, `cultivoFilter: 'CAFE'`, field map `{ year: 'a_o', production: 'producci_n_t', daneCode: 'c_d_dep' }`, yearRange `[2007, 2018]`), `NEW_EVA_CONFIG` (endpoint `uejq-wxrr`, `cultivoFilter: 'Café'`, field map to be confirmed, yearRange `[2019, 2024]`); guard: throw at module load if `cultivoFilter` is empty.

### 3a.3 — Socrata Adapter

- [ ] 3.8 **RED** — Create `src/data/socrata/adapter.test.ts` with inline fixture raw rows (no network); test: `{ producci_n_t: '626798.0', a_o: '2012', c_d_dep: '41', cultivo: 'CAFE' }` through `socrataAdapter(rows, OLD_EVA_CONFIG)` → `production === 626798` (typeof number), `year === 2012` (number), `daneCode === '41'`. *(spec: "producci_n_t → number", "a_o → number", "Huila DANE code 41")*
- [ ] 3.9 **RED** — Add fixture: `rea_sembrada_ha: '95432.5'` → `areaHarvested === 95432.5`. *(spec: "rea_sembrada_ha → number")*
- [ ] 3.10 **RED** — Add fixture: wrong `cultivo: 'cafe'` (lowercase) → adapter throws with descriptive message, NOT returns empty array. *(spec: "Wrong coffee filter yields error")*
- [ ] 3.11 **RED** — Add fixture: new-schema row with `cultivo: 'Café'` and `NEW_EVA_CONFIG` field names → correct mapping to `DepartmentProduction`. *(covers second EVA schema)*
- [ ] 3.12 **GREEN** — Create `src/data/socrata/adapter.ts`; export `socrataAdapter(rawRows: RawRow[], config: DatasetConfig): DepartmentProduction[]`; apply field map per config; coerce all numeric fields with `Number()`; validate cultivo value, throw on mismatch.
- [ ] 3.13 **VERIFY** — All adapter tests green.

### 3a.4 — Data Correctness (Fixture Sums)

- [ ] 3.14 **RED** — Add to `adapter.test.ts` or new `src/data/socrata/dataIntegrity.test.ts`: fixture rows covering all departments for year 2007; assert `sum(production) ≈ 828904 ±1000`; fixture for 2012; assert `sum(production) ≈ 626798 ±1000`. *(spec: "2007 EVA peak ~828,904 t", "2012 roya trough ~626,798 t")*
- [ ] 3.15 **VERIFY** — Data integrity tests green (no new impl required; adapter already handles this).

### 3a.5 — FAO Adapter

- [ ] 3.16 **RED** — Create `src/data/fao/faoAdapter.test.ts` with inline CSV fixture; test: year 1999 row → `production` within ±10,000 of 547,000; test: `Math.min(...series.map(d => d.year)) <= 1990`; test: returns `NationalSeries` (array of `YearDatum`). *(spec: "FAO 1999 trough", "FAO starts at 1990")*
- [ ] 3.17 **GREEN** — Create `src/data/fao/faoAdapter.ts`; parse CSV text with `d3.csvParse`; filter Colombia rows; `Number()` coerce production; restrict to 1990–2006; return `NationalSeries`.
- [ ] 3.18 **VERIFY** — FAO adapter tests green.

### 3a.6 — GeoJSON / TopoJSON Loader

- [ ] 3.19 **RED** — Create `src/data/geo/colombiaGeoLoader.test.ts`; mock fetch returning minimal TopoJSON with features `{ DPTO_CCDGO: '41' }` and `{ DPTO_CCDGO: '63', DPTO_CNMBR: 'QUINDIO' }`; test: returned `FeatureCollection` exposes `DPTO_CCDGO` on features; test: feature with code `'41'` findable (Huila); test: Quindío join succeeds by code despite name `'QUINDIO'` vs `'QUINDÍO'`. *(spec: "Huila joins by DANE code 41", "Name mismatch does not break join")*
- [ ] 3.20 **GREEN** — Create `src/data/geo/colombiaGeoLoader.ts`; fetch TopoJSON URL via cache; call `topojson.feature(topo, object)` to produce `FeatureCollection`; expose `DPTO_CCDGO` as primary join key; include NFD-normalize fallback on `DPTO_CNMBR`.
- [ ] 3.21 **VERIFY** — Geo loader tests green.

### 3a.7 — useCoffeeData Hook (Load / Error States)

- [ ] 3.22 **RED** — Create `src/data/useCoffeeData.test.ts`; mock `fetch`; test: while fetch in-flight → `loading === true`, `data === null`; test: on 500 → `error` instanceof `Error`, `loading === false`, `data === null`; test: on success → returned object has `nationalSeries` and `departmentSeries` with no raw field names (`producci_n_t`, `a_o`, `rea_sembrada_ha`, `c_d_dep`). *(spec: "Loading state before resolve", "Error state on 500", "Components never see raw field names")*
- [ ] 3.23 **GREEN** — Create `src/data/useCoffeeData.ts`; orchestrate parallel fetches (FAO + EVA old + EVA new + GeoJSON) via `Promise.all`; return `{ data: { nationalSeries, departmentSeries, geoFeatures } | null; loading: boolean; error: Error | null }`; never expose raw fields.
- [ ] 3.24 **VERIFY** — useCoffeeData tests green; `npx vitest run src/data` — all green.

---

## Phase 3b: Zustand Store + Observer Hook (PR-C — runs parallel to 3a after Phase 2)

Spec coverage: scroll-narrative "IntersectionObserver Sole Writer", "Scrolling backward", "Direct state write prohibited".

- [ ] 3b.1 **RED** — Create `src/features/coffee-story/store/scrollStore.test.ts`; test: `setActiveChapter('chapter-3')` → `activeChapterId === 'chapter-3'`; test: store module exports only `useScrollStore` (no bare `setActiveChapter` export). *(spec: "Direct state write prohibited")*
- [ ] 3b.2 **GREEN** — Create `src/features/coffee-story/store/scrollStore.ts`; Zustand store `{ activeChapterId: string | null; setActiveChapter(id: string): void }`; export `useScrollStore`; do NOT export `setActiveChapter` as a standalone function.
- [ ] 3b.3 **RED** — Create `src/features/coffee-story/hooks/useActiveChapter.test.ts`; stub `globalThis.IntersectionObserver` with a class storing callbacks + `.trigger(entries)` method; test: chapter-3 sentinel triggers threshold → `activeChapterId === 'chapter-3'`; test: trigger chapter-2 after chapter-3 was active → store updates to `'chapter-2'`; test: exactly one observer registered over all chapter refs. *(spec: "Chapter enters threshold", "Scrolling backward")*
- [ ] 3b.4 **GREEN** — Create `src/features/coffee-story/hooks/useActiveChapter.ts`; accept `chapters: Chapter[]` and chapter sentinel refs; create ONE `IntersectionObserver` with `rootMargin: '-45% 0px -45% 0px'`, `threshold: 0`; on intersect call `setActiveChapter(id)` — this is the ONLY writer; cleanup on unmount.
- [ ] 3b.5 **VERIFY** — Store + hook tests green.

---

## Phase 3c: Typed Chapter Content (PR-D — runs parallel to 3a/3b after Phase 2)

Spec coverage: scroll-narrative "Typed Chapter Content", "Missing chapter id is type error"; coffee-data "2021 La Niña annotation", "2007 source switch label".

- [ ] 3c.1 **RED** — Create `src/features/coffee-story/content/chapters.test.ts`; test: exported array has exactly 5 elements; each satisfies `Chapter` type; `chapters[0].source === 'FAO'`; `chapters[2].source === 'EVA'`; `chapters[4].highlightDaneCodes` includes `'41'` (Huila); at least one chapter has annotation with `label` containing `'La Niña'`. *(spec: "Typed chapter content", "2021 La Niña annotated", protagonist highlight)*
- [ ] 3c.2 **GREEN** — Create `src/features/coffee-story/content/chapters.ts`; export `const chapters: Chapter[]` with 5 objects: ch1 (1990s auge, `source: 'FAO'`, `viz: 'line'`), ch2 (2000 collapse, `source: 'FAO'`, `viz: 'line'`), ch3 (roya, `source: 'EVA'`, `viz: 'choropleth'`, highlight codes for Huila + eje cafetero: `['41','17','63','66','05','73']`), ch4 (recovery, `source: 'EVA'`, `viz: 'choropleth'`), ch5 (Huila vs eje cafetero, `source: 'EVA'`, `viz: 'choropleth'`, same highlight codes); include `annotations: [{ year: 2021, label: 'La Niña' }]` on ch4 or ch5; include 2007 source-switch note in `body` text (not in component).
- [ ] 3c.3 **VERIFY** — Content tests green.

---

## Phase 4: D3 Math Hooks (PR-C — after 3a and 3b)

Spec coverage: sticky-visualization "D3 Interpolation Between Chapter Datasets", "D3 interpolator is called, not bypassed"; "React Owns SVG — D3 Computes Math Only".

- [ ] 4.1 **RED** — Create `src/features/coffee-story/visualizations/useD3Scales.test.ts`; render hook with `domainExtent: [0, 1000000]` and `yRange: [400, 0]`; assert `xScale(0) === 0`, `xScale(1000000) === 400` (or range values); assert `colorScale(0)` returns a valid CSS color string. *(design contract: `useD3Scales`)*
- [ ] 4.2 **GREEN** — Create `src/features/coffee-story/visualizations/useD3Scales.ts`; `useMemo`-wrapped `d3.scaleLinear` for x and y, `d3.scaleSequential` for color; accept `{ domainExtent, xRange, yRange }`; return `{ xScale, yScale, colorScale }`; no DOM access.
- [ ] 4.3 **RED** — Create `src/features/coffee-story/visualizations/useDataInterpolation.test.ts`; call with `fromData = [{ year: 2012, production: 626798 }]`, `toData = [{ year: 2012, production: 700000 }]`, `progress = 0.5`; assert interpolated production ≈ 663399; spy on `d3.interpolate` and assert it is called. *(spec: "Choropleth tweens fill color", "D3 interpolator is called, not bypassed")*
- [ ] 4.4 **GREEN** — Create `src/features/coffee-story/visualizations/useDataInterpolation.ts`; build `d3.interpolate` per matched key (`year` for `NationalSeries`, `daneCode` for `DepartmentSeries`); accept `fromData`, `toData`, `progress` (0–1); return interpolated dataset; driven by Framer Motion `useMotionValue` / rAF — no `d3.transition`.
- [ ] 4.5 **VERIFY** — D3 math hook tests green.

---

## Phase 5: SVG Components + Sticky Switcher (PR-C — after Phase 4)

Spec coverage: sticky-visualization all requirements; coffee-data "2021 La Niña annotated", "2007 source switch labeled"; "No d3.select on SVG elements".

### 5.1 — LineChart

- [ ] 5.1 **RED** — Create `src/features/coffee-story/visualizations/LineChart.test.tsx`; render `<LineChart data={fixtures} width={600} height={400} />`; assert `<svg>` present; assert `<path d="...">` has non-empty `d` starting with `'M'`; assert annotation element containing `'La Niña'` present when data includes year 2021; assert source-switch label for 2007 present; mock `d3.select` to throw and confirm it is never called. *(spec: "D3 scale output drives React SVG attrs", "2021 La Niña annotated", "2007 source switch labeled", "No d3.select")*
- [ ] 5.2 **GREEN** — Create `src/features/coffee-story/visualizations/LineChart.tsx`; accept `data: NationalSeries`, `width`, `height`, `annotations?`, `sourceLabel?`; compute path `d` with `d3.line()` and `useD3Scales`; render `<path d={lineD} />` as React prop; render annotation markers as `<text>` or `<title>`; render 2007 source-switch label; zero `d3.select`.
- [ ] 5.3 **VERIFY** — LineChart tests green.

### 5.2 — ChoroplethMap

- [ ] 5.4 **RED** — Create `src/features/coffee-story/visualizations/ChoroplethMap.test.tsx`; render with geo fixture (Huila `'41'` and Vaupés `'97'`) and production map; assert one `<path>` per feature; assert Huila path `fill` equals `colorScale(production)` (React prop, not DOM mutation); assert Huila `stroke-width` or class is distinct from Vaupés; mock `d3.select` to throw. *(spec: "D3 scale output → React SVG attrs", "Protagonist distinct stroke", "Non-protagonist default style", "No d3.select")*
- [ ] 5.5 **GREEN** — Create `src/features/coffee-story/visualizations/ChoroplethMap.tsx`; accept `features: Feature[]`, `productionByDane: Map<string, number>`, `colorScale`, `highlightDaneCodes: string[]`, `geoPath`; render `<path d={geoPath(f)} fill={colorScale(val)} strokeWidth={isProtagonist ? 2 : 0.5} />`; zero `d3.select`.
- [ ] 5.6 **VERIFY** — ChoroplethMap tests green.

### 5.3 — StickyVisualization

- [ ] 5.7 **RED** — Create `src/features/coffee-story/visualizations/StickyVisualization.test.tsx`; spy on `useEffect` with empty deps — assert fires exactly once across multiple `activeChapterId` store updates; assert root node (`data-testid="sticky-viz"`) persists across chapter switches; assert `<LineChart>` when active chapter `source === 'FAO'`; assert `<ChoroplethMap>` when `source === 'EVA'` without root unmounting. *(spec: "Single mount — never unmounts", "D3 interpolation state preserved")*
- [ ] 5.8 **GREEN** — Create `src/features/coffee-story/visualizations/StickyVisualization.tsx`; subscribe read-only to `useScrollStore(s => s.activeChapterId)`; outer wrapper with `data-testid="sticky-viz"` never unmounts; conditionally render `<LineChart>` or `<ChoroplethMap>` inside based on active chapter `viz` field; wire `useDataInterpolation` for smooth transitions.
- [ ] 5.9 **VERIFY** — StickyVisualization tests green.

---

## Phase 6: Layout Composition, App Wiring, and Polish (PR-D — after Phase 5 and 3c)

Spec coverage: scroll-narrative "Smooth Text Transitions", "Inactive chapter text not visible"; coffee-data "Components never see raw field names"; proposal success criteria.

### 6.1 — ChapterText

- [ ] 6.1 **RED** — Create `src/features/coffee-story/components/ChapterText.test.tsx`; test: active chapter text rendered with opacity accessible (not `opacity: 0`); test: inactive chapter unmounted or `opacity: 0`; test: a Framer Motion `motion.*` element wraps content. *(spec: "Text fades in on activation", "Inactive text not visible")*
- [ ] 6.2 **GREEN** — Create `src/features/coffee-story/components/ChapterText.tsx`; accept `chapter: Chapter`, `isActive: boolean`; wrap in `<AnimatePresence>` + `<motion.div>` with `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}`; no inline narrative strings.
- [ ] 6.3 **VERIFY** — ChapterText tests green.

### 6.2 — Scrollytelling Container

- [ ] 6.4 **RED** — Create `src/features/coffee-story/components/Scrollytelling.test.tsx`; test: renders 5 sentinel `div[data-chapter-id]` elements; test: `StickyVisualization` present in sticky column; test: 2-col layout wrapper present. *(integration smoke)*
- [ ] 6.5 **GREEN** — Create `src/features/coffee-story/components/Scrollytelling.tsx`; accept `chapters: Chapter[]`; 2-col CSS grid with sticky graphic column and scrolling text column; call `useActiveChapter(chapters, sentinelRefs)`; render `<StickyVisualization>`; render `<ChapterText isActive={ch.id === activeChapterId} />` for each chapter with `div[data-chapter-id]` sentinel.
- [ ] 6.6 **VERIFY** — Scrollytelling tests green.

### 6.3 — App Wiring

- [ ] 6.7 **RED** — Create `src/app/App.test.tsx`; mock `useCoffeeData`; test: renders loading indicator when `loading: true`; test: renders error message when `error` is non-null; test: renders `<Scrollytelling>` when data available. *(spec: "Load and error states")*
- [ ] 6.8 **GREEN** — Implement `src/app/App.tsx`; call `useCoffeeData()`; branch on `loading`, `error`, `data`; pass `chapters` from `content/chapters.ts` and fetched data as props to `<Scrollytelling>`.
- [ ] 6.9 **VERIFY** — App tests green.

### 6.4 — Shared Utilities

- [ ] 6.10 **RED** — Create `src/shared/formatters.test.ts`; test: `formatTonnes(828904) === '828,904 t'`; `formatYear(2007) === '2007'`.
- [ ] 6.11 **GREEN** — Create `src/shared/formatters.ts`; export `formatTonnes(n: number): string`, `formatYear(n: number): string`.
- [ ] 6.12 **VERIFY** — Formatter tests green.

### 6.5 — Static Analysis Guards

- [ ] 6.13 **GUARD** — Create `src/test/staticGuards.test.ts`; use `execSync('rg "d3\\.select" src/features/coffee-story/visualizations/')` and assert it exits non-zero (no matches). *(spec: "No d3.select on SVG elements")*
- [ ] 6.14 **GUARD** — In same file, grep for raw field names (`producci_n_t`, `a_o`, `rea_sembrada_ha`, `c_d_dep`) outside `src/data/`; assert no matches. *(spec: "Components never receive raw API field names")*

### 6.6 — Responsive Polish

- [ ] 6.15 Add CSS media query to `Scrollytelling` for viewport < 768 px: stack columns vertically, sticky graphic moves to top.
- [ ] 6.16 Ensure all department `<path>` elements have `aria-label` with department name + production; `'La Niña'` annotation has `role="img"` or accessible text.

### 6.7 — Open Question Resolution

- [ ] 6.17 Confirm `uejq-wxrr` DANE field is `c_digo_dane_departamento` (not `c_d_dep`); update `NEW_EVA_CONFIG.fieldMap` if different.
- [ ] 6.18 Confirm simplified TopoJSON URL for Colombian departments; update `colombiaGeoLoader.ts` if raw GeoJSON URL was used as placeholder.

---

## Phase 7: Full Suite Verification Gate (All PRs)

- [ ] 7.1 `npx vitest run --coverage` — all tests green; coverage ≥ 80%.
- [ ] 7.2 `npx tsc --noEmit` — zero errors.
- [ ] 7.3 `npx eslint .` — zero errors.
- [ ] 7.4 `npx vite build` — build succeeds with no TS errors.
- [ ] 7.5 Manual smoke: `npx vite preview` — scroll all 5 chapters; verify `activeChapterId` updates in React DevTools; verify choropleth fill tweens visibly between chapters; verify 2021 La Niña annotation present; verify 2007 source-switch label visible; verify Huila stroke distinct.

---

## Spec Coverage Traceability (25 Scenarios)

| Spec Scenario | Covering Tasks |
|---|---|
| Chapter enters viewport threshold | 3b.3, 3b.4 |
| Scrolling backward updates active chapter | 3b.3, 3b.4 |
| Direct state write is prohibited | 3b.1, 3b.2 |
| Chapter content is typed data | 2.1, 2.2, 3c.1 |
| Missing chapter id is a type error | 2.1 |
| Text fades in on chapter activation | 6.1, 6.2 |
| Inactive chapter text is not visible | 6.1, 6.2 |
| Component mount count stays at one | 5.7, 5.8 |
| D3 interpolation state preserved across chapters | 5.7, 5.8 |
| Choropleth tweens fill color between chapters | 4.3, 4.4 |
| D3 interpolator is called, not bypassed | 4.3, 4.4 |
| No d3.select on SVG elements | 5.1, 5.4, 6.13 |
| D3 scale output drives React SVG attributes | 5.1, 5.4 |
| Protagonist department has distinct stroke | 5.4, 5.5, 3c.2 |
| Non-protagonist departments render without highlight | 5.4, 5.5 |
| producci_n_t maps to domain.production as number | 3.8, 3.12 |
| a_o maps to domain.year as number | 3.8, 3.12 |
| rea_sembrada_ha maps to domain.areaSown as number | 3.9, 3.12 |
| Old dataset filter constant is CAFE | 3.6, 3.7 |
| New dataset filter constant is Café | 3.6, 3.7 |
| Wrong coffee filter yields error, not silent empty | 3.10, 3.12 |
| Non-empty assertion fires at module load | 3.6, 3.7 |
| Second call returns cached result | 3.1, 3.2 |
| Cache is keyed per dataset | 3.1, 3.2 |
| Huila joins correctly by DANE code 41 | 3.8, 3.19, 3.20 |
| Name mismatch does not break the join | 3.19, 3.20 |
| FAO data includes 1999 trough | 3.16, 3.17 |
| FAO series starts at 1990 | 3.16, 3.17 |
| Loading state is true before fetch resolves | 3.22, 3.23 |
| Error state is set on network failure | 3.22, 3.23 |
| Components never receive raw API field names | 3.22, 6.14 |
| 2007 EVA peak production is ~828,904 t | 3.14, 3.15 |
| 2012 roya trough production is ~626,798 t | 3.14, 3.15 |
| 2021 La Niña dip is annotated | 3c.1, 3c.2, 5.1 |
| 2007 source switch is labeled in the UI | 3c.2, 5.1, 5.2 |
