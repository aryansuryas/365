'use client'

import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SiteHeader } from '@/components/site/header'

const fadeIn = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

export default function ToolsLayout({ children }) {
  const pathname = usePathname()
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader variant="tool" />
      <AnimatePresence mode="wait">
        <motion.div key={pathname} initial="hidden" animate="show" exit="hidden" variants={fadeIn} className="flex-1">
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
