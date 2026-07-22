/**
 * useActiveChapter — the SOLE writer to Zustand activeChapterId.
 *
 * Registers ONE IntersectionObserver over all chapter sentinel elements.
 * When a sentinel enters the viewport mid-band it calls setActiveChapter(id).
 * This hook is the ONLY code permitted to write to the scroll store.
 *
 * Options:
 *   rootMargin: '-45% 0px -45% 0px'  — fires when the element crosses ±45% from center
 *   threshold: 0                       — fires on first pixel of intersection
 */

import { useEffect } from 'react'
import type { RefObject } from 'react'
import type { Chapter } from '../../../domain/coffee'
import { useScrollStore } from '../store/scrollStore'

/**
 * @param chapters    - Ordered list of narrative chapters (for id lookup)
 * @param sentinelRefs - Map from chapter.id to a React ref pointing to its sentinel element
 */
export function useActiveChapter(
  chapters: Chapter[],
  sentinelRefs: Map<string, RefObject<HTMLElement | null>>,
  rootMargin = '-45% 0px -45% 0px',
): void {
  const setActiveChapter = useScrollStore((s) => s.setActiveChapter)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue

          // Find which chapter id owns this sentinel element.
          for (const chapter of chapters) {
            const ref = sentinelRefs.get(chapter.id)
            if (ref?.current === entry.target) {
              setActiveChapter(chapter.id)
              break
            }
          }
        }
      },
      {
        rootMargin,
        threshold: 0,
      },
    )

    // Observe all sentinel elements.
    for (const chapter of chapters) {
      const ref = sentinelRefs.get(chapter.id)
      if (ref?.current) {
        observer.observe(ref.current)
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [chapters, sentinelRefs, setActiveChapter, rootMargin])
}
