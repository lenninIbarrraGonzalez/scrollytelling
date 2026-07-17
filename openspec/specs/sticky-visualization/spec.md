# sticky-visualization Specification

## Purpose

A single-mount pinned graphic that persists across all five chapters. D3 computes scales, generators, and interpolators; React owns and renders the SVG. At least one D3 visualization INTERPOLATES (tweens) between chapter datasets instead of snapping.

## Requirements

### Requirement: Single Mount — Never Unmounts Between Chapters

The visualization component MUST mount exactly once during the scrollytelling session. It MUST NOT unmount and remount when `activeChapterId` changes.

#### Scenario: Component mount count stays at one across chapter transitions

- GIVEN the scrollytelling page is loaded
- WHEN the user scrolls through all five chapters
- THEN the visualization root component's mount lifecycle fires exactly once (verifiable via a spy on `useEffect` with empty deps or a ref counter)

#### Scenario: D3 interpolation state is preserved across chapters

- GIVEN the visualization has completed a tween from chapter-3 to chapter-4 data
- WHEN `activeChapterId` changes to `'chapter-5'`
- THEN the tween starts from the chapter-4 final state, not from initial/zero state

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

The system MUST render all SVG elements declaratively via React. D3 MUST NOT use `d3.select` / `d3.transition` to mutate DOM nodes directly. D3 MAY be used only for scales, path generators, interpolators, and projections — outputs fed as props or state into React elements.

#### Scenario: No d3.select on SVG elements

- GIVEN the sticky visualization is rendered
- WHEN a static analysis or test grep scans the visualization source files
- THEN no call to `d3.select` targeting SVG DOM nodes is present in `src/features/coffee-story/visualizations/`

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
