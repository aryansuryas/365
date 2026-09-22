import { SITE_NAME } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 py-5">
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}
      </p>
    </footer>
  )
}
