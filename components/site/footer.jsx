import Link from 'next/link'
import { SITE_NAME } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          © {new Date().getFullYear()} {SITE_NAME}
        </span>
        <nav className="flex flex-wrap gap-4">
          <Link href="/privacy" className="transition hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="transition hover:text-foreground">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  )
}
