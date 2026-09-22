'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { Upload, X, GripVertical, Download, Loader2, FileOutput, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

function PdfRow({ item, onRemove }) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2"
    >
      <button
        onPointerDown={(e) => controls.start(e)}
        className="touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5 cursor-grab" />
      </button>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-primary">
        <FileOutput className="h-4 w-4" strokeWidth={1.6} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">{humanBytes(item.size)}</p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </Reorder.Item>
  )
}

export function PdfToDocClient() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
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
    setDragging(false)
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

  const hasFiles = items.length > 0

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
        <h1 className="font-serif-display text-3xl sm:text-4xl">PDF to Document</h1>
      </motion.div>

      <div className="space-y-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          className={`rounded-2xl border-2 border-dashed transition-all ${
            dragging ? 'drop-zone-active' : 'border-border'
          } ${hasFiles ? 'bg-card p-4' : 'cursor-pointer bg-card/50 hover:border-primary/50 hover:bg-card'}`}
          onClick={!hasFiles ? () => inputRef.current?.click() : undefined}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={(e) => e.target.files && addFiles(e.target.files)}
            className="hidden"
          />

          <AnimatePresence mode="wait">
            {!hasFiles ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-14 text-center"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-primary">
                  <Upload className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <p className="font-medium text-foreground">Drop PDF files here</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              </motion.div>
            ) : (
              <motion.div key="files" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <PdfRow key={item.id} item={item} onRemove={remove} />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add more PDFs
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {hasFiles && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-xs text-muted-foreground">{items.length} file{items.length > 1 ? 's' : ''} · {humanBytes(totalBytes)}</span>
                <button onClick={() => setItems([])} className="text-xs text-muted-foreground transition hover:text-destructive">Clear all</button>
              </div>
              <Button onClick={convert} disabled={busy} size="lg" className="h-12 w-full rounded-2xl text-base font-semibold">
                {busy ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Converting…</>
                ) : (
                  <><Download className="mr-2 h-4 w-4" />Convert & Download</>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
