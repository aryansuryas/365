'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'

export function SiteHeader({ variant = 'home' }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
        {variant === 'tool' ? (
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            All tools
          </Link>
        ) : (
          <Logo />
        )}

        <div className="flex items-center gap-2">
          {variant === 'tool' && <Logo size="sm" />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
