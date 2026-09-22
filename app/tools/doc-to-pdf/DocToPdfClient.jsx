'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import mammoth from 'mammoth'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { Upload, X, GripVertical, Download, Loader2, FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildTextPdf } from '@/lib/text-pdf'

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
    }
  }
  walk(doc.body)
  return blocks
}

function DocRow({ item, onRemove }) {
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
        <FileText className="h-4 w-4" strokeWidth={1.6} />
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

export function DocToPdfClient() {
  const [items, setItems] = useState([])
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const totalBytes = useMemo(() => items.reduce((s, i) => s + i.file.size, 0), [items])

  const addFiles = useCallback((files) => {
    const list = Array.from(files).filter(
      (f) =>
        /\.docx$/i.test(f.name) ||
        f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
    if (list.length === 0) {
      toast.error('Please add .docx files.')
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

  const hasFiles = items.length > 0

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
        <h1 className="font-serif-display text-3xl sm:text-4xl">Document to PDF</h1>
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
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
                <p className="font-medium text-foreground">Drop .docx files here</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              </motion.div>
            ) : (
              <motion.div key="files" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <DocRow key={item.id} item={item} onRemove={remove} />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add more documents
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
