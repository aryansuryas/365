'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ImageIcon,
  QrCode,
  FileText,
  FileOutput,
  Award,
  NotebookPen,
  ArrowUpRight,
  ShieldCheck,
  Mail,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'
import { AvatarBadge } from '@/components/site/avatar-badge'
import { MAKER } from '@/lib/site'
import { fadeUp, stagger } from '@/lib/motion'

const tools = [
  {
    slug: 'image-to-pdf',
    name: 'Image to PDF',
    tag: 'Ready',
    ready: true,
    href: '/tools/image-to-pdf',
    description: 'Bind JPG, PNG, or WebP images into a single, ordered PDF.',
    icon: ImageIcon,
    hint: 'Drag to reorder, pick a page size, done.',
  },
  {
    slug: 'qr-generator',
    name: 'QR Generator',
    tag: 'Ready',
    ready: true,
    href: '/tools/qr-generator',
    description: 'Turn text, links, or a whole list of URLs into QR codes.',
    icon: QrCode,
    hint: 'Batch export as PNG or SVG, styled your way.',
  },
  {
    slug: 'doc-to-pdf',
    name: 'Document to PDF',
    tag: 'Ready',
    ready: true,
    href: '/tools/doc-to-pdf',
    description: 'Turn .docx files into clean PDFs — headings, paragraphs, lists intact.',
    icon: FileText,
    hint: 'Batch convert, or zip several at once.',
  },
  {
    slug: 'pdf-to-doc',
    name: 'PDF to Document',
    tag: 'Ready',
    ready: true,
    href: '/tools/pdf-to-doc',
    description: 'Pull the text out of a PDF and rebuild it as an editable .docx.',
    icon: FileOutput,
    hint: 'Works best on text-based PDFs, not scans.',
  },
  {
    slug: 'certificates',
    name: 'Certificates + Email',
    tag: 'Soon',
    ready: false,
    href: '#',
    description: 'Design one certificate, personalize it for a whole list.',
    icon: Award,
    hint: 'Upload a CSV, preview, then email every recipient.',
  },
  {
    slug: 'notebook-to-pdf',
    name: 'Notebook to PDF',
    tag: 'Soon',
    ready: false,
    href: '#',
    description: 'Render .ipynb files as paginated PDFs — code and output alike.',
    icon: NotebookPen,
    hint: 'Syntax highlighting and plots preserved.',
  },
]

function ToolCard({ tool }) {
  const Icon = tool.icon
  const content = (
    <div
      className={`flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-6 paper-edge ${
        tool.ready ? 'card-hover cursor-pointer' : 'opacity-60'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-primary">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </div>
        <Badge
          variant="outline"
          className={`rounded-full px-2.5 text-[11px] font-medium ${
            tool.ready
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border text-muted-foreground'
          }`}
        >
          {tool.tag}
        </Badge>
      </div>

      <div className="mt-7">
        <h3 className="font-serif-display text-2xl leading-tight text-foreground">{tool.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.description}</p>
      </div>

      <div className="mt-6 flex items-end justify-between gap-3">
        <p className="text-xs leading-snug text-muted-foreground/80">{tool.hint}</p>
        {tool.ready && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors duration-300 group-hover:border-primary">
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.6} />
          </div>
        )}
      </div>
    </div>
  )

  if (!tool.ready) return <motion.div variants={fadeUp}>{content}</motion.div>
  return (
    <motion.div variants={fadeUp} className="group">
      <Link href={tool.href}>{content}</Link>
    </motion.div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="home" />

      {/* Hero — one orchestrated entrance, CTA visible without scrolling */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={stagger(0.05, 0.09)}
        className="mx-auto max-w-6xl px-6 pt-20 pb-16"
      >
        <div className="max-w-2xl">
          <motion.h1
            variants={fadeUp}
            className="font-serif-display text-5xl leading-[1.08] tracking-tight text-foreground sm:text-6xl"
          >
            A small toolkit for everyday files.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Convert images and documents, generate QR codes — all in your browser.
            Nothing you upload ever leaves your device.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-11 rounded-full px-6">
              <Link href="/tools/image-to-pdf">Try Image to PDF</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 rounded-full px-6">
              <Link href="/tools/qr-generator">Generate a QR</Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Tools grid — reveals once, together */}
      <motion.section
        id="tools"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger(0.02, 0.07)}
        className="mx-auto max-w-6xl px-6 pb-24"
      >
        <motion.h2 variants={fadeUp} className="mb-8 font-serif-display text-3xl sm:text-4xl">
          The toolkit
        </motion.h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </motion.section>

      {/* About — short trust note + a real spot for the maker's details */}
      <section id="about" className="border-t border-border bg-card/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2">
          <div>
            <h3 className="font-serif-display text-2xl">Built for the quiet moments.</h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
              No sign-up walls, no newsletter modals — just tools that do one thing well.
            </p>
            <Link
              href="/privacy"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary transition hover:underline"
            >
              <ShieldCheck className="h-4 w-4" />
              How your files stay private
            </Link>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 paper-edge">
            <AvatarBadge initials={MAKER.initials} href={MAKER.portfolio} label={`Made by ${MAKER.name}`} />
            <div className="min-w-0">
              <p className="font-serif-display text-lg leading-tight">{MAKER.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">Built and maintained this toolkit.</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                <a
                  href={MAKER.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary transition hover:underline"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  Portfolio
                </a>
                <a
                  href={`mailto:${MAKER.email}`}
                  className="inline-flex items-center gap-1.5 text-muted-foreground transition hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" />
                  {MAKER.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
