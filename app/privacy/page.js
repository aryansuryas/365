import { ShieldCheck } from 'lucide-react'
import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'

export const metadata = {
  title: 'Privacy & Security — ConvertHub',
  description: 'How ConvertHub handles your files and data — processed locally, nothing uploaded, no accounts.',
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader variant="tool" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary">
          <ShieldCheck className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <h1 className="font-serif-display text-4xl">Privacy & security</h1>
        <p className="mt-4 text-muted-foreground">
          Last updated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 font-serif-display text-xl text-foreground">Your files never leave your device</h2>
            <p>
              Every tool on ConvertHub — Image to PDF, Document to PDF, PDF to Document, QR Generator, and the
              ones still in progress — runs entirely in your browser using JavaScript. Files you drop into a tool
              are processed locally and are never uploaded, stored, or transmitted to a server.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-serif-display text-xl text-foreground">What we collect</h2>
            <p>
              Nothing. There's no backend, no database, and no usage logging. ConvertHub doesn't know a
              conversion happened, let alone what was in it.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-serif-display text-xl text-foreground">No accounts, no tracking cookies</h2>
            <p>
              ConvertHub doesn't require sign-up, doesn't set tracking cookies, and doesn't run third-party
              analytics or ad scripts. It's free and open — use it as much as you want, with nothing to opt out
              of because nothing is being tracked.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-serif-display text-xl text-foreground">Questions</h2>
            <p>Reach out any time — contact details are on the homepage.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
