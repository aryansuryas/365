'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { PDFDocument, PageSizes } from 'pdf-lib'
import { toast } from 'sonner'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import { Upload, X, GripVertical, Download, Loader2, Plus, Settings2 } from 'lucide-react'
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
      <img
        src={item.url}
        alt={item.name}
        className="h-9 w-9 shrink-0 rounded-lg border border-border object-cover"
      />
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

export function ImageToPdfClient() {
  const [items, setItems] = useState([])
  const [pageSize, setPageSize] = useState('A4')
  const [fitToImage, setFitToImage] = useState(false)
  const [compress, setCompress] = useState(false)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
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
    setDragging(false)
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
          pageW = imgW; pageH = imgH
        } else {
          ;[pageW, pageH] = PAGE_SIZE_MAP[pageSize]
          if (imgW > imgH) ;[pageW, pageH] = [pageH, pageW]
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

  const hasFiles = items.length > 0

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
        <h1 className="font-serif-display text-3xl sm:text-4xl">Image to PDF</h1>
      </motion.div>

      <div className="space-y-3">
        {/* Drop zone — files live inside */}
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
            accept="image/*"
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
                <p className="font-medium text-foreground">Drop images here</p>
                <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
              </motion.div>
            ) : (
              <motion.div key="files" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* File list */}
                <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
                  <AnimatePresence initial={false}>
                    {items.map((item, i) => (
                      <ImageRow key={item.id} item={item} index={i} onRemove={remove} />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>

                {/* Add more strip */}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add more images
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Options */}
        <AnimatePresence>
          {hasFiles && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-medium">Options</span>
                <span className="ml-auto text-xs text-muted-foreground">{items.length} image{items.length > 1 ? 's' : ''} · {humanBytes(totalBytes)}</span>
                <button
                  onClick={() => { items.forEach((i) => URL.revokeObjectURL(i.url)); setItems([]) }}
                  className="text-xs text-muted-foreground transition hover:text-destructive"
                >
                  Clear
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-3">
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">Page size</Label>
                  <Select value={pageSize} onValueChange={setPageSize} disabled={fitToImage}>
                    <SelectTrigger className="h-8 text-sm">
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
                  <Label className="text-sm">Fit to image</Label>
                  <Switch checked={fitToImage} onCheckedChange={setFitToImage} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Compress</Label>
                  <Switch checked={compress} onCheckedChange={setCompress} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Convert button */}
        <AnimatePresence>
          {hasFiles && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Button
                onClick={convert}
                disabled={busy}
                size="lg"
                className="h-12 w-full rounded-2xl text-base font-semibold"
              >
                {busy ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting… {progress > 0 && `${progress}%`}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Convert & Download
                  </>
                )}
              </Button>
              {busy && (
                <Progress value={progress} className="mt-2 h-1 rounded-full" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
