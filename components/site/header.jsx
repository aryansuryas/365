'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'
import { AvatarBadge } from './avatar-badge'
import { MobileMenu } from './mobile-menu'
import { MAKER, NAV_LINKS } from '@/lib/site'

export function SiteHeader({ variant = 'home' }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {variant === 'tool' ? (
          <Link
            href="/"
            className="group flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            All tools
          </Link>
        ) : (
          <Logo />
        )}

        <div className="flex items-center gap-3">
          {variant === 'home' && (
            <nav className="hidden items-center gap-5 sm:flex">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}
          {variant === 'tool' && <Logo size="sm" />}
          <ThemeToggle />
          <AvatarBadge initials={MAKER.initials} href={MAKER.portfolio} label={`Made by ${MAKER.name}`} />
          {variant === 'home' && <MobileMenu links={NAV_LINKS} />}
        </div>
      </div>
    </header>
  )
}
