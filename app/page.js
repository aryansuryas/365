'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ImageIcon, QrCode, FileText, FileOutput, Award, NotebookPen, ArrowUpRight } from 'lucide-react'
import { SiteHeader } from '@/components/site/header'
import { SiteFooter } from '@/components/site/footer'
import { fadeUp, stagger } from '@/lib/motion'

const tools = [
  {
    slug: 'image-to-pdf',
    name: 'Image to PDF',
    ready: true,
    href: '/tools/image-to-pdf',
    description: 'Bind images into a single ordered PDF.',
    icon: ImageIcon,
  },
  {
    slug: 'qr-generator',
    name: 'QR Generator',
    ready: true,
    href: '/tools/qr-generator',
    description: 'Turn links or text into QR codes instantly.',
    icon: QrCode,
  },
  {
    slug: 'doc-to-pdf',
    name: 'Document to PDF',
    ready: true,
    href: '/tools/doc-to-pdf',
    description: 'Convert .docx files into clean PDFs.',
    icon: FileText,
  },
  {
    slug: 'pdf-to-doc',
    name: 'PDF to Document',
    ready: true,
    href: '/tools/pdf-to-doc',
    description: 'Extract PDF text into an editable .docx.',
    icon: FileOutput,
  },
  {
    slug: 'certificates',
    name: 'Certificates',
    ready: false,
    href: '#',
    description: 'Personalize and send certificates in bulk.',
    icon: Award,
  },
  {
    slug: 'notebook-to-pdf',
    name: 'Notebook to PDF',
    ready: false,
    href: '#',
    description: 'Render .ipynb notebooks as paginated PDFs.',
    icon: NotebookPen,
  },
]

function ToolCard({ tool }) {
  const Icon = tool.icon
  const content = (
    <div
      className={`group flex h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 ${
        tool.ready ? 'card-hover cursor-pointer' : 'opacity-50'
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-primary">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.6} />
        </div>
        {tool.ready && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background transition-all duration-200 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="mt-6">
        <h3 className="font-serif-display text-lg leading-tight text-foreground">{tool.name}</h3>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
      </div>
    </div>
  )

  if (!tool.ready) return <motion.div variants={fadeUp}>{content}</motion.div>
  return (
    <motion.div variants={fadeUp}>
      <Link href={tool.href}>{content}</Link>
    </motion.div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="home" />

      <motion.section
        initial="hidden"
        animate="show"
        variants={stagger(0.05, 0.09)}
        className="mx-auto max-w-6xl px-6 pt-20 pb-14"
      >
        <div className="max-w-xl">
          <motion.h1
            variants={fadeUp}
            className="font-serif-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl"
          >
            Everyday file tools.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-base text-muted-foreground sm:text-lg">
            Convert, generate, and transform — all in your browser. Nothing leaves your device.
          </motion.p>
        </div>
      </motion.section>

      <motion.section
        id="tools"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger(0.02, 0.07)}
        className="mx-auto max-w-6xl px-6 pb-24"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </motion.section>

      <SiteFooter />
    </div>
  )
}
