/**
 * Socrata SoQL query builder + JSON fetcher.
 *
 * All numeric fields from the API arrive as strings. This module only handles
 * HTTP transport — coercion lives in the adapter.
 */

export interface SocrataClientBuilder {
  select(fields: string): SocrataClientBuilder
  where(clause: string): SocrataClientBuilder
  group(fields: string): SocrataClientBuilder
  order(clause: string): SocrataClientBuilder
  limit(n: number): SocrataClientBuilder
  toURL(): string
  fetchJson<T = Record<string, string>>(): Promise<T[]>
}

export function socrataClient(baseUrl: string): SocrataClientBuilder {
  const params: Record<string, string> = {}

  const builder: SocrataClientBuilder = {
    select(fields) {
      params['$select'] = fields
      return builder
    },
    where(clause) {
      params['$where'] = clause
      return builder
    },
    group(fields) {
      params['$group'] = fields
      return builder
    },
    order(clause) {
      params['$order'] = clause
      return builder
    },
    limit(n) {
      params['$limit'] = String(n)
      return builder
    },
    toURL() {
      const url = new URL(baseUrl)
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value)
      }
      return url.toString()
    },
    async fetchJson<T = Record<string, string>>(): Promise<T[]> {
      const url = builder.toURL()
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(
          `Socrata fetch failed: ${response.status} ${response.statusText} — ${url}`,
        )
      }
      return response.json() as Promise<T[]>
    },
  }

  return builder
}
