/**
 * App — root component. Orchestrates data fetching and renders the Scrollytelling layout.
 *
 * Responsibilities:
 *   - Call useCoffeeData() — the single data entry point.
 *   - Branch on loading / error / data states.
 *   - Pass fetched data + typed chapters to <Scrollytelling>.
 *
 * This component does NOT contain narrative strings or visualization logic.
 */

import { useCoffeeData } from '../data/useCoffeeData'
import { Scrollytelling } from '../features/coffee-story/components/Scrollytelling'
import { chapters } from '../features/coffee-story/content/chapters'

export default function App() {
  const { data, loading, error } = useCoffeeData()

  if (loading) {
    return (
      <div
        data-testid="loading-state"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          fontSize: '1.25rem',
          color: '#555',
        }}
      >
        Cargando datos del café colombiano…
      </div>
    )
  }

  if (error) {
    return (
      <div
        data-testid="error-state"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          color: '#c00',
          gap: '1rem',
        }}
      >
        <h2>Error cargando los datos</h2>
        <p>{error.message}</p>
      </div>
    )
  }

  if (!data) {
    // Unreachable in normal flow (loading covers the null case), but satisfies TS.
    return null
  }

  return (
    <Scrollytelling
      chapters={chapters}
      nationalSeries={data.nationalSeries}
      departmentSeries={data.departmentSeries}
      geoFeatures={data.geoFeatures}
    />
  )
}
