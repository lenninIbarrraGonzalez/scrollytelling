# Design: Interactive, Crafted Visualizations

## Technical Approach

All new SVG elements stay inside the D3↔React hybrid contract: React owns every
DOM node as JSX, D3 supplies math only (`scale.ticks`, `d3.area`, `d3.bisector`,
`d3.format`). Draw-on uses Framer Motion `motion.path` + animated
`strokeDashoffset`, playing once on first activation. Tooltip/hover live in local
`useState`. Choropleth color change uses CSS `transition: fill 300ms`. Zero
`d3.select/.append/.attr/.transition`. Delivered as 2 PRs (LineChart; then
ChoroplethMap + ColorLegend).

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Axes | Map `xScale.ticks(6)` / `yScale.ticks(5)` → `<line>`+`<text>` JSX | `d3.axis` (mutates DOM) | Keeps hybrid contract; ticks are pure math |
| Draw-on | Framer `motion.path` + `strokeDashoffset`, `hasAnimated` in `useRef` | rAF hook (B); CSS keyframes (C, path length unknown) | On-stack, declarative, testable with mock; ref survives re-render, never resets |
| Total length | `useRef<SVGPathElement>` + `useEffect` reads `getTotalLength()` | Estimate from `d` | Exact; JSDOM lacks it → tests mock `SVGPathElement.prototype.getTotalLength` |
| Tooltip render | SVG `<g>` overlay inside chart | HTML `<div>` overlay | Coordinate-consistent, stays in hybrid contract |
| Nearest-year | `d3.bisector(d => d.year)` on SVG-space cursor x | linear scan | Pure math, O(log n) |
| Legend | Separate presentational `ColorLegend` | Inline in map | Reusable, isolated tests, smaller PR2 diff |
| Legend data | New `domainExtent` prop on `ChoroplethMap` → forwarded | Recompute from `productionByDane` | `StickyVisualization`/`Scrollytelling` already own `productionExtent`; per-chapter filtering makes local recompute wrong |

## Data Flow

    Scrollytelling (owns productionExtent, colorScale)
         │ (PR2: thread domainExtent, unchanged elsewhere)
         ▼
    StickyVisualization ──→ LineChart (self-contained axes/anim/tooltip)
         │
         └──→ ChoroplethMap ──→ ColorLegend (colorScale, domainExtent)

Pointer: `onMouseMove(svg)` → `clientX - svg.getBoundingClientRect().left - MARGIN.left`
→ `bisector` → `setTooltip({x,y,year,production})`. Mouse-leave clears.

## File Changes

| File | Action | Description |
|---|---|---|
| `visualizations/LineChart.tsx` | Modify | X/Y axes, gridlines, gradient area, draw-on, tooltip |
| `visualizations/LineChart.test.tsx` | Modify | Extend suite (axes, anim mock, tooltip) |
| `visualizations/ChoroplethMap.tsx` | Modify | Hover, tooltip, CSS fill transition, `domainExtent` prop, delegate legend |
| `visualizations/ChoroplethMap.test.tsx` | Modify | Extend suite (hover, tooltip, transition-style, legend present) |
| `visualizations/ColorLegend.tsx` | Create | Swatch bar + min/max labels |
| `visualizations/ColorLegend.test.tsx` | Create | Swatch count, label text, no-d3-select guard |
| `visualizations/StickyVisualization.tsx` | Modify (PR2, minimal) | Pass `domainExtent` to ChoroplethMap |
| `components/Scrollytelling.tsx` | Modify (PR2, one line) | Thread existing `productionExtent` down |

Note: proposal scoped StickyVisualization/Scrollytelling as "no change"; the
legend needs `domainExtent`, which they already compute. The change is a single
prop pass-through, not new logic — acceptable and minimal.

## Interfaces / Contracts

```ts
// LineChart internal state (no prop changes)
type LineTooltip = { x: number; y: number; year: number; production: number } | null
const hasAnimated = useRef(false)         // survives re-render, never resets
const pathRef = useRef<SVGPathElement>(null)
const [tooltip, setTooltip] = useState<LineTooltip>(null)

// ChoroplethMap: ONE new optional prop
interface ChoroplethMapProps { /* existing */ domainExtent?: [number, number] }
const [hoveredDane, setHoveredDane] = useState<string | null>(null)
const [tip, setTip] = useState<{ x:number; y:number; name:string; production:number } | null>(null)
// hovered path: strokeWidth={2.5} stroke="#333"; every path: style={{ transition: 'fill 300ms ease' }}

// ColorLegend
interface ColorLegendProps {
  colorScale: (v: number) => string
  domainExtent: [number, number]
  width?: number      // default 200
  steps?: number      // default 6
}
// renders <g>: `steps` <rect> swatches (fill = colorScale at even domain samples) + min/max <text>
```

LineChart axes: Y ticks use `d3.format('.2s')` for large production values;
gridlines are horizontal `<line>` across `innerWidth`. Gradient: `<defs>` +
`<linearGradient>` id, area path from `d3.area().y0(innerHeight).y1(ySc(prod))`.

## Testing Strategy

| Component | Test | Approach / Mock |
|---|---|---|
| LineChart | axis tick labels render | assert `<text>` tick values present |
| LineChart | gradient defs + area path | query `linearGradient` id + area `<path>` |
| LineChart | draw-on plays once | mock `SVGPathElement.prototype.getTotalLength → 100`; assert `motion.path` present; re-render keeps `hasAnimated` true |
| LineChart | tooltip on mousemove | `fireEvent.mouseMove` on svg, mock `getBoundingClientRect`; assert crosshair/dot/text; mouseLeave clears |
| ChoroplethMap | hover sets stroke | `mouseEnter` path → strokeWidth 2.5; `mouseLeave` reverts |
| ChoroplethMap | tooltip content | `mouseMove` → name + tonnes text |
| ChoroplethMap | fill transition style present | assert `style.transition` includes `fill` |
| ChoroplethMap | legend rendered | ColorLegend `<g>`/swatches present |
| ColorLegend | swatch count = steps | default 6 `<rect>` |
| ColorLegend | min/max labels | domain extent text |
| all | d3-guard | existing raw-source scan stays green (JSX-only additions) |

Do NOT test: CSS transition timing, real animation frames, actual pixel
positions — JSDOM does not run them.

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file
classification, or process-integration boundary. Pure presentational SVG.

## Migration / Rollout

No data migration. 2 PRs: **PR1** LineChart (axes, gridlines, gradient,
draw-on-once, tooltip/crosshair/marker) — self-contained, no upstream change.
**PR2** ChoroplethMap + ColorLegend (hover, tooltip, transition, legend) + the
one-line `domainExtent` thread through StickyVisualization/Scrollytelling.
Per-slice `git revert` restores prior static rendering.

## Open Questions

- None blocking. `domainExtent` prop is optional with a safe fallback
  (`colorScale`-derived) so PR2 stays backward-compatible if threading is deferred.
