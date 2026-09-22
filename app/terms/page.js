import { FileText } from 'lucide-react'
import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'

export const metadata = {
  title: 'Terms of Use — ConvertHub',
  description: "The terms for using ConvertHub's free conversion tools.",
}

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader variant="tool" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
        <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-primary">
          <FileText className="h-6 w-6" strokeWidth={1.6} />
        </div>
        <h1 className="font-serif-display text-4xl">Terms of use</h1>
        <p className="mt-4 text-muted-foreground">
          Last updated {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 font-serif-display text-xl text-foreground">Using ConvertHub</h2>
            <p>
              ConvertHub's tools are free to use for personal and commercial work. You're responsible for the files
              you convert and for having the right to use their content.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-serif-display text-xl text-foreground">No warranty</h2>
            <p>
              These tools are provided as-is, without warranty of any kind. While we aim for accurate conversions,
              keep a copy of your original files and double-check important output before relying on it.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-serif-display text-xl text-foreground">Fair use</h2>
            <p>Please don't use ConvertHub to process content that's illegal, infringing, or intended to harm others.</p>
          </section>
          <section>
            <h2 className="mb-2 font-serif-display text-xl text-foreground">Changes</h2>
            <p>These terms may be updated as tools are added. Continued use after a change means you accept the update.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
