import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.995 }}
      transition={{
        duration: 0.28,
        ease: [0.22, 1, 0.36, 1]
      }}
      style={{ width: '100%', height: '100%' }}
    >
      {children}
    </motion.div>
  )
}
