'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import mammoth from 'mammoth'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { Upload, X, GripVertical, Download, Loader2, FileText, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildTextPdf } from '@/lib/text-pdf'
import { fadeUp, stagger } from '@/lib/motion'

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

// Turns mammoth's HTML output into simple styled blocks a PDF renderer can lay out.
function htmlToBlocks(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const blocks = []
  const walk = (el) => {
    for (const child of Array.from(el.children)) {
      const tag = child.tagName.toLowerCase()
      if (/^h[1-6]$/.test(tag)) {
        const text = child.textContent.trim()
        if (text) blocks.push({ type: tag, text })
      } else if (tag === 'p') {
        const text = child.textContent.trim()
        if (text) blocks.push({ type: 'p', text })
      } else if (tag === 'ul' || tag === 'ol') {
        for (const li of Array.from(child.children)) {
          const text = li.textContent.trim()
          if (text) blocks.push({ type: 'li', text })
        }
      } else if (tag === 'blockquote' || tag === 'div' || tag === 'section') {
        walk(child)
      }
      // tables and images aren't carried over in this first pass
    }
  }
  walk(doc.body)
  return blocks
}

function DocRow({ item, index, onRemove }) {
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
        <FileText className="h-4 w-4" strokeWidth={1.6} />
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

export function DocToPdfClient() {
  const [items, setItems] = useState([]) // { id, file, name, size }
  const [busy, setBusy] = useState(false)
  const inputRef = useRef(null)

  const totalBytes = useMemo(() => items.reduce((s, i) => s + i.file.size, 0), [items])

  const addFiles = useCallback((files) => {
    const list = Array.from(files).filter(
      (f) =>
        /\.docx$/i.test(f.name) ||
        f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    if (list.length === 0) {
      toast.error('Please add .docx files — legacy .doc isn\u2019t supported yet.')
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
    const arrayBuffer = await file.arrayBuffer()
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer })
    const blocks = htmlToBlocks(html)
    const title = file.name.replace(/\.docx$/i, '')
    return buildTextPdf(blocks, { title })
  }

  const convert = async () => {
    if (items.length === 0) return
    setBusy(true)
    try {
      if (items.length === 1) {
        const bytes = await convertOne(items[0].file)
        const blob = new Blob([bytes], { type: 'application/pdf' })
        downloadBlob(blob, `${items[0].name.replace(/\.docx$/i, '')}.pdf`)
      } else {
        const zip = new JSZip()
        for (const item of items) {
          const bytes = await convertOne(item.file)
          zip.file(`${item.name.replace(/\.docx$/i, '')}.pdf`, bytes)
        }
        const blob = await zip.generateAsync({ type: 'blob' })
        downloadBlob(blob, `converthub-pdfs-${Date.now()}.zip`)
      }
      toast.success(`Converted ${items.length} document${items.length > 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error('Conversion failed. Check the file is a valid .docx.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 lg:pb-12">
      <motion.div initial="hidden" animate="show" variants={stagger(0.03, 0.08)} className="mb-10">
        <motion.h1 variants={fadeUp} className="font-serif-display text-4xl sm:text-5xl">
          Document to PDF
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 max-w-2xl text-muted-foreground">
          Drop in .docx files, get clean PDFs back — headings, paragraphs, and lists intact.
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
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-primary transition group-hover:scale-105">
              <Upload className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <p className="font-serif-display text-xl">Drop .docx files here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to choose from your device</p>
            <p className="mt-4 text-xs text-muted-foreground">Word .docx — any number of files</p>
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
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {items.length} document{items.length > 1 ? 's' : ''}
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
                      <DocRow key={item.id} item={item} index={i} onRemove={remove} />
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
              <li>Headings, paragraphs, and bullet or numbered lists</li>
              <li>Automatic pagination as content grows</li>
              <li>Tables, images, and inline bold/italic aren't carried over yet</li>
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
