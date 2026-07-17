/**
 * Zustand store for the scrollytelling active chapter.
 *
 * Design contract (non-negotiable):
 * - activeChapterId is the single source of truth for which chapter is in view.
 * - setActiveChapter is the ONLY mutation; it lives INSIDE the store.
 * - It is NOT exported as a standalone function. The IntersectionObserver hook
 *   (useActiveChapter) is the ONLY code that reads it from the hook return value
 *   and calls it. This enforces the single-writer rule.
 * - Visualizations subscribe READ-ONLY via selectors.
 */

import { create } from 'zustand'

interface ScrollStoreState {
  /** The id of the chapter currently intersecting the viewport mid-band. */
  activeChapterId: string | null
  /** Write-only from the IntersectionObserver hook. Not exported standalone. */
  setActiveChapter: (id: string) => void
}

export const useScrollStore = create<ScrollStoreState>((set) => ({
  activeChapterId: null,
  setActiveChapter: (id: string) => set({ activeChapterId: id }),
}))
