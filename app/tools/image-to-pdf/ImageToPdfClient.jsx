'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { PDFDocument, PageSizes } from 'pdf-lib'
import { toast } from 'sonner'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import {
  Upload,
  X,
  GripVertical,
  Download,
  Loader2,
  FileImage,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { fadeUp, stagger } from '@/lib/motion'

const PAGE_SIZE_MAP = {
  A4: PageSizes.A4,
  Letter: PageSizes.Letter,
  Legal: PageSizes.Legal,
}

function humanBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

async function fileToArrayBuffer(file) {
  return await file.arrayBuffer()
}

async function imageBitmapFromFile(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    return img
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }
}

// Ensure image is decoded to JPEG/PNG bytes (handles webp / heic by re-encoding via canvas)
async function normalizeImageBytes(file, compress) {
  const type = file.type
  if ((type === 'image/jpeg' || type === 'image/png') && !compress) {
    const buf = await fileToArrayBuffer(file)
    return { bytes: new Uint8Array(buf), format: type === 'image/jpeg' ? 'jpg' : 'png' }
  }
  const img = await imageBitmapFromFile(file)
  const canvas = document.createElement('canvas')
  const maxDim = compress ? 1600 : 3200
  let { width, height } = img
  if (Math.max(width, height) > maxDim) {
    const scale = maxDim / Math.max(width, height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0, width, height)
  const quality = compress ? 0.7 : 0.92
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', quality))
  const buf = await blob.arrayBuffer()
  return { bytes: new Uint8Array(buf), format: 'jpg' }
}

function ImageRow({ item, index, onRemove }) {
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
      <img
        src={item.url}
        alt={item.name}
        className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
      />
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

export function ImageToPdfClient() {
  const [items, setItems] = useState([]) // { id, file, url, name, size }
  const [pageSize, setPageSize] = useState('A4')
  const [fitToImage, setFitToImage] = useState(false)
  const [compress, setCompress] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef(null)

  const totalBytes = useMemo(() => items.reduce((s, i) => s + i.file.size, 0), [items])

  const addFiles = useCallback((files) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'))
    if (list.length === 0) {
      toast.error('Please add image files (JPG, PNG, WebP).')
      return
    }
    const mapped = list.map((f) => ({
      id: crypto.randomUUID(),
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
    }))
    setItems((prev) => [...prev, ...mapped])
  }, [])

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files)
  }

  const remove = (id) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === id)
      if (found) URL.revokeObjectURL(found.url)
      return prev.filter((p) => p.id !== id)
    })
  }

  const convert = async () => {
    if (items.length === 0) return
    setBusy(true)
    setProgress(0)
    try {
      const pdfDoc = await PDFDocument.create()
      pdfDoc.setTitle('ConvertHub Image PDF')
      pdfDoc.setCreator('ConvertHub')

      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const { bytes, format } = await normalizeImageBytes(item.file, compress)
        const embedded = format === 'jpg' ? await pdfDoc.embedJpg(bytes) : await pdfDoc.embedPng(bytes)

        const imgW = embedded.width
        const imgH = embedded.height

        let pageW, pageH
        if (fitToImage) {
          pageW = imgW
          pageH = imgH
        } else {
          ;[pageW, pageH] = PAGE_SIZE_MAP[pageSize]
          if (imgW > imgH) {
            ;[pageW, pageH] = [pageH, pageW]
          }
        }

        const page = pdfDoc.addPage([pageW, pageH])
        const margin = fitToImage ? 0 : 24
        const availW = pageW - margin * 2
        const availH = pageH - margin * 2
        const scale = Math.min(availW / imgW, availH / imgH)
        const drawW = imgW * scale
        const drawH = imgH * scale
        const x = (pageW - drawW) / 2
        const y = (pageH - drawH) / 2
        page.drawImage(embedded, { x, y, width: drawW, height: drawH })

        setProgress(Math.round(((i + 1) / items.length) * 100))
      }

      const bytes = await pdfDoc.save()
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `converthub-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)

      toast.success(`PDF ready — ${items.length} page${items.length > 1 ? 's' : ''}`)
    } catch (err) {
      console.error(err)
      toast.error('Conversion failed. Try smaller images.')
    } finally {
      setBusy(false)
      setTimeout(() => setProgress(0), 800)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 lg:pb-12">
      <motion.div initial="hidden" animate="show" variants={stagger(0.03, 0.08)} className="mb-10">
        <motion.h1 variants={fadeUp} className="font-serif-display text-4xl sm:text-5xl">
          Image to PDF
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 max-w-2xl text-muted-foreground">
          Drop images, drag to reorder, export one clean PDF — nothing leaves your browser.
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
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              className="hidden"
            />
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-primary transition group-hover:scale-105">
              <Upload className="h-6 w-6" strokeWidth={1.6} />
            </div>
            <p className="font-serif-display text-xl">Drop images here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to choose from your device</p>
            <p className="mt-4 text-xs text-muted-foreground">JPG, PNG, or WebP — any number of files</p>
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
                    <FileImage className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {items.length} image{items.length > 1 ? 's' : ''}
                    </span>
                    <span className="text-muted-foreground">— {humanBytes(totalBytes)}</span>
                  </div>
                  <button
                    onClick={() => {
                      items.forEach((i) => URL.revokeObjectURL(i.url))
                      setItems([])
                    }}
                    className="text-xs text-muted-foreground transition hover:text-destructive"
                  >
                    Clear all
                  </button>
                </div>
                <Reorder.Group axis="y" values={items} onReorder={setItems} className="divide-y divide-border">
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <ImageRow key={item.id} item={item} index={i} onRemove={remove} />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 paper-edge">
            <div className="mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-serif-display text-lg">Options</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Page size</Label>
                <Select value={pageSize} onValueChange={setPageSize} disabled={fitToImage}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Fit page to image</Label>
                  <p className="text-xs text-muted-foreground">No margins, exact dimensions</p>
                </div>
                <Switch checked={fitToImage} onCheckedChange={setFitToImage} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Compress</Label>
                  <p className="text-xs text-muted-foreground">Smaller file, slight quality loss</p>
                </div>
                <Switch checked={compress} onCheckedChange={setCompress} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 paper-edge">
            <Button onClick={convert} disabled={busy || items.length === 0} size="lg" className="h-11 w-full rounded-full">
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Composing PDF…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Convert & Download
                </>
              )}
            </Button>
            <AnimatePresence>
              {busy && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Progress value={progress} className="mt-3 h-1" />
                </motion.div>
              )}
            </AnimatePresence>
            <p className="mt-3 text-center text-xs text-muted-foreground">Nothing leaves your device</p>
          </div>
        </aside>
      </div>

      {/* Sticky mobile CTA — the sidebar button above is out of view while scrolling on small screens */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-md lg:hidden">
        <Button onClick={convert} disabled={busy || items.length === 0} size="lg" className="h-11 w-full rounded-full">
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Composing…
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
