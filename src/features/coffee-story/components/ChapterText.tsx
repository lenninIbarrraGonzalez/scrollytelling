/**
 * ChapterText — presentational chapter narrative component.
 *
 * Design: Framer Motion motion.div with opacity/y transitions for smooth
 * chapter text transitions. AnimatePresence handles exit animations.
 * No inline narrative strings — all text comes from the Chapter prop.
 *
 * Props:
 *   chapter  — Chapter domain object (title, body, id)
 *   isActive — Controls animate state (visible vs faded)
 */

import { motion, AnimatePresence } from 'framer-motion'
import type { Chapter } from '../../../domain/coffee'

interface ChapterTextProps {
  chapter: Chapter
  isActive: boolean
}

const variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export function ChapterText({ chapter, isActive }: ChapterTextProps) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={chapter.id}
          data-chapter-id={chapter.id}
          variants={variants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          <h2>{chapter.title}</h2>
          <p>{chapter.body}</p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
