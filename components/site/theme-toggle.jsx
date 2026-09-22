'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" />
  const isDark = theme === 'dark'

  const toggle = () => {
    // Briefly allow color transitions on everything so the switch fades
    // instead of snapping, then remove it so normal hover transitions
    // aren't slowed down the rest of the time.
    document.documentElement.classList.add('theme-transition')
    setTheme(isDark ? 'light' : 'dark')
    window.setTimeout(() => {
      document.documentElement.classList.remove('theme-transition')
    }, 420)
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground/70 transition hover:text-foreground hover:border-foreground/30"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
