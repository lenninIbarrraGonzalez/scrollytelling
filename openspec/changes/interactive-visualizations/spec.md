# Spec: Interactive, Crafted Visualizations
# Change: interactive-visualizations
# Capability Delta: sticky-visualization

---

## 1. Capability Under Spec: `sticky-visualization` (delta)

This spec describes WHAT must be true after the change is applied. It is purely
behavioral and structural — it does not prescribe implementation.

Pre-existing behaviors and the unmodified areas (scroll store, hooks,
`Scrollytelling.tsx`, `StickyVisualization.tsx`) are out of scope.

---

## 2. Feature Areas and Acceptance Scenarios

---

### 2.1 LineChart — Axes and Gridlines

**REQ-LC-01** The LineChart MUST render a visible Y-axis with at least 5 tick
marks labeled with human-readable production values.

**REQ-LC-02** The LineChart MUST render a visible X-axis with at least 5 tick
marks labeled with year values.

**REQ-LC-03** The Y-axis MUST carry a readable axis title (e.g., "Tonnes").

**REQ-LC-04** The X-axis MUST carry a readable axis title (e.g., "Year").

**REQ-LC-05** Horizontal gridlines (one per Y-tick) MUST be rendered inside the
plot area at reduced opacity to serve as reading guides.

**REQ-LC-06** Axes and gridlines MUST be implemented as pure JSX (`<line>`,
`<text>`) derived from `scale.ticks()` array — zero DOM mutation via `d3.select`,
`d3.axis`, `.append()`, or `.attr()`.

#### Scenarios

```
GIVEN the LineChart receives a non-empty data array
WHEN the component mounts
THEN the rendered SVG contains at least one element with role or text matching
     a Y-tick label (a numeric production value)
AND  the rendered SVG contains at least one element with text matching a year value
AND  the rendered SVG contains at least one <line> element styled as a gridline
     (horizontal, spanning the plot width, with opacity < 1 or a muted stroke color)
AND  there is a text element with the Y-axis title
AND  there is a text element with the X-axis title
```

```
GIVEN the LineChart is rendered in a test environment
WHEN the source file is scanned for forbidden D3 DOM APIs
THEN the strings "d3.select", ".append(", ".attr(", "d3.axis" are NOT present
```

---

### 2.2 LineChart — Gradient Area Fill

**REQ-LC-07** The area below the data line MUST be filled with a vertical
gradient (opaque at the line, transparent at the baseline).

**REQ-LC-08** The gradient MUST be defined as a `<linearGradient>` inside an
SVG `<defs>` block with a stable `id` that the fill area `<path>` references.

**REQ-LC-09** The area fill MUST be implemented as a `<path>` element (or
equivalent JSX `<motion.path>`) with a `fill` attribute referencing the
gradient — not via inline canvas or background-image.

#### Scenarios

```
GIVEN the LineChart receives a non-empty data array
WHEN the component mounts
THEN the rendered SVG contains a <defs> element
AND  inside <defs> there is a <linearGradient> element with a non-empty id
AND  there is a <path> element whose fill attribute references that gradient id
     (e.g., fill="url(#<id>)")
```

---

### 2.3 LineChart — Draw-on Animation (plays once, never replays)

**REQ-LC-10** When the LineChart is first activated (component mounts into an
active view or the `activeViz` prop/context resolves to `'line'`), the main data
line MUST animate from invisible to fully drawn via a `strokeDashoffset`
transition.

**REQ-LC-11** The animation MUST play exactly once per component lifetime. If the
user scrolls away and returns (the component is NOT unmounted and remounted), the
animation MUST NOT replay.

**REQ-LC-12** The animation MUST be driven by Framer Motion `motion.path` +
`animate` — NOT by `d3.transition`, `d3.select`, or raw `requestAnimationFrame`
that mutates the DOM.

**REQ-LC-13** The `<path>` element responsible for the animation MUST have
`strokeDasharray` and `strokeDashoffset` attributes (or Framer Motion equivalents)
present in the DOM after mount.

**REQ-LC-14** In test environments where `SVGPathElement.prototype.getTotalLength`
is not implemented, the component MUST NOT throw — it MUST gracefully fall back
(e.g., default length of 0 or 1).

#### Scenarios

```
GIVEN SVGPathElement.prototype.getTotalLength is mocked to return 500
AND   the LineChart mounts for the first time
WHEN  the mount animation cycle completes
THEN  the main <path> has strokeDashoffset animated toward 0
AND   the has-animated flag (internal state) is set to true
```

```
GIVEN the LineChart has already completed its draw-on animation (has-animated = true)
WHEN  any re-render occurs (e.g., prop update, parent re-render)
THEN  the strokeDashoffset does NOT reset to the path total length
AND   the animation does NOT replay
```

```
GIVEN SVGPathElement.prototype.getTotalLength is NOT defined in the environment
WHEN  the LineChart mounts
THEN  the component renders without throwing
AND   no unhandled error propagates to the test runner
```

---

### 2.4 LineChart — Mouse-Follow Tooltip

**REQ-LC-15** When the user moves the mouse over the chart SVG, a tooltip MUST
appear showing the nearest data year and its production value (formatted with
thousands separator or equivalent readable format).

**REQ-LC-16** The tooltip MUST include a vertical crosshair guide line spanning
the full plot height at the cursor's X position.

**REQ-LC-17** The tooltip MUST include a marker dot positioned on the data line
at the nearest year's coordinates.

**REQ-LC-18** The tooltip overlay MUST be rendered as an SVG `<g>` element inside
the chart's SVG — NOT as an absolutely positioned HTML `<div>`.

**REQ-LC-19** Nearest-year lookup MUST use `d3.bisector` for pure mathematical
bisection — zero DOM access.

**REQ-LC-20** Pointer coordinates MUST be derived from
`event.clientX - svg.getBoundingClientRect().left` — NOT from `event.offsetX`.

**REQ-LC-21** When the mouse leaves the SVG, the tooltip MUST disappear
(tooltip state returns to `null`).

#### Scenarios

```
GIVEN the LineChart is mounted with data containing years [2000, 2001, 2002]
WHEN  an onMouseMove event is fired on the SVG with clientX corresponding
      to the SVG's left edge + MARGIN.left + an x-coordinate near year 2001
THEN  a tooltip <g> element is rendered in the SVG
AND   it contains text matching "2001"
AND   it contains a vertical <line> element at the corresponding x position
AND   it contains a <circle> marker at the y coordinate for year 2001's production
```

```
GIVEN the tooltip is currently visible
WHEN  an onMouseLeave event fires on the SVG
THEN  the tooltip <g> element is removed from the DOM (or hidden)
```

```
GIVEN the LineChart source file
WHEN  scanned for tooltip implementation
THEN  "d3.bisector" is present
AND   "getBoundingClientRect" is present
AND   "offsetX" is NOT present as a coordinate source
```

---

### 2.5 ChoroplethMap — Hover Highlight

**REQ-CM-01** Each department `<path>` in the ChoroplethMap MUST have
`onMouseEnter` and `onMouseLeave` event handlers.

**REQ-CM-02** When the user hovers over a department path, that path MUST receive
a distinct stroke (e.g., thicker or differently colored) to visually identify it
as hovered.

**REQ-CM-03** Exactly one department may be in the hovered state at a time. When
a new path is entered, the previous path reverts to its default stroke.

**REQ-CM-04** Hover state MUST be managed via React `useState` — zero
`d3.select` / DOM attribute mutation.

#### Scenarios

```
GIVEN the ChoroplethMap is mounted with valid GeoJSON containing departments
      "Antioquia" and "Cundinamarca"
WHEN  an onMouseEnter event fires on the "Antioquia" path
THEN  the "Antioquia" path renders with a distinct strokeWidth or stroke color
      (different from its default)
AND   the "Cundinamarca" path renders with its default stroke
```

```
GIVEN "Antioquia" is currently hovered
WHEN  onMouseLeave fires on "Antioquia"
THEN  "Antioquia" reverts to its default stroke
AND   no department is in the hovered state
```

```
GIVEN "Antioquia" is currently hovered
WHEN  onMouseEnter fires on "Cundinamarca"
THEN  "Cundinamarca" receives the hover stroke
AND   "Antioquia" reverts to its default stroke
```

---

### 2.6 ChoroplethMap — Tooltip

**REQ-CM-05** When a department path is hovered, a tooltip MUST be visible
showing the department name and its production value in tonnes.

**REQ-CM-06** The tooltip MUST update as the user moves between departments.

**REQ-CM-07** When no department is hovered, the tooltip MUST not be rendered.

**REQ-CM-08** The tooltip MAY be rendered as either an SVG `<g>` overlay or an
HTML overlay; if HTML, it MUST use pointer-events: none to avoid interfering with
path events.

#### Scenarios

```
GIVEN the ChoroplethMap is mounted with data where "Valle del Cauca" has 12345 tonnes
WHEN  onMouseEnter fires on the "Valle del Cauca" path
THEN  a tooltip element is rendered
AND   it contains the text "Valle del Cauca"
AND   it contains a value corresponding to 12345 (or its formatted string)
```

```
GIVEN "Valle del Cauca" is hovered and its tooltip is visible
WHEN  onMouseLeave fires on "Valle del Cauca"
THEN  the tooltip element is no longer rendered (or not present in the DOM)
```

---

### 2.7 ChoroplethMap — Color Legend (`ColorLegend`)

**REQ-CM-09** A `ColorLegend` sub-component MUST exist as a separate file
(`ColorLegend.tsx`) and be rendered by `ChoroplethMap`.

**REQ-CM-10** `ColorLegend` MUST accept the color scale thresholds/domain and
the corresponding range of fill colors as props.

**REQ-CM-11** `ColorLegend` MUST render one swatch per color band: a colored
`<rect>` and a label (the threshold value or range).

**REQ-CM-12** `ColorLegend` MUST be a pure presentational component — no hooks,
no store access, no side effects beyond render.

**REQ-CM-13** `ColorLegend` MUST have its own test file (`ColorLegend.test.tsx`)
covering: renders correct number of swatches, swatch fill colors match props,
labels match thresholds.

#### Scenarios

```
GIVEN ColorLegend receives thresholds [0, 1000, 5000, 20000] and colors
      ["#f7fbff", "#6baed6", "#2171b5", "#084594"]
WHEN  the component renders
THEN  exactly 4 <rect> elements are rendered
AND   each <rect> has a fill attribute matching the corresponding color
AND   4 label elements are rendered, each containing a threshold value
```

```
GIVEN ColorLegend renders
WHEN  the source is inspected for hooks or store imports
THEN  "useState", "useEffect", "useStore", "useScrollStore" are NOT present
```

---

### 2.8 ChoroplethMap — Animated Color Transitions on Chapter/Year Change

**REQ-CM-14** When the active chapter or year changes and the choropleth
re-renders with new fill values, each department `<path>` MUST visually
transition its fill color over approximately 300 ms.

**REQ-CM-15** The transition MUST be implemented via CSS
`style={{ transition: 'fill 300ms ease' }}` on each `<path>` — NOT via
`d3.transition`, `d3.interpolate` with DOM mutation, or Framer Motion on the
fill property.

**REQ-CM-16** In test environments (JSDOM), the `style` prop containing
`transition: 'fill 300ms ease'` MUST be assertable on each `<path>` — the test
MUST NOT rely on observing the animation timing.

#### Scenarios

```
GIVEN the ChoroplethMap is mounted
WHEN  any department <path> is inspected
THEN  its style prop includes "transition" with value containing "fill" and "300ms"
```

```
GIVEN the active year changes from 2010 to 2015
WHEN  ChoroplethMap re-renders
THEN  each <path> still has style.transition containing "fill 300ms ease"
AND   the fill value has updated to reflect the new year's data
```

---

## 3. Non-Functional Requirements

### 3.1 D3/React Hybrid Contract (NON-NEGOTIABLE)

**REQ-NFR-01** React owns the DOM. ALL SVG elements MUST be produced as JSX
returned from React render functions. No D3 API (`d3.select`, `.append()`,
`.attr()`, `.transition()`, `.call()`, `d3.axis*`) may mutate, create, or read
DOM nodes.

**REQ-NFR-02** D3 is used exclusively for mathematical computation: `scale.ticks()`,
`d3.bisector`, `d3.line`, `d3.area`, `d3.geoPath`, `d3.scaleSequential`, etc.
Return values are plain JavaScript arrays or numbers consumed by JSX.

**REQ-NFR-03** The existing D3-guard tests (source-level scan for forbidden API
strings) MUST continue to pass without modification after this change is applied.

### 3.2 Performance

**REQ-NFR-04** Tooltip state updates MUST NOT trigger full component tree
re-renders beyond the LineChart itself. `useState` for tooltip is co-located in
`LineChart.tsx`.

**REQ-NFR-05** Hover state updates MUST NOT trigger re-renders in
`StickyVisualization.tsx` or any parent component. `useState` for hover is
co-located in `ChoroplethMap.tsx`.

### 3.3 Test Coverage

**REQ-NFR-06** All new behavior (axes, gradient, animation, tooltip, hover,
legend, color transition) MUST have at least one test scenario covering the happy
path.

**REQ-NFR-07** Animation tests MUST mock `SVGPathElement.prototype.getTotalLength`
before exercising draw-on behavior. The mock MUST be cleaned up after each test.

**REQ-NFR-08** CSS transition tests MUST assert the presence of the `style` prop
value, not the visual result or timing.

**REQ-NFR-09** All existing tests MUST remain green after this change.

---

## 4. Out-of-Scope Callouts

The following are explicitly NOT required by this spec:

- **Scroll-progress animation**: The draw-on is triggered once on mount/activation,
  not driven by a continuous [0,1] scroll signal. No such signal exists in the
  current store.
- **Store changes**: `useActiveChapter`, `useScrollStore`, `useD3Scales`,
  `useDataInterpolation` are frozen — zero modifications.
- **Layout/container changes**: `Scrollytelling.tsx` and `StickyVisualization.tsx`
  are frozen.
- **Animation replay on revisit**: The draw-on animation plays exactly once per
  component lifetime. Revisiting the chapter does NOT replay it (unless the
  component fully unmounts and remounts).
- **Keyboard or touch interaction**: Tooltip and hover are pointer-only in this
  change; accessibility enhancements are a future concern.
- **Tooltip HTML overlay**: The LineChart tooltip MUST be SVG `<g>`. The
  ChoroplethMap tooltip placement strategy is not prescribed beyond the requirement
  to not interfere with path events.
- **New npm dependencies**: Framer Motion is already on the stack. No new packages
  are to be introduced.

---

## 5. File Boundaries

| File | State | What must be true |
|------|-------|-------------------|
| `src/features/coffee-story/visualizations/LineChart.tsx` | Modified | Axes, gridlines, gradient, draw-on animation, tooltip; no forbidden D3 APIs |
| `src/features/coffee-story/visualizations/LineChart.test.tsx` | Modified | Scenarios 2.1–2.4 covered |
| `src/features/coffee-story/visualizations/ChoroplethMap.tsx` | Modified | Hover, tooltip, CSS fill transition, ColorLegend usage; no forbidden D3 APIs |
| `src/features/coffee-story/visualizations/ChoroplethMap.test.tsx` | Modified | Scenarios 2.5–2.8 covered |
| `src/features/coffee-story/visualizations/ColorLegend.tsx` | New | Pure presentational, swatch + label per color band |
| `src/features/coffee-story/visualizations/ColorLegend.test.tsx` | New | Scenario 2.7 covered |

---

## 6. Delivery Boundary

- **PR 1** covers LineChart only (sections 2.1–2.4 + REQ-NFR-01–09 for that file).
- **PR 2** covers ChoroplethMap + ColorLegend (sections 2.5–2.8 + REQ-NFR-01–09
  for those files).
- Each PR MUST stay under the 400-line review budget.
