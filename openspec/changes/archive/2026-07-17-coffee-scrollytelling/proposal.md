# Proposal: Coffee Scrollytelling — Evolution of Colombian Coffee Production

## Intent

Build a "Snow Fall"-style scroll-driven data-journalism piece for a Frontend Senior portfolio, aimed at technical recruiters and digital agencies. It must feel professional and carry a clear narrative arc driven by REAL data. Data exploration (validated against live APIs) proved the original single-source premise false: department-level Colombian government data exists only from 2007, so the 1990s auge and 2000 collapse have no departmental source. This proposal locks a composite two-layer data strategy so the full historical arc can still be told honestly.

## Scope

### In Scope
- Scroll-driven narrative: `activeChapterId` derived by IntersectionObserver (sole writer), held in Zustand.
- Sticky graphic: visualization mounted ONCE, never unmounted between chapters (preserves D3 interpolation state); chapter text scrolls beside it.
- Composite data (two layers): FAO/OWiD national CSV (1990–2006) for ch.1–2 line chart; EVA Socrata departmental (2007–2024) for ch.3–5 animated choropleth. The 2007 source switch is an intentional narrative beat.
- 5 chapters (see Approach), each backed by its declared source.
- ≥1 INTERPOLATED D3 viz that tweens between chapters; choropleth highlights protagonist departments (Huila vs eje cafetero).
- Narrative as typed data (`content/chapters.ts`), decoupled from components.
- Hexagonal data isolation: `data/` adapters map raw string responses → numeric domain models; fetch-once + in-memory cache; load/error states; responsive-ish layout.

### Out of Scope
- Backend, auth, AI, i18n.
- Full 32-department parity (only protagonist departments highlighted).
- Pre-2007 departmental granularity (no departmental data exists — national only).
- d3.select / d3.transition DOM manipulation (React owns DOM; D3 = math only).

## Capabilities

### New Capabilities
- `scroll-narrative`: IntersectionObserver → Zustand `activeChapterId`, typed chapter content, smooth text transitions.
- `sticky-visualization`: single-mount pinned graphic; React-declarative SVG with D3-computed scales/generators/interpolators; cross-chapter tweening.
- `coffee-data`: hexagonal `data/` layer (socrata/geo/fao adapters), string→number mapping, DANE-code join, fetch-once cache, load/error states.

### Modified Capabilities
- None (greenfield).

## Approach

D3↔React hybrid: React renders DOM/SVG declaratively; D3 supplies only math (scales, generators, interpolators). Domain stays pure TS; only `data/` knows Socrata/FAO. Narrative is typed data. Chapters and their sources:

| Ch | Beat | Source | Viz |
|----|------|--------|-----|
| 1 | 1990s auge (~1.1M t) | FAO national | line |
| 2 | 2000 colapso (1999 trough ~547k, −37%) | FAO national | line |
| 3 | ~2010 roya (2007 peak 828,904 t → 2012 626,798 t, ~24% drop) | EVA departmental | choropleth |
| 4 | cafés especiales / recovery | EVA departmental | choropleth |
| 5 | cierre comparativo Huila vs eje cafetero | EVA departmental | choropleth |

Business rules: all numbers come from real data; break years validated against source; 2021 La Niña dip (~560k) annotated so it does not confuse the recovery narrative; EVA↔GeoJSON join via DANE code (`c_d_dep`/`c_digo_dane_departamento` ↔ `DPTO_CCDGO`), never text.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/features/coffee-story/{store,hooks}` | New | Zustand + IntersectionObserver |
| `src/features/coffee-story/{components,visualizations,content}` | New | Sticky graphic, chapters, typed narrative |
| `src/data/{socrata,geo,fao}` | New | Adapters, cache, string→number mapping, DANE join |
| `src/domain` | New | Pure coffee models |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Two EVA schemas (2pnw-mmge 2007–18 vs uejq-wxrr 2019–24) | High | Normalize both in data layer to one domain model |
| `cultivo` value differs (`'CAFE'` vs `'Café'`) → 0 rows silently | High | Per-dataset filter constants; assert non-empty |
| Numeric fields are STRINGS | High | parseFloat/Number in adapter only |
| FAO vs EVA unit reconciliation | Med | Reconcile in domain; label the 2007 source switch |
| GeoJSON name conventions (3 variants) | Med | Join by DANE code; NFD-normalize as fallback |
| No pre-2007 department data | High (known) | Ch.1–2 national line only, by design |

## Rollback Plan

Greenfield feature. Revert by deleting `src/features/coffee-story`, `src/data`, `src/domain` additions; no shared state or backend to unwind.

## Dependencies

- Live: `datos.gov.co/resource/2pnw-mmge.json` + `uejq-wxrr.json`; OWiD FAO CSV; caticoa3/colombia_mapa GeoJSON (prefer simplified TopoJSON).
- Libs: React, TS, Vite, D3, Zustand, Framer Motion, topojson-client; Vitest + RTL (strict TDD).

## Success Criteria

- [ ] Scroll updates `activeChapterId` via IntersectionObserver only; text transitions smoothly.
- [ ] Sticky graphic mounts once and tweens between chapters (≥1 interpolated D3 viz).
- [ ] Ch.1–2 render FAO national line; ch.3–5 render EVA choropleth highlighting Huila vs eje cafetero.
- [ ] All displayed numbers trace to real data; break years validated; 2021 La Niña annotated.
- [ ] Fetch-once cache + load/error states; components never see raw API fields.
