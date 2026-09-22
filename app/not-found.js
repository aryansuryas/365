import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'

export const metadata = {
  title: 'Page not found — ConvertHub',
}

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader variant="tool" />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-primary">
          <Compass className="h-7 w-7" strokeWidth={1.6} />
        </div>
        <h1 className="font-serif-display text-4xl">This page wandered off.</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          The link may be old, or the page never existed. Let's get you back to the tools.
        </p>
        <Button asChild size="lg" className="mt-8 h-11 rounded-full px-6">
          <Link href="/">Back to ConvertHub</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  )
}
