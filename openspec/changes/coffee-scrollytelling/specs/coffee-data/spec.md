# coffee-data Specification

## Purpose

Hexagonal data layer that isolates all external API knowledge inside adapters. Adapters map raw string API responses to numeric domain models. Fetch-once in-memory cache. Explicit load and error states. Components never see raw API field names.

## Requirements

### Requirement: String-to-Numeric Domain Mapping

Adapters MUST convert every numeric field from its raw string form to a JavaScript `number` in the domain model. No component or hook outside `src/data/` MAY receive a string where the domain model declares a number.

#### Scenario: producci_n_t maps to domain.production as number

- GIVEN the EVA adapter receives a raw row where `producci_n_t` is the string `'626798.0'`
- WHEN the adapter maps the row to the domain model
- THEN `domain.production === 626798` (type `number`, not string)
- AND `typeof domain.production === 'number'`

#### Scenario: a_o maps to domain.year as number

- GIVEN the EVA adapter receives a raw row where `a_o` is the string `'2012'`
- WHEN the adapter maps the row
- THEN `domain.year === 2012` (type `number`)

#### Scenario: rea_sembrada_ha maps to domain.areaSown as number

- GIVEN the EVA adapter receives `rea_sembrada_ha` as `'95432.5'`
- WHEN the adapter maps the row
- THEN `domain.areaSown === 95432.5` (type `number`)

### Requirement: Per-Dataset Coffee Filter Constants

Each EVA dataset MUST declare its own `cultivo` filter constant. The old dataset (2pnw-mmge) MUST use `'CAFE'` (uppercase, no accent). The new dataset (uejq-wxrr) MUST use `'Café'` (title case, with accent). Both constants MUST be asserted non-empty at module load time.

#### Scenario: Old dataset filter constant is CAFE

- GIVEN the adapter for dataset `2pnw-mmge` is imported
- WHEN `OLD_EVA_CULTIVO_FILTER` is read
- THEN its value is exactly `'CAFE'` (three characters, no diacritics)

#### Scenario: New dataset filter constant is Café

- GIVEN the adapter for dataset `uejq-wxrr` is imported
- WHEN `NEW_EVA_CULTIVO_FILTER` is read
- THEN its value is exactly `'Café'` (four characters, é with accent)

#### Scenario: Wrong coffee filter yields error, not silent empty

- GIVEN an EVA adapter is instantiated with a `cultivo` filter value of `'cafe'` (lowercase)
- WHEN the adapter validates its configuration
- THEN it throws an error (or returns a rejected promise) with a descriptive message
- AND it does NOT silently return an empty array of rows

#### Scenario: Non-empty assertion fires at module load

- GIVEN a misconfigured adapter sets `CULTIVO_FILTER` to an empty string `''`
- WHEN the adapter module is imported
- THEN an error is thrown before any network request is made

### Requirement: Fetch-Once In-Memory Cache

The data layer MUST fetch each remote resource at most once per application session. Subsequent calls to the same data function MUST return the cached result without making a new network request.

#### Scenario: Second call returns cached result

- GIVEN `fetchEVAOld()` has been called and resolved successfully
- WHEN `fetchEVAOld()` is called a second time
- THEN no additional HTTP request is made (verifiable by asserting `fetch` mock call count remains at 1)
- AND the second call resolves with the same data

#### Scenario: Cache is keyed per dataset

- GIVEN `fetchEVAOld()` and `fetchEVANew()` are both called
- WHEN both resolve
- THEN `fetch` has been called exactly twice (once per dataset URL)

### Requirement: EVA–GeoJSON Join by DANE Code

The data layer MUST join EVA department records to GeoJSON features using the numeric DANE department code, not department name strings. The join MUST work regardless of name casing or accent variations across datasets.

#### Scenario: Huila joins correctly by DANE code 41

- GIVEN an EVA record with `c_d_dep === '41'` (or equivalent integer `41`)
- WHEN joined to the GeoJSON feature set
- THEN the matching GeoJSON feature has `DPTO_CCDGO === '41'` (Huila)
- AND no string name comparison is performed

#### Scenario: Name mismatch does not break the join

- GIVEN old EVA uses `departamento === 'QUINDIO'` and GeoJSON uses `DPTO_CNMBR === 'QUINDÍO'`
- WHEN the join executes using DANE code
- THEN Quindío joins successfully (DANE code `63`)
- AND zero join failures occur due to name discrepancy

### Requirement: FAO National Series Coverage

The FAO adapter MUST expose national production data for Colombia covering years 1990–2006 (at minimum). It MUST correctly surface the 1999 trough (~547,000 t) and the 1990s peak (~1.1M t).

#### Scenario: FAO data includes 1999 trough

- GIVEN the FAO adapter has loaded the OWiD CSV
- WHEN the domain series is filtered to year `1999`
- THEN at least one record exists with `year === 1999`
- AND `production` is approximately `547000` (within ±10,000 t of the validated value)

#### Scenario: FAO series starts at 1990

- GIVEN the FAO adapter domain series
- WHEN the minimum year is computed
- THEN `minYear <= 1990`

### Requirement: Load and Error States Surfaced to UI

Every data fetch MUST expose an explicit `loading: boolean` and `error: Error | null` state. Components MUST be able to render a loading indicator and an error message without accessing raw API fields.

#### Scenario: Loading state is true before fetch resolves

- GIVEN a component uses the coffee data hook
- WHEN the fetch is in-flight
- THEN `loading === true` and `data === null`

#### Scenario: Error state is set on network failure

- GIVEN the EVA endpoint returns a 500 response
- WHEN the hook processes the failure
- THEN `error` is a non-null `Error` instance with a descriptive message
- AND `loading === false`
- AND `data === null`

#### Scenario: Components never receive raw API field names

- GIVEN any React component outside `src/data/`
- WHEN it renders coffee production data
- THEN no reference to `producci_n_t`, `a_o`, `rea_sembrada_ha`, or `c_d_dep` exists in that component file (verifiable by static search)

### Requirement: Data Correctness — Key Narrative Numbers

Displayed production numbers for key narrative moments MUST trace to validated source values.

#### Scenario: 2007 EVA peak production is ~828,904 t

- GIVEN the EVA old adapter loads and sums all department rows for year `2007`
- WHEN the national total is computed
- THEN the result is approximately `828904` (within ±1000 t of the validated figure)

#### Scenario: 2012 roya trough production is ~626,798 t

- GIVEN the EVA old adapter loads and sums all department rows for year `2012`
- WHEN the national total is computed
- THEN the result is approximately `626798` (within ±1000 t of the validated figure)

#### Scenario: 2021 La Niña dip is annotated

- GIVEN the visualization renders FAO or EVA data for year `2021`
- WHEN the line chart or choropleth displays that year
- THEN an annotation element (label, tooltip marker, or aria-label) containing the text `'La Niña'` is present in the rendered output

#### Scenario: 2007 source switch is labeled in the UI

- GIVEN the visualization transitions from FAO (national) to EVA (departmental) data at 2007
- WHEN the narrative chapter or visualization renders the source attribution
- THEN a visible or accessible label identifies the data source switch at year 2007
