/**
 * Tests for the Zustand scroll store.
 *
 * Spec: "Direct state write prohibited" — only the IntersectionObserver hook
 * may call setActiveChapter. The store module must NOT export setActiveChapter
 * as a standalone function so callers cannot write state directly.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'

// RED: these imports will fail until the store module is created.
import { useScrollStore } from './scrollStore'

describe('scrollStore', () => {
  beforeEach(() => {
    // Reset Zustand store between tests by accessing setState directly on the store.
    // This avoids test pollution.
    act(() => {
      useScrollStore.setState({ activeChapterId: null })
    })
  })

  it('sets activeChapterId when setActiveChapter is called', () => {
    const { result } = renderHook(() => useScrollStore())

    act(() => {
      result.current.setActiveChapter('chapter-3')
    })

    expect(result.current.activeChapterId).toBe('chapter-3')
  })

  it('updates activeChapterId when called a second time', () => {
    const { result } = renderHook(() => useScrollStore())

    act(() => {
      result.current.setActiveChapter('chapter-1')
    })
    act(() => {
      result.current.setActiveChapter('chapter-2')
    })

    expect(result.current.activeChapterId).toBe('chapter-2')
  })

  it('starts with activeChapterId as null', () => {
    const { result } = renderHook(() => useScrollStore())
    expect(result.current.activeChapterId).toBeNull()
  })

  it('does NOT export setActiveChapter as a standalone function', async () => {
    // Import the entire module and verify setActiveChapter is NOT a named export.
    // If it were, callers could write store state bypassing the observer hook.
    const storeModule = await import('./scrollStore')
    expect('setActiveChapter' in storeModule).toBe(false)
  })
})
