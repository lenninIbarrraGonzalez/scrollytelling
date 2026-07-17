# Exploration — coffee-scrollytelling

Status: complete · Artifact store: openspec (mirrored to Engram `sdd/coffee-scrollytelling/explore`, id 337)

## Goal

Validate the DATA SOURCE and narrative feasibility for a scrollytelling piece on
Colombian coffee production BEFORE writing any chapter text or code. In data
journalism the numbers drive the narrative, not the other way around.

## CRITICAL FINDING — the EVA dataset does NOT cover the 1990s or 2000

The Socrata EVA dataset assumed in the brief (`2pnw-mmge`) only covers **2007–2018**.
The original narrative (1990s auge, 2000 price collapse) has NO data in this source.
A newer EVA dataset (`uejq-wxrr`) extends **2019–2024** but with a different schema.
Department-level coffee data therefore only exists from 2007 onward.

This forces a decision about how to tell chapters 1–2 (see Decision Required below).

## Validated Socrata facts (real queries, hit live)

- Base endpoint: `https://www.datos.gov.co/resource/2pnw-mmge.json` (SoQL params).
- Coffee filter: `cultivo='CAFE'` (UPPERCASE, NO accent). The newer dataset uses `cultivo='Café'`.
- Year range confirmed: `2pnw-mmge` = 2007–2018; `uejq-wxrr` = 2019–2024.
- Field names are Socrata-encoded (ñ/accents → `_`):
  - year → `a_o` (STRING, not number)
  - production (t) → `producci_n_t` (STRING)
  - area sembrada → `rea_sembrada_ha`; area cosechada → `rea_cosechada_ha`
  - yield → `rendimiento_t_ha`; department → `departamento`; municipio → `municipio`
- Roya dip CONFIRMED visible in EVA: peak 2007 = 828,904 t → 2011 = 640,451 t → 2012 = 626,798 t (~24% drop), then recovery. The 2007–2024 window captures the roya crisis and the specialty-coffee recovery arc cleanly.

### Working validated queries

```
# Field/coffee sample
?$where=cultivo='CAFE'&$limit=3
# Year range
?$select=min(a_o) as min_year,max(a_o) as max_year&$where=cultivo='CAFE'
# National annual production
?$select=a_o,sum(producci_n_t) as total&$where=cultivo='CAFE'&$group=a_o&$order=a_o ASC&$limit=50
# Key departments by year
?$select=departamento,a_o,sum(producci_n_t) as produccion&$where=cultivo='CAFE' AND departamento in('HUILA','ANTIOQUIA','TOLIMA','CALDAS','RISARALDA','QUINDIO')&$group=departamento,a_o&$order=departamento,a_o&$limit=200
```

## Historical gap — optional FAO/OWiD source (NOT Colombian government data)

`https://ourworldindata.org/grapher/coffee-production-by-region.csv` (FAO, tonnes) covers
1990–2024 at NATIONAL granularity: 1990s peak ~1.1M t, 1999 trough ~547k t (price crisis
visible, −37% from peak), roya basin 2009–2012, modern highs 2019 (885k), 2021 dip (La Niña
560k), 2024 recovery (840k). Caveat: FAO is international, NOT `datos.gov.co` — using it
dilutes the "official Colombian government data" requirement of the brief.

## Colombia department GeoJSON

- Source: `github.com/caticoa3/colombia_mapa`.
- Raw (live): `https://raw.githubusercontent.com/caticoa3/colombia_mapa/master/co_2018_MGN_DPTO_POLITICO.geojson` (387 KB). TopoJSON simplified variant also available (prefer for perf).
- Department name property: `DPTO_CNMBR` (UPPERCASE + accents). Code property: `DPTO_CCDGO` (2-digit DANE string).

## Department-name normalization (gotcha)

Three sources, three conventions: old EVA `QUINDIO` (accents stripped), new EVA `Quindío`
(title case + accents), GeoJSON `QUINDÍO` (uppercase + accents). **Recommended join: DANE
numeric code** (`DPTO_CCDGO` ↔ `c_d_dep` / `c_digo_dane_departamento`) to bypass text.
If text join needed: `toUpperCase()` + `normalize('NFD').replace(/\p{M}/gu,'')`.

## Narrative feasibility by chapter

| Chapter | EVA (2007+) | FAO (1990+) | Verdict |
|---|---|---|---|
| 1 — 1990s auge | NO | YES | national line only, no choropleth |
| 2 — 2000 colapso | NO | YES | national line only, no choropleth |
| 3 — ~2010 roya | YES | YES | fully feasible w/ department choropleth |
| 4 — cafés especiales | YES | YES | fully feasible |
| 5 — cierre comparativo | YES (2007+) | YES | feasible |

## Risks

1. Two EVA datasets have incompatible schemas — bridge/normalize in the data layer.
2. `cultivo` value differs: `'CAFE'` (old) vs `'Café'` (new) — wrong value = 0 rows silently.
3. All numeric fields return as STRINGS — `parseFloat`/`Number` everywhere.
4. No department data before 2007 — chapters 1–2 cannot render a choropleth.
5. GeoJSON 387 KB — prefer simplified TopoJSON + `topojson-client`.
6. 2021 La Niña anomaly needs annotation to not confuse the recovery narrative.

## Decision Required (blocks proposal)

How to handle chapters 1–2 (1990s auge, 2000 colapso), which have NO Colombian-government
data before 2007. See the three scoping options carried to the proposal phase.
