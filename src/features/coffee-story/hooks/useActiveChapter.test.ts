/**
 * Tests for useActiveChapter — IntersectionObserver scroll hook.
 *
 * Spec: "IntersectionObserver Sole Writer"
 *   - When a chapter section enters the viewport mid-band, activeChapterId updates.
 *   - Scrolling backward also updates the store (the last intersecting entry wins).
 *   - Exactly ONE observer is registered over all chapter refs.
 *
 * The IntersectionObserver global is replaced with a controllable stub so tests
 * never touch the real browser API.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { RefObject } from 'react'
import type { Chapter } from '../../../domain/coffee'

// RED: these imports will fail until the hook module is created.
import { useActiveChapter } from './useActiveChapter'
import { useScrollStore } from '../store/scrollStore'

// ---------------------------------------------------------------------------
// IntersectionObserver stub
// ---------------------------------------------------------------------------

type IntersectionCallback = (entries: IntersectionObserverEntry[]) => void

class MockIntersectionObserver {
  static instances: MockIntersectionObserver[] = []
  private callback: IntersectionCallback
  public observedTargets: Element[] = []
  public options: IntersectionObserverInit | undefined

  constructor(callback: IntersectionCallback, options?: IntersectionObserverInit) {
    this.callback = callback
    this.options = options
    MockIntersectionObserver.instances.push(this)
  }

  observe(target: Element) {
    this.observedTargets.push(target)
  }

  unobserve(target: Element) {
    this.observedTargets = this.observedTargets.filter((t) => t !== target)
  }

  disconnect() {
    this.observedTargets = []
  }

  /** Manually fire the observer with synthetic entries. */
  trigger(entries: Partial<IntersectionObserverEntry>[]) {
    this.callback(entries as IntersectionObserverEntry[])
  }
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const makeChapters = (): Chapter[] => [
  { id: 'chapter-1', index: 0, source: 'FAO', viz: 'line', title: 'Ch 1', body: 'Body 1' },
  { id: 'chapter-2', index: 1, source: 'FAO', viz: 'line', title: 'Ch 2', body: 'Body 2' },
  { id: 'chapter-3', index: 2, source: 'EVA', viz: 'choropleth', title: 'Ch 3', body: 'Body 3' },
]

function makeSentinelRefs(ids: string[]): Map<string, RefObject<HTMLElement | null>> {
  const map = new Map<string, RefObject<HTMLElement | null>>()
  for (const id of ids) {
    const el = document.createElement('div')
    el.setAttribute('data-chapter-id', id)
    document.body.appendChild(el)
    map.set(id, { current: el })
  }
  return map
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useActiveChapter', () => {
  beforeEach(() => {
    MockIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    // Reset store
    act(() => {
      useScrollStore.setState({ activeChapterId: null })
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    // Remove any DOM elements added by makeSentinelRefs
    document.body.innerHTML = ''
  })

  it('updates activeChapterId in store when chapter-3 sentinel enters viewport', () => {
    const chapters = makeChapters()
    const refs = makeSentinelRefs(chapters.map((c) => c.id))

    renderHook(() => useActiveChapter(chapters, refs))

    const [observer] = MockIntersectionObserver.instances
    expect(observer).toBeDefined()

    act(() => {
      observer.trigger([
        {
          isIntersecting: true,
          target: refs.get('chapter-3')!.current!,
        },
      ])
    })

    expect(useScrollStore.getState().activeChapterId).toBe('chapter-3')
  })

  it('updates store when scrolling backward — chapter-2 after chapter-3 was active', () => {
    const chapters = makeChapters()
    const refs = makeSentinelRefs(chapters.map((c) => c.id))

    renderHook(() => useActiveChapter(chapters, refs))

    const [observer] = MockIntersectionObserver.instances

    // First, chapter-3 enters
    act(() => {
      observer.trigger([{ isIntersecting: true, target: refs.get('chapter-3')!.current! }])
    })
    expect(useScrollStore.getState().activeChapterId).toBe('chapter-3')

    // Now scroll back — chapter-2 enters
    act(() => {
      observer.trigger([{ isIntersecting: true, target: refs.get('chapter-2')!.current! }])
    })
    expect(useScrollStore.getState().activeChapterId).toBe('chapter-2')
  })

  it('does NOT update store when entry is NOT intersecting', () => {
    const chapters = makeChapters()
    const refs = makeSentinelRefs(chapters.map((c) => c.id))

    renderHook(() => useActiveChapter(chapters, refs))

    const [observer] = MockIntersectionObserver.instances

    act(() => {
      observer.trigger([
        { isIntersecting: false, target: refs.get('chapter-1')!.current! },
      ])
    })

    expect(useScrollStore.getState().activeChapterId).toBeNull()
  })

  it('registers exactly ONE IntersectionObserver over all chapter refs', () => {
    const chapters = makeChapters()
    const refs = makeSentinelRefs(chapters.map((c) => c.id))

    renderHook(() => useActiveChapter(chapters, refs))

    expect(MockIntersectionObserver.instances).toHaveLength(1)
    expect(MockIntersectionObserver.instances[0].observedTargets).toHaveLength(3)
  })

  it('disconnects the observer on unmount', () => {
    const chapters = makeChapters()
    const refs = makeSentinelRefs(chapters.map((c) => c.id))

    const { unmount } = renderHook(() => useActiveChapter(chapters, refs))
    const [observer] = MockIntersectionObserver.instances
    const disconnectSpy = vi.spyOn(observer, 'disconnect')

    unmount()

    expect(disconnectSpy).toHaveBeenCalledOnce()
  })

  it('uses the correct rootMargin option', () => {
    const chapters = makeChapters()
    const refs = makeSentinelRefs(chapters.map((c) => c.id))

    renderHook(() => useActiveChapter(chapters, refs))

    const [observer] = MockIntersectionObserver.instances
    expect(observer.options?.rootMargin).toBe('-45% 0px -45% 0px')
  })
})
