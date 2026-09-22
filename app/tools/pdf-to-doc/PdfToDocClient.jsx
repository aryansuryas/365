'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { Upload, X, GripVertical, Download, Loader2, FileOutput, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { fadeUp, stagger } from '@/lib/motion'

let pdfjsPromise = null
async function getPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('pdfjs-dist').then((mod) => {
      mod.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
      return mod
    })
  }
  return pdfjsPromise
}

function humanBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

// Groups a PDF page's text items into lines by y-position, top to bottom, left to right.
async function extractPages(file) {
  const pdfjs = await getPdfjs()
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pages = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const items = [...content.items].sort(
      (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4]
    )

    const lines = []
    let currentY = null
    let currentLine = []
    for (const item of items) {
      const y = Math.round(item.transform[5])
      if (currentY === null || Math.abs(y - currentY) < 3) {
        currentLine.push(item.str)
        currentY = currentY ?? y
      } else {
        if (currentLine.length) lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim())
        currentLine = [item.str]
        currentY = y
      }
    }
    if (currentLine.length) lines.push(currentLine.join(' ').replace(/\s+/g, ' ').trim())
    pages.push(lines.filter(Boolean))
  }
  return pages
}

async function buildDocx(pages, title) {
  const children = []
  pages.forEach((lines, pageIndex) => {
    if (lines.length === 0) {
      children.push(new Paragraph({ pageBreakBefore: pageIndex > 0 }))
      return
    }
    lines.forEach((line, lineIndex) => {
      children.push(
        new Paragraph({
          children: [new TextRun(line)],
          pageBreakBefore: pageIndex > 0 && lineIndex === 0,
        })
      )
    })
  })

  const doc = new Document({
    title,
    sections: [{ children: children.length ? children : [new Paragraph('')] }],
  })
  return Packer.toBlob(doc)
}

function PdfRow({ item, index, onRemove }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-4 overflow-hidden bg-card px-5 py-3"
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        aria-label="Drag to reorder"
        className="touch-none text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 cursor-grab" />
      </button>
      <span className="w-6 shrink-0 text-xs text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
        <FileOutput className="h-4 w-4" strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{item.name}</p>
        <p className="text-xs text-muted-foreground">{humanBytes(item.size)}</p>
      </div>
      <button onClick={() => onRemove(item.id)} className="text-muted-foreground transition hover:text-destructive">
        <X className="h-4 w-4" />
      </button>
    </Reorder.Item>
  )
}

export function PdfToDocClient() {
  const [items, setItems] = useState([]) // { id, file, name, size }
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const totalBytes = useMemo(() => items.reduce((s, i) => s + i.file.size, 0), [items])

  const addFiles = useCallback((files) => {
    const list = Array.from(files).filter((f) => f.type === 'application/pdf' || /\.pdf$/i.test(f.name))
    if (list.length === 0) {
      toast.error('Please add .pdf files.')
      return
    }
    const mapped = list.map((f) => ({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size }))
    setItems((prev) => [...prev, ...mapped])
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const remove = (id) => setItems((prev) => prev.filter((p) => p.id !== id))

  const convertOne = async (file) => {
    const pages = await extractPages(file)
    const title = file.name.replace(/\.pdf$/i, '')
    return buildDocx(pages, title)
  }

  const convert = async () => {
    if (items.length === 0) return
    setBusy(true)
    try {
      if (items.length === 1) {
        const blob = await convertOne(items[0].file)
        downloadBlob(blob, `${items[0].name.replace(/\.pdf$/i, '')}.docx`)
      } else {
        const zip = new JSZip()
        for (const item of items) {
          const blob = await convertOne(item.file)
          zip.file(`${item.name.replace(/\.pdf$/i, '')}.docx`, blob)
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        downloadBlob(zipBlob, `converthub-docs-${Date.now()}.zip`)
      }
      toast.success(`Converted ${items.length} PDF${items.length > 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error('Conversion failed. Scanned or encrypted PDFs aren\u2019t supported yet.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 lg:pb-12">
      <motion.div initial="hidden" animate="show" variants={stagger(0.03, 0.08)} className="mb-10">
        <motion.h1 variants={fadeUp} className="font-serif-display text-4xl sm:text-5xl">
          PDF to Document
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 max-w-2xl text-muted-foreground">
          Pull the text out of a PDF and rebuild it as an editable .docx file.
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 px-6 py-16 text-center transition hover:border-primary/50 hover:bg-card"
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-primary transition group-hover:scale-105">
              <Upload className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <p className="font-serif-display text-xl">Drop PDF files here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to choose from your device</p>
            <p className="mt-4 text-xs text-muted-foreground">PDF — any number of files</p>
          </div>

          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden rounded-2xl border border-border bg-card paper-edge"
              >
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <FileOutput className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {items.length} PDF{items.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-muted-foreground">— {humanBytes(totalBytes)}</span>
                  </div>
                  <button
                    onClick={() => setItems([])}
                    className="text-xs text-muted-foreground transition hover:text-destructive"
                  >
                    Clear all
                  </button>
                </div>
                <Reorder.Group axis="y" values={items} onReorder={setItems} className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <PdfRow key={item.id} item={item} index={i} onRemove={remove} />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 paper-edge">
            <div className="mb-3 flex items-center gap-2 text-sm text-foreground">
              <Info className="h-4 w-4 text-muted-foreground" />
              What carries over
            </div>
            <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <li>Text content, line by line, with page breaks kept</li>
              <li>Works best on PDFs that were exported from a document, not scanned</li>
              <li>Fonts, images, and multi-column layouts aren't reconstructed yet</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 paper-edge">
            <Button onClick={convert} disabled={busy || items.length === 0} size="lg" className="h-11 w-full rounded-full">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Converting…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Convert & Download
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">Nothing leaves your device</p>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-md lg:hidden">
        <Button onClick={convert} disabled={busy || items.length === 0} size="lg" className="h-11 w-full rounded-full">
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Converting…
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Convert & Download{items.length > 0 ? ` (${items.length})` : ''}
            </>
          )}
        </Button>
      </div>
    </main>
  )
}
