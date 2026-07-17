/**
 * In-memory fetch-once cache.
 *
 * Stores the PROMISE (not the resolved value) so that concurrent calls to the
 * same key deduplicate to one in-flight request.
 */

export interface Cache<T> {
  /**
   * Return the cached promise for `url` if it exists, otherwise call `fetcher`
   * and cache the returned promise before returning it.
   */
  get(url: string, fetcher: () => Promise<T>): Promise<T>
}

export function createCache<T>(): Cache<T> {
  const store = new Map<string, Promise<T>>()

  return {
    get(url, fetcher) {
      if (!store.has(url)) {
        store.set(url, fetcher())
      }
      return store.get(url)!
    },
  }
}
