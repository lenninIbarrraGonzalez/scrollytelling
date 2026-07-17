# Design: Coffee Scrollytelling — Evolution of Colombian Coffee Production

## Technical Approach

D3↔React hybrid, hexagonal, single-writer state. React renders SVG declaratively; D3 supplies only math (`scaleLinear`, `line`, `interpolate`). `domain/` is pure TS; `data/` is the sole boundary that knows Socrata/FAO/GeoJSON and coerces raw strings to numbers. A sticky viz mounts once; IntersectionObserver is the only writer of Zustand `activeChapterId`. Composite data: FAO national CSV (1990–2006, ch.1–2 line) + EVA departmental (2007–2024, ch.3–5 choropleth), joined to GeoJSON by DANE code.

## Architecture Decisions

### Decision: Data interpolation, not DOM transitions
**Choice**: `useDataInterpolation` tweens the DATA model (per-year/per-department values) with `d3.interpolate` driven by a Framer Motion `useMotionValue`/rAF; React re-renders SVG from interpolated state.
**Alternatives**: `d3.transition()` on selections (rejected — violates locked D3-math-only boundary, fights React reconciliation).
**Rationale**: Preserves single source of truth in React; sticky node keeps interpolation state across chapters.

### Decision: Normalize two EVA schemas in the adapter
**Choice**: `socrataAdapter` maps both `2pnw-mmge` (2007–18) and `uejq-wxrr` (2019–24) into one `DepartmentProduction`. Per-dataset config carries endpoint, `cultivo` filter value (`'CAFE'` vs `'Café'`), and field map (`a_o`/`producci_n_t`/`c_d_dep` vs new-schema equivalents).
**Alternatives**: Two domain models (rejected — leaks source schema upward).
**Rationale**: Components never see raw fields; year gap is invisible above the adapter.

### Decision: Join by DANE code
**Choice**: EVA rows carry a 2-digit DANE string (`c_d_dep`/`c_digo_dane_departamento`) matched to GeoJSON `DPTO_CCDGO`. Text names never used for joins.
**Alternatives**: Name join with NFD-normalize (kept ONLY as fallback for missing codes).
**Rationale**: Three name conventions (`QUINDIO`/`Quindío`/`QUINDÍO`) make text joins unsafe.

## Interfaces / Contracts

**Domain (`src/domain`)** — pure, no deps:
- `YearDatum { year: number; production: number }` (tonnes).
- `DepartmentProduction { daneCode: string; department: string; year: number; production: number; areaHarvested?: number; yield?: number }`.
- `ChapterSource = 'FAO' | 'EVA'` (enum/union).
- `Chapter { id: string; index: number; source: ChapterSource; viz: 'line' | 'choropleth'; title: string; body: string; highlightDaneCodes?: string[]; annotations?: { year: number; label: string }[] }`.
- `NationalSeries = YearDatum[]`; `DepartmentSeries = DepartmentProduction[]`.

**Data (`src/data`)** — only layer touching APIs; all coercion here:
- `socrataClient`: SoQL query builder — `select(...)`, `where(...)`, `group(...)`, `order(...)`, `limit(n)` → URL; `fetchJson<T>(): Promise<RawRow[]>` (raw string rows).
- `socrataAdapter(rawRows, datasetConfig): DepartmentProduction[]` — `Number()` coercion, DANE code extraction, filter-value + field-map per config.
- `faoAdapter(csvText): NationalSeries` — CSV parse (d3-dsv), filter Colombia rows, `Number()` tonnes, restrict to declared year window.
- `colombiaGeoLoader(topojsonUrl): Promise<FeatureCollection>` — `topojson-client.feature()`, exposes `DPTO_CCDGO`.
- `cache`: `Map<string,Promise<T>>` keyed by URL/dataset; fetch-once (dedupes in-flight), returns cached promise; exposes load/error state.
- `datasetConfig` constants: `{ endpoint, cultivoFilter, fieldMap, yearRange }` for each EVA schema — asserts result non-empty (guards silent 0-row filter mismatch).

**State (`src/features/coffee-story/store`)**:
- Zustand `{ activeChapterId: string | null; setActiveChapter(id): void }`. `setActiveChapter` is the ONLY mutation; called ONLY by the observer hook.
- `useActiveChapter(chapters)`: registers one IntersectionObserver over chapter-text sentinels. Options: `rootMargin: '-45% 0px -45% 0px'`, `threshold: 0` — fires when a chapter crosses the viewport mid-band; on intersect, `setActiveChapter(id)`.
- Visualizations subscribe READ-ONLY via a selector (`useStore(s => s.activeChapterId)`); they never write.

**Visualization (`src/features/coffee-story/visualizations`)**:
- `useD3Scales(domainExtent, range)`: memoized `{ xScale, yScale, colorScale }` (`scaleLinear`/`scaleSequential`). Pure math, no DOM.
- `useDataInterpolation(fromData, toData, progress)`: `d3.interpolate` per matched key (year for line, daneCode for choropleth); returns interpolated dataset for the current `progress` (0→1) between the previous and active chapter.
- Choropleth maps `production → colorScale(value)`; protagonist departments (`chapter.highlightDaneCodes`, Huila vs eje cafetero) get stroke/opacity emphasis.
- `StickyVisualization`: mounted once; switches `<LineChart>` vs `<Choropleth>` by active chapter's `source`/`viz` WITHOUT unmounting the sticky wrapper (conditional child inside a persistent container preserves scroll/interpolation state).

## Data Flow

    IntersectionObserver ─(only writer)→ Zustand.activeChapterId
                                              │ (read-only selector)
    data/ (adapters+cache) ─domain models→ StickyVisualization ──→ useDataInterpolation → SVG
    content/chapters.ts (typed) ──→ ChapterText (Framer Motion) scrolls beside sticky graphic

## Component Composition

- `Scrollytelling` container: 2-col CSS grid; graphic column `position: sticky; top: 0`; text column scrolls.
- `ChapterText`: renders one `Chapter`; Framer Motion fade/slide on active change.
- `StickyVisualization`: persistent; reads `activeChapterId`, selects series/geo, delegates to `LineChart` or `Choropleth`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/App.tsx` | Create | Mounts `Scrollytelling` |
| `src/domain/coffee.ts` | Create | Pure types above |
| `src/data/socrata/{client,adapter,datasetConfig}.ts` | Create | SoQL builder, coercion, per-schema config |
| `src/data/fao/faoAdapter.ts` | Create | CSV parse → NationalSeries |
| `src/data/geo/colombiaGeoLoader.ts` | Create | topojson-client loader |
| `src/data/cache.ts` | Create | fetch-once in-memory cache |
| `src/features/coffee-story/store/scrollStore.ts` | Create | Zustand single source |
| `src/features/coffee-story/hooks/useActiveChapter.ts` | Create | IntersectionObserver writer |
| `src/features/coffee-story/visualizations/{useD3Scales,useDataInterpolation,LineChart,Choropleth,StickyVisualization}.tsx` | Create | D3-math + declarative SVG |
| `src/features/coffee-story/components/{Scrollytelling,ChapterText}.tsx` | Create | Layout + Framer text |
| `src/features/coffee-story/content/chapters.ts` | Create | Typed narrative (5 chapters) |
| `src/shared/` | Create | Formatters, test utils |

## Testing Strategy (strict TDD)

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `domain` types/reconciliation; `socrataAdapter` (string→number, field map, both schemas, DANE extraction); `faoAdapter` CSV; datasetConfig non-empty assertion; `cache` fetch-once/dedupe | Vitest, fixture raw rows/CSV; NO network |
| Unit | `scrollStore` mutation; `useD3Scales` outputs; `useDataInterpolation` midpoint math | Vitest; pure functions/`renderHook` |
| Unit | `useActiveChapter` | Vitest + mocked `IntersectionObserver` (global stub, manual `.trigger()`) |
| Component | `ChapterText`, `Scrollytelling`, `StickyVisualization` never-unmount, source switch | RTL; assert single mount + SVG path/`d`/`fill` output (D3 math verified via DOM attrs, no real browser) |

D3 math is tested through emitted SVG attributes; IntersectionObserver via a JS mock — both browser-free under jsdom.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary. Only HTTP GETs to public data APIs.

## Migration / Rollout

No migration required. Greenfield; revert by deleting `src/{features/coffee-story,data,domain}`.

## Open Questions

- [ ] Confirm `uejq-wxrr` DANE field is `c_digo_dane_departamento` (vs old `c_d_dep`) before locking `fieldMap`.
- [ ] Prefer simplified TopoJSON URL over 387 KB raw GeoJSON for choropleth perf (bundle vs fetch).
