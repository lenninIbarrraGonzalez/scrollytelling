# Code Review Rules — Coffee Scrollytelling

Coding standards for this project. The pre-commit code review enforces these.

## Architecture (non-negotiable)

- **Hexagonal boundaries.** `domain/` is pure TypeScript with zero imports from
  React, D3, or any data source. `data/` is the only layer that knows about Socrata
  or FAO; it maps raw responses to domain models. Components never import from `data/`
  raw shapes — they consume domain models only.
- **D3 ↔ React is HYBRID.** React owns the DOM and renders SVG declaratively. D3 is
  used ONLY for math: scales, generators (`d3.line`, `d3.geoPath`), interpolators.
  Never call `d3.select`, `.append`, `.attr`, or `.transition()` to mutate the DOM.
- **State is single-writer.** Zustand holds `activeChapterId`. The IntersectionObserver
  hook is the ONLY writer. Visualizations subscribe read-only.
- **Narrative is data.** Chapter content lives in typed config, not in JSX.
- **Feature-first structure.** Code lives under `src/features/coffee-story/`,
  `src/data/`, `src/domain/`, `src/shared/`.

## TypeScript

- Use `const`/`let`, never `var`.
- No `any`. Prefer explicit domain types. Use `unknown` at boundaries and narrow.
- All external API numeric fields arrive as STRINGS — coerce with `Number`/`parseFloat`
  ONLY inside `data/` adapters, never in components.
- Prefer named exports.

## React

- Functional components with hooks only.
- Container/presentational split: visualizations are presentational (props in, SVG out),
  they do not fetch, subscribe to the store, or know about scroll.
- The sticky visualization mounts once and must not remount between chapters.

## Testing (Strict TDD)

- Test-first: write a failing test before implementation. No production code without a
  failing test that motivates it.
- Runner: Vitest + React Testing Library.
- Test behavior, not implementation details. Domain and data-adapter logic must be
  unit-tested (string→number mapping, DANE-code join, unit reconciliation).

## Data correctness

- All displayed numbers must trace to real data. Do not hardcode narrative figures that
  are not derived from the source.
- Socrata coffee filter differs per dataset: `cultivo='CAFE'` (2pnw-mmge) vs `'Café'`
  (uejq-wxrr). Assert non-empty results — a wrong filter returns 0 rows silently.
- Join EVA to GeoJSON by DANE department code, never by department name text.

## Style

- Conventional Commits for messages. No AI attribution in commits or PRs.
- Keep functions small and single-purpose. Comments explain WHY, not WHAT.
