/**
 * ColorLegend — pure presentational swatch bar.
 *
 * D3↔React hybrid contract: React owns the DOM as JSX. D3 math only.
 * ZERO hooks, ZERO side effects, ZERO store access.
 *
 * Props:
 *   colorScale   — maps a numeric production value to a CSS color string
 *   domainExtent — [min, max] of the production domain
 *   width        — total width of the legend bar (default 200)
 *   steps        — number of color swatches (default 6)
 *
 * Renders: <g> containing `steps` <rect> swatches + min/max <text> labels.
 */

interface ColorLegendProps {
  colorScale: (v: number) => string
  domainExtent: [number, number]
  width?: number
  steps?: number
}

export function ColorLegend({
  colorScale,
  domainExtent,
  width = 200,
  steps = 6,
}: ColorLegendProps) {
  const [min, max] = domainExtent
  const swatchWidth = width / steps
  const swatchHeight = 12

  // Sample values evenly across the domain extent.
  const sampleValues = Array.from({ length: steps }, (_, i) => {
    const t = steps === 1 ? 0 : i / (steps - 1)
    return min + t * (max - min)
  })

  return (
    <g>
      {sampleValues.map((value, i) => (
        <rect
          key={i}
          x={i * swatchWidth}
          y={0}
          width={swatchWidth}
          height={swatchHeight}
          fill={colorScale(value)}
        />
      ))}
      <text
        x={0}
        y={swatchHeight + 12}
        textAnchor="start"
        fontSize={10}
      >
        {min}
      </text>
      <text
        x={width}
        y={swatchHeight + 12}
        textAnchor="end"
        fontSize={10}
      >
        {max}
      </text>
    </g>
  )
}
