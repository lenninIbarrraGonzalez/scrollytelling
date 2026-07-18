# Exploration: three-new-sections

## Change intent
Add three new scrollytelling sections (chapters 6, 7, 8) after the choropleth map, exploiting currently-unused EVA department data (`areaHarvested` in hectares, `yield` in t/ha — fetched but never visualized).

- Chapter 6 — Scatter/bubble "Volumen vs Eficiencia": X=areaHarvested, Y=yield, radius=production, one bubble per department for a given year.
- Chapter 7 — Slope/bump chart "El giro regional": department production ranking 2007 vs 2024, top-N + protagonists.
- Chapter 8 — Line chart "La revolución silenciosa": national weighted yield (Σproduction/Σarea) 2007–2024, reusing LineChart component.

---

## 1. Chapter interface and viz union (confirmed)

`src/domain/coffee.ts`:

```ts
interface Chapter {
  id: string
  index: number
  source: 'FAO' | 'EVA'
  viz: 'line' | 'choropleth'   // binary union — must extend to 'scatter' | 'slope'
  title: string
  body: string
  highlightDaneCodes?: string[]
  annotations?: { year: number; label: string }[]
  dataYear?: number             // single year — insufficient for Ch.7 slope
}
```

Extension needed:
- `viz` union → `'line' | 'choropleth' | 'scatter' | 'slope'`
- New optional field: `rankingYears?: [number, number]` for Ch.7 (two comparison years simultaneously)
- New optional field: `seriesMode?: 'production' | 'weighted-yield'` for Ch.8 data substitution

## 2. StickyVisualization switch logic (confirmed)

Current (binary ternary with silent else):
```tsx
activeViz === 'line' ? <LineChart ... /> : <ChoroplethMap ... />
```

The `else` arm always renders ChoroplethMap. This is a **structural risk**: unknown viz values silently render the map. Must be refactored to explicit branches before adding new viz types.

Props currently passed to viz children:
- `nationalSeries`, `departmentSeries`, `geoFeatures`, `colorScale`, `geoPath`, `width`, `height`
- `highlightDaneCodes?`, `annotations?`, `sourceLabel?`, `domainExtent?`

## 3. areaHarvested and yield coverage

The adapter always produces `Number(row[fieldMap.areaHarvested])`. When the Socrata column is absent or empty, `Number('')` → `0`. So:
- Domain type declares them `optional` (`?`) but runtime value is always `number`
- `0` means "absent" not "truly zero"

**Critical guard**: All selectors consuming `areaHarvested` MUST filter `> 0`:
- Weighted yield selector (Ch.8): filter before summing or divide-by-zero risk
- Scatter chart (Ch.6): exclude departments with `areaHarvested === 0`

## 4. Data aggregation helpers location

No `coffeeSelectors.ts` exists yet. Recommended location:
- `src/features/coffee-story/selectors/coffeeSelectors.ts`
- `src/features/coffee-story/selectors/coffeeSelectors.test.ts`

Convention: test colocated as `{module}.test.ts` (confirmed from existing tests).

## 5. Existing test patterns

- Vitest `describe` / `it` / `expect`; React Testing Library `render`, `cleanup`, `fireEvent`, `screen`
- `afterEach(() => cleanup())` in every component test
- Fixture data as small factory functions (`makeSeries()`, `makeFeature()`)
- Static source-text guards in `src/test/staticGuards.test.ts` (explicit file list — new viz files must be manually added)
- Real D3 scales injected as props (not mocked)
- `beforeAll`/`afterAll` for SVGPathElement.getTotalLength stubs

## 6. Hardcoded test assertions that break on RED

- `src/features/coffee-story/content/chapters.test.ts` line 16: `expect(chapters).toHaveLength(5)`
- `src/features/coffee-story/content/chapters.test.ts` line 31: `expect(indexes).toEqual([0, 1, 2, 3, 4])`
- `src/features/coffee-story/content/chapters.test.ts`: implicit viz allowlist assertions
- `src/test/staticGuards.test.ts`: explicit file list — new viz component files must be added

## 7. Affected files

| File | Why |
|------|-----|
| `src/domain/coffee.ts` | `viz` union extension; add `rankingYears?`, `seriesMode?` |
| `src/features/coffee-story/content/chapters.ts` | Add chapters 6, 7, 8 |
| `src/features/coffee-story/content/chapters.test.ts` | Update length, index range, viz allowlist |
| `src/features/coffee-story/visualizations/StickyVisualization.tsx` | Refactor binary ternary → explicit branches; new imports; new props |
| `src/features/coffee-story/visualizations/StickyVisualization.test.tsx` | New test cases for new viz types |
| `src/features/coffee-story/components/Scrollytelling.tsx` | New derived data props for each new viz chapter |
| `src/features/coffee-story/selectors/coffeeSelectors.ts` (NEW) | Weighted yield, scatter data, slope rankings |
| `src/features/coffee-story/selectors/coffeeSelectors.test.ts` (NEW) | Unit tests colocated |
| `src/features/coffee-story/visualizations/ScatterBubbleChart.tsx` (NEW) | Ch.6 |
| `src/features/coffee-story/visualizations/ScatterBubbleChart.test.tsx` (NEW) | |
| `src/features/coffee-story/visualizations/SlopeChart.tsx` (NEW) | Ch.7 |
| `src/features/coffee-story/visualizations/SlopeChart.test.tsx` (NEW) | |
| `src/test/staticGuards.test.ts` | Add guards for new viz component files |

## 8. Approach recommendation

- **Ch.6 scatter + Ch.7 slope**: two new viz union values (`'scatter'`, `'slope'`) with new components.
- **Ch.8 weighted yield**: reuse `viz: 'line'` with new `seriesMode: 'weighted-yield'` on Chapter + `yAxisLabel?: string` prop on LineChart (currently hardcoded "Toneladas"). Limits union to 2 new values instead of 3 and reuses the draw-on animation and tooltip.

## Risks

1. StickyVisualization binary ternary falls through to ChoroplethMap for unknown viz values — refactor first
2. `chapters.test.ts` hardcoded length/index assertions break on RED — update in same step
3. `areaHarvested = 0` means "absent" — all selectors must guard > 0
4. Ch.7 top-N: 33 departments saturates the slope chart — export a named `SLOPE_TOP_N = 10` constant
5. `staticGuards.test.ts` explicit file list — new files must be manually added
6. `useD3Scales` domain is production-tonnage only — new viz types need independent scale math
7. `Scrollytelling.tsx` (~190 lines today) risks bloating — consider `useCoffeeSelectors` hook
