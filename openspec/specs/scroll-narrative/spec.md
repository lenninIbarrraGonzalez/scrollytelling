# scroll-narrative Specification

## Purpose

Scroll-driven chapter navigation where IntersectionObserver is the sole writer of `activeChapterId` in Zustand. Chapter text transitions smoothly via Framer Motion. Narrative content is typed data decoupled from components.

## Requirements

### Requirement: IntersectionObserver Sole Writer

The system MUST derive `activeChapterId` exclusively from IntersectionObserver callbacks. No component, hook, or user event handler MAY set `activeChapterId` directly except the IntersectionObserver callback.

#### Scenario: Chapter enters viewport threshold

- GIVEN five chapter sections are mounted with `data-chapter-id` attributes
- WHEN chapter 3's section crosses the configured IntersectionObserver threshold (e.g., 50% visible)
- THEN `activeChapterId` in Zustand becomes `'chapter-3'`
- AND no other chapter id is active simultaneously

#### Scenario: Scrolling backward updates active chapter

- GIVEN `activeChapterId` is `'chapter-3'`
- WHEN the user scrolls up until chapter 2 crosses the threshold
- THEN `activeChapterId` becomes `'chapter-2'`

#### Scenario: Direct state write is prohibited

- GIVEN the scroll-narrative feature is mounted
- WHEN any code path other than the IntersectionObserver callback attempts to call `setActiveChapterId`
- THEN the store exposes no such setter outside the observer hook (enforced by module boundary — only `useScrollObserver` calls the internal setter)

### Requirement: Typed Chapter Content

The system MUST define all narrative content (title, body, source citation, chapter id, protagonist departments) in a typed `content/chapters.ts` file. Components MUST NOT contain inline narrative strings.

#### Scenario: Chapter content is typed data

- GIVEN `chapters.ts` exports an array of `Chapter` objects
- WHEN a component reads `chapters[2].body`
- THEN TypeScript enforces the shape at compile time (no `any`, no string indexing)

#### Scenario: Missing chapter id is a type error

- GIVEN a `Chapter` object is constructed without an `id` field
- WHEN TypeScript compiles the file
- THEN compilation fails with a type error

### Requirement: Smooth Text Transitions

The system MUST animate chapter text in/out using Framer Motion when `activeChapterId` changes. The transition MUST be perceptible (duration > 0 ms) and MUST NOT cause layout shift on the sticky visualization.

#### Scenario: Text fades in on chapter activation

- GIVEN `activeChapterId` changes to `'chapter-2'`
- WHEN the chapter-2 text block mounts or becomes visible
- THEN a Framer Motion `AnimatePresence` or `motion` element applies an opacity/y-axis transition

#### Scenario: Inactive chapter text is not visible

- GIVEN `activeChapterId` is `'chapter-3'`
- WHEN the component renders
- THEN chapter-1 and chapter-2 text elements are either unmounted or have `opacity: 0` (not merely off-screen)
