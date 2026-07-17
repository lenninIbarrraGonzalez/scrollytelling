/**
 * Tests for ChapterText — presentational chapter text component.
 *
 * Spec: "Text fades in on chapter activation", "Inactive chapter text not visible"
 * Design: Framer Motion AnimatePresence + motion.div with opacity/y variants.
 *         Accepts Chapter prop + isActive boolean. No inline narrative strings.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { Chapter } from '../../../domain/coffee'

// RED: import fails until module exists.
import { ChapterText } from './ChapterText'

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const chapter: Chapter = {
  id: 'chapter-1',
  index: 0,
  source: 'FAO',
  viz: 'line',
  title: 'The Golden Age of Colombian Coffee',
  body: 'In the 1990s, Colombia was the world\'s second-largest coffee producer.',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChapterText', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders chapter title when isActive is true', () => {
    render(<ChapterText chapter={chapter} isActive={true} />)
    expect(screen.getByText(chapter.title)).toBeInTheDocument()
  })

  it('renders chapter body text when isActive is true', () => {
    render(<ChapterText chapter={chapter} isActive={true} />)
    expect(screen.getByText(chapter.body)).toBeInTheDocument()
  })

  it('wraps content in a Framer Motion element (has motion wrapper)', () => {
    const { container } = render(<ChapterText chapter={chapter} isActive={true} />)
    // Framer Motion motion.div renders a regular div with style — check it exists
    const motionEl = container.firstChild
    expect(motionEl).toBeTruthy()
    expect(motionEl?.nodeName).toBe('DIV')
  })

  it('renders with a data-testid="chapter-text" attribute on the wrapper', () => {
    render(<ChapterText chapter={chapter} isActive={true} />)
    const el = document.querySelector('[data-testid="chapter-text"]')
    expect(el).toBeInTheDocument()
  })

  it('does not render content when isActive is false', () => {
    render(<ChapterText chapter={chapter} isActive={false} />)
    // When inactive, AnimatePresence removes the content from the DOM.
    expect(screen.queryByText(chapter.title)).not.toBeInTheDocument()
    expect(screen.queryByText(chapter.body)).not.toBeInTheDocument()
  })
})
