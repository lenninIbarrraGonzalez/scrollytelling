/**
 * chapters.ts — Typed narrative chapter content for the coffee scrollytelling.
 *
 * All narrative text lives here. Components MUST NOT contain inline strings.
 * Data figures are real and sourced from FAO / EVA (MADR/DANE).
 *
 * Source provenance:
 *   FAO = OWiD/FAOSTAT national production (1990–2006)
 *   EVA = MADR Evaluaciones Agropecuarias (2007–2024, departmental)
 *
 * Protagonist departments:
 *   Huila '41', Caldas '17', Quindío '63', Risaralda '66',
 *   Antioquia '05', Tolima '73'
 */

import type { Chapter } from '../../../domain/coffee'

// DANE codes for Huila and the eje cafetero — used in choropleth chapters.
const PROTAGONIST_CODES = ['41', '17', '63', '66', '05', '73']

export const chapters: Chapter[] = [
  {
    id: 'chapter-1',
    index: 0,
    source: 'FAO',
    viz: 'line',
    title: 'El auge del café colombiano en los años 90',
    body:
      'Durante la década de 1990, Colombia era el segundo productor mundial de café. ' +
      'La producción nacional superó los 800.000 toneladas anuales en los mejores años, ' +
      'impulsada por condiciones climáticas favorables y altos precios internacionales. ' +
      'Los datos provienen de la serie FAOSTAT 1990–2006.',
  },
  {
    id: 'chapter-2',
    index: 1,
    source: 'FAO',
    viz: 'line',
    title: 'El colapso del 2000: precios y sobreoferta',
    body:
      'A partir del año 2000, una sobreoferta mundial —liderada por Vietnam y Brasil— ' +
      'derrumbó los precios internacionales. La producción colombiana cayó a niveles no ' +
      'vistos desde la década de 1980, dejando a miles de caficultores en crisis financiera. ' +
      'Serie FAOSTAT hasta 2006; los datos EVA departamentales toman el relevo desde 2007.',
  },
  {
    id: 'chapter-3',
    index: 2,
    source: 'EVA',
    viz: 'choropleth',
    title: 'La roya: una epidemia que redibujó el mapa cafetero',
    body:
      'En 2008 se detectó una cepa virulenta de roya (Hemileia vastatrix) resistente a las ' +
      'variedades tradicionales. Para 2012, la producción había caído de ~828.904 t (pico EVA 2007) ' +
      'a ~626.798 t. El mapa muestra cómo el daño se concentró en el eje cafetero —Caldas, ' +
      'Risaralda, Quindío, Antioquia y Tolima— mientras Huila comenzaba a destacarse. ' +
      'Fuente: EVA 2007–2018 (dataset 2pnw-mmge, filtro cultivo=CAFE).',
    highlightDaneCodes: PROTAGONIST_CODES,
    dataYear: 2012,
    annotations: [
      { year: 2007, label: 'Pico EVA: ~828.904 t' },
      { year: 2012, label: 'Mínimo roya: ~626.798 t' },
    ],
  },
  {
    id: 'chapter-4',
    index: 3,
    source: 'EVA',
    viz: 'choropleth',
    title: 'Los cafés especiales y la recuperación de Huila',
    body:
      'La crisis de la roya aceleró una transformación: Colombia apostó por variedades ' +
      'resistentes (Castillo, Colombia) y por la diferenciación en cafés especiales. ' +
      'Huila (código DANE 41) emergió como el departamento líder en producción y calidad, ' +
      'desplazando al eje cafetero tradicional. En 2021, el fenómeno de La Niña provocó ' +
      'exceso de lluvias y una nueva caída transitoria a ~560.000 t. ' +
      'Fuente: EVA 2007–2024 (datasets 2pnw-mmge y uejq-wxrr).',
    highlightDaneCodes: PROTAGONIST_CODES,
    dataYear: 2019,
    annotations: [{ year: 2021, label: 'La Niña: ~560.000 t' }],
  },
  {
    id: 'chapter-5',
    index: 4,
    source: 'EVA',
    viz: 'choropleth',
    title: 'Huila vs. el eje cafetero: el nuevo equilibrio',
    body:
      'Al comparar la producción departamental entre 2007 y 2024, Huila (DANE 41) consolidó ' +
      'su liderazgo mientras el eje cafetero tradicional —Caldas (17), Risaralda (66), ' +
      'Quindío (63)— mantuvo volúmenes más modestos pero con calidad reconocida mundialmente. ' +
      'Antioquia (05) y Tolima (73) cerraron la brecha significativamente. ' +
      'El mapa revela un sector más diversificado y resiliente que en la era pre-roya.',
    highlightDaneCodes: PROTAGONIST_CODES,
    dataYear: 2023,
    annotations: [{ year: 2021, label: 'La Niña: ~560.000 t' }],
  },
  {
    id: 'chapter-6',
    index: 5,
    source: 'EVA',
    viz: 'scatter',
    dataYear: 2023,
    title: 'Volumen no es eficiencia',
    body:
      'Producir mucho no es lo mismo que producir bien. Cada burbuja es un departamento: ' +
      'su posición horizontal muestra cuánta tierra usa, la vertical qué tan eficiente es, ' +
      'y su tamaño cuánto café produce. Los pequeños que están arriba a la izquierda son ' +
      'los campeones silenciosos.',
    highlightDaneCodes: PROTAGONIST_CODES,
  },
  {
    id: 'chapter-7',
    index: 6,
    source: 'EVA',
    viz: 'slope',
    rankingYears: [2007, 2024],
    title: 'El giro regional',
    body:
      'Entre 2007 y 2024 el mapa del poder cafetero cambió. Huila trepó desde el cuarto ' +
      'puesto hasta el primero. El Eje Cafetero histórico cedió terreno relativo. Las líneas ' +
      'muestran el desplazamiento de cada departamento.',
    highlightDaneCodes: PROTAGONIST_CODES,
  },
  {
    id: 'chapter-8',
    index: 7,
    source: 'EVA',
    viz: 'line',
    seriesMode: 'weighted-yield',
    title: 'La revolución silenciosa',
    body:
      'Menos tierra, más café. Desde 2008 el rendimiento nacional ha crecido sostenidamente: ' +
      'la variedad Castillo, más resistente a la roya y al clima, transformó la productividad ' +
      'colombiana sin que el área sembrada creciera en la misma proporción.',
    highlightDaneCodes: PROTAGONIST_CODES,
  },
]
