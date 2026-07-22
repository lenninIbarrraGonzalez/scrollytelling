# Colombian Coffee: A Scrollytelling Story

An editorial data visualization built in the style of NYT Snow Fall. Eight chapters trace the Colombian coffee industry from its 1990s peak through the rust-disease collapse and into the modern specialty-coffee recovery.

Live demo · [Portfolio piece — Frontend Senior]

---

## What it covers

| Chapter | Visualization | Story beat |
|---------|---------------|------------|
| 1–2 | Line chart | FAO national production 1990–2006: boom and collapse |
| 3–5 | Choropleth map | EVA departmental data: rust epidemic, Huila's rise, new equilibrium |
| 6 | Scatter bubble | Area vs. yield vs. production — efficiency ≠ volume |
| 7 | Slope chart | Regional power shift 2007 → 2024 |
| 8 | Lollipop chart | Silent yield revolution driven by the Castillo variety |

Data sources: **FAOSTAT** (1990–2006) and **EVA / MADR** (2007–2024, datasets `2pnw-mmge` and `uejq-wxrr`).

---

## Tech stack

| Layer | Choice |
|-------|--------|
| UI framework | React 19 |
| Language | TypeScript 7 |
| Build | Vite |
| Data viz | D3 v7 (math only — React owns the DOM) |
| Animation | Framer Motion |
| State | Zustand |
| Geo | TopoJSON client |
| Tests | Vitest + Testing Library |

### D3 ↔ React hybrid contract

React renders every SVG node as JSX. D3 is restricted to pure math: scales, ticks, projections, bisectors, and formatters. No `d3.select`, no imperative DOM mutations.

### Architecture

Hexagonal / Screaming Architecture with a strict feature-slice layout:

```
src/
├── app/                  # Entry point and root component
├── domain/               # Core types (Chapter, CoffeeDatum…)
├── data/
│   ├── fao/              # FAOSTAT adapter
│   ├── socrata/          # EVA/Socrata client + adapter
│   └── geo/              # Colombia GeoJSON loader
├── features/
│   └── coffee-story/
│       ├── components/   # Scrollytelling, ChapterText
│       ├── content/      # chapters.ts — all narrative text
│       ├── hooks/        # useActiveChapter
│       ├── selectors/    # coffeeSelectors
│       ├── store/        # scrollStore (Zustand)
│       └── visualizations/
│           ├── LineChart
│           ├── ChoroplethMap + ColorLegend
│           ├── ScatterBubbleChart
│           ├── SlopeChart
│           ├── LollipopChart
│           └── StickyVisualization
└── shared/               # Formatters, utilities
```

---

## Getting started

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm run check      # typecheck + full test suite
npm run build      # production build
```

### Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | TypeScript compile → Vite bundle |
| `npm run typecheck` | `tsc -b` only |
| `npm run test` | Vitest (single run) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | V8 coverage report |
| `npm run check` | Typecheck + tests (CI gate) |

---

## Development methodology

Built under **Spec-Driven Development (SDD)** with strict TDD:

- Every capability has a delta spec, design document, and task checklist before a line of code is written.
- Workflow: RED (failing test) → GREEN (minimal implementation) → `npm run check` (gate).
- No feature merges without passing types + tests.

---

## Palette

| Name | Hex |
|------|-----|
| Bone | `#e8dcc8` |
| Merlot | `#7c2d3e` |
| Tobacco | `#6b4c11` |
| Olive | `#4a5c2f` |
| Midnight Blue | `#1a2744` |

---

## License

MIT © Lenin Ibarra
