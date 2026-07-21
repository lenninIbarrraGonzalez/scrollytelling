# Delta Spec: three-new-sections

Covers three modified capabilities: `scroll-narrative`, `sticky-visualization`, `coffee-data`.

---

## Domain: scroll-narrative

## MODIFIED Requirements

### Requirement: Typed Chapter Content

The system MUST define all narrative content in a typed `content/chapters.ts` file. The `chapters` array MUST contain exactly eight entries (indexes 0–7). The `Chapter` interface MUST include optional fields `rankingYears?: [number, number]` and `seriesMode?: 'production' | 'weighted-yield'`. The `viz` field MUST be typed as `'line' | 'choropleth' | 'scatter' | 'slope'`. Components MUST NOT contain inline narrative strings.
(Previously: chapters array had five entries; viz union was `'line' | 'choropleth'`; Chapter had no `rankingYears` or `seriesMode` fields)

#### Scenario: Chapter content is typed data

- GIVEN `chapters.ts` exports an array of `Chapter` objects
- WHEN a component reads `chapters[2].body`
- THEN TypeScript enforces the shape at compile time (no `any`, no string indexing)

#### Scenario: Missing chapter id is a type error

- GIVEN a `Chapter` object is constructed without an `id` field
- WHEN TypeScript compiles the file
- THEN compilation fails with a type error

#### Scenario: Chapters array has length 8

- GIVEN `chapters.ts` is imported
- WHEN `chapters.length` is evaluated
- THEN the result is `8`

#### Scenario: New chapters have correct indexes

- GIVEN `chapters.ts` is imported
- WHEN `chapters[5].index`, `chapters[6].index`, and `chapters[7].index` are evaluated
- THEN the results are `5`, `6`, and `7` respectively

#### Scenario: All chapters have valid viz values

- GIVEN `chapters.ts` is imported
- WHEN every chapter's `viz` field is collected into an array
- THEN every value is one of `'line'`, `'choropleth'`, `'scatter'`, `'slope'`

#### Scenario: Chapter 7 declares rankingYears as 2-tuple

- GIVEN `chapters.ts` is imported
- WHEN `chapters[6].rankingYears` is evaluated
- THEN it is an array of exactly two numbers (e.g., `[2007, 2024]`)

#### Scenario: Chapter 8 has seriesMode weighted-yield

- GIVEN `chapters.ts` is imported
- WHEN `chapters[7].seriesMode` is evaluated
- THEN the value is `'weighted-yield'`

#### Scenario: All new chapters cite source EVA

- GIVEN `chapters.ts` is imported
- WHEN `chapters[5].source`, `chapters[6].source`, and `chapters[7].source` are evaluated
- THEN each value is `'EVA'`

---

## Domain: sticky-visualization

## MODIFIED Requirements

### Requirement: Single Mount — Never Unmounts Between Chapters

The visualization component MUST mount exactly once during the scrollytelling session. It MUST NOT unmount and remount when `activeChapterId` changes.

#### Scenario: Component mount count stays at one across chapter transitions

- GIVEN the scrollytelling page is loaded
- WHEN the user scrolls through all eight chapters
- THEN the visualization root component's mount lifecycle fires exactly once (verifiable via a spy on `useEffect` with empty deps or a ref counter)

#### Scenario: D3 interpolation state is preserved across chapters

- GIVEN the visualization has completed a tween from chapter-3 to chapter-4 data
- WHEN `activeChapterId` changes to `'chapter-5'`
- THEN the tween starts from the chapter-4 final state, not from initial/zero state

### Requirement: Explicit Per-Viz Branch Rendering

The system MUST render the component that matches `activeViz` via explicit conditional branches. There MUST NOT be a silent fallback to `ChoroplethMap` for unknown or unrecognized `activeViz` values. When `activeViz` is `'scatter'`, `StickyVisualization` MUST render `ScatterBubbleChart`. When `activeViz` is `'slope'`, it MUST render `SlopeChart`. When `activeViz` is `'line'` and `chapter.seriesMode === 'weighted-yield'`, it MUST render `LineChart` with a `yAxisLabel` prop. Existing `'line'` and `'choropleth'` branch behavior MUST remain unchanged.
(Previously: StickyVisualization used a binary ternary `activeViz === 'line' ? LineChart : ChoroplethMap`, silently rendering ChoroplethMap for any unknown viz value)

#### Scenario: Renders ScatterBubbleChart when activeViz is scatter

- GIVEN `activeViz` is `'scatter'`
- WHEN `StickyVisualization` renders
- THEN `ScatterBubbleChart` is present in the output and `ChoroplethMap` is not

#### Scenario: Renders SlopeChart when activeViz is slope

- GIVEN `activeViz` is `'slope'`
- WHEN `StickyVisualization` renders
- THEN `SlopeChart` is present in the output and `ChoroplethMap` is not

#### Scenario: Renders LineChart when activeViz is line

- GIVEN `activeViz` is `'line'` and `seriesMode` is not `'weighted-yield'`
- WHEN `StickyVisualization` renders
- THEN `LineChart` is present in the output

#### Scenario: Renders ChoroplethMap when activeViz is choropleth

- GIVEN `activeViz` is `'choropleth'`
- WHEN `StickyVisualization` renders
- THEN `ChoroplethMap` is present in the output and `LineChart` is not

#### Scenario: No silent fallback to ChoroplethMap for unexpected viz value

- GIVEN `activeViz` is an unrecognized string (e.g., `'unknown'`)
- WHEN `StickyVisualization` renders
- THEN `ChoroplethMap` is NOT rendered; the output is empty or renders a null branch

#### Scenario: Renders LineChart with yAxisLabel when seriesMode is weighted-yield

- GIVEN `activeViz` is `'line'` and `chapter.seriesMode === 'weighted-yield'`
- WHEN `StickyVisualization` renders
- THEN `LineChart` receives a non-empty `yAxisLabel` prop (e.g., `'t/ha'`)

### Requirement: D3 Interpolation Between Chapter Datasets

The system MUST interpolate (tween) at least one visual encoding between consecutive chapter datasets. Snapping (instant data swap without animation) is NOT acceptable for the choropleth or line chart transitions.

#### Scenario: Choropleth tweens fill color between chapters

- GIVEN chapter-3 dataset shows Huila production value 200,000 t
- WHEN `activeChapterId` changes to `'chapter-4'` where Huila production is 300,000 t
- THEN the fill color of the Huila department path transitions through intermediate color values over a measurable duration (> 0 ms), not instantly

#### Scenario: D3 interpolator is called, not bypassed

- GIVEN a unit test mocks `d3.interpolate` (or `d3.interpolateRgb`)
- WHEN a chapter transition triggers the visualization update
- THEN the mock interpolator is called with the source and target values

### Requirement: React Owns SVG — D3 Computes Math Only

The system MUST render all SVG elements declaratively via React. D3 MUST NOT use `d3.select` / `d3.transition` to mutate DOM nodes directly. D3 MAY be used only for scales, path generators, interpolators, and projections. This constraint applies to all new visualization components (`ScatterBubbleChart`, `SlopeChart`) in addition to existing ones.

#### Scenario: No d3.select on SVG elements in any visualization file

- GIVEN all files under `src/features/coffee-story/visualizations/`
- WHEN a static analysis or test grep scans them
- THEN no call to `d3.select` targeting SVG DOM nodes is present in any file, including new visualization files

#### Scenario: D3 scale output drives React SVG attributes

- GIVEN a color scale maps production values to hex strings
- WHEN the component renders a `<path>` for a department
- THEN the `fill` prop is set to the value returned by the D3 color scale, passed as a React prop (not set via `selection.attr`)

### Requirement: Choropleth Highlights Protagonist Departments

The system MUST visually distinguish the protagonist departments (Huila and the eje cafetero: Caldas, Risaralda, Quindío, Antioquia, Tolima) from non-protagonist departments in choropleth chapters (ch.3–5).

#### Scenario: Protagonist department has distinct stroke or label in active chapter

- GIVEN `activeChapterId` is `'chapter-5'`
- WHEN the choropleth renders
- THEN the SVG path for Huila (`DPTO_CCDGO === '41'`) has a visually distinct stroke width or class compared to non-protagonist departments

#### Scenario: Non-protagonist departments render without highlight

- GIVEN `activeChapterId` is `'chapter-3'`
- WHEN the choropleth renders
- THEN a department with no protagonist role (e.g., Vaupés) has the default (non-highlighted) visual style

---

## Domain: coffee-data

## ADDED Requirements

### Requirement: Pure Data Selectors for New Visualizations

The system MUST provide three pure selector functions with no side effects and no I/O: `buildScatterData`, `buildSlopeData`, and `buildWeightedYieldSeries`. The constant `SLOPE_TOP_N` MUST be exported with value `10`. All selectors MUST return an empty array when given an empty input without throwing.

#### Scenario: buildScatterData excludes departments with areaHarvested 0

- GIVEN `departmentSeries` contains a row with `areaHarvested === 0` for a given year
- WHEN `buildScatterData(series, year)` is called
- THEN that department's entry is absent from the returned array

#### Scenario: buildScatterData excludes departments with production 0

- GIVEN `departmentSeries` contains a row with `production === 0` for a given year
- WHEN `buildScatterData(series, year)` is called
- THEN that department's entry is absent from the returned array

#### Scenario: buildScatterData returns correct fields

- GIVEN `departmentSeries` contains a valid row with production > 0, areaHarvested > 0, and yield > 0
- WHEN `buildScatterData(series, year)` is called
- THEN the returned `ScatterDatum` contains `production`, `areaHarvested`, `yield`, `daneCode`, and `department` fields with correct values

#### Scenario: buildScatterData returns empty array on empty input

- GIVEN an empty `departmentSeries` array
- WHEN `buildScatterData([], anyYear)` is called
- THEN the result is `[]` and no error is thrown

#### Scenario: buildWeightedYieldSeries computes weighted national yield

- GIVEN `departmentSeries` has three departments for year 2010 with productions [100, 200, 50] and areas [10, 20, 5] (all > 0)
- WHEN `buildWeightedYieldSeries(series)` is called
- THEN the year-2010 entry has `yield === (100+200+50) / (10+20+5)` (i.e., `10.0`), NOT the arithmetic mean of individual yields

#### Scenario: buildWeightedYieldSeries excludes rows with areaHarvested 0

- GIVEN `departmentSeries` has a row for year 2015 with `areaHarvested === 0`
- WHEN `buildWeightedYieldSeries(series)` is called
- THEN that row is excluded from both the numerator (production sum) and denominator (area sum) for year 2015

#### Scenario: buildWeightedYieldSeries returns empty array on empty input

- GIVEN an empty `departmentSeries` array
- WHEN `buildWeightedYieldSeries([])` is called
- THEN the result is `[]` and no error is thrown

#### Scenario: buildSlopeData returns top-N by yearB production union protagonists

- GIVEN `departmentSeries` has 33 departments with distinct production values for yearA and yearB
- WHEN `buildSlopeData(series, yearA, yearB, 10)` is called
- THEN the result contains the top-10 departments by yearB production plus any protagonist DANE codes not already in the top-10, with no duplicates

#### Scenario: buildSlopeData returns 1-indexed ranks by production descending

- GIVEN `departmentSeries` has departments with known production ordering for both years
- WHEN `buildSlopeData(series, yearA, yearB, topN)` is called
- THEN each `SlopeDatum` has `rankA` and `rankB` as 1-based integers where rank 1 is the highest production department for that year

#### Scenario: buildSlopeData returns empty array on empty input

- GIVEN an empty `departmentSeries` array
- WHEN `buildSlopeData([], yearA, yearB, 10)` is called
- THEN the result is `[]` and no error is thrown

#### Scenario: SLOPE_TOP_N export value is 10

- GIVEN the `coffeeSelectors` module is imported
- WHEN `SLOPE_TOP_N` is read
- THEN its value is exactly `10`
