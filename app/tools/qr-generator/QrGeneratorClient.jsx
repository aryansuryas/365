'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode/lib/browser'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QrCode,
  Loader2,
  Palette,
  FileText,
  FileImage,
  Archive,
  Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { fadeUp, stagger } from '@/lib/motion'

async function makeDataUrl(text, opts) {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(
      text,
      {
        errorCorrectionLevel: opts.ecl,
        margin: 2,
        width: 512,
        color: { dark: opts.fg, light: opts.bg },
      },
      (err, url) => {
        if (err) reject(err)
        else resolve(url)
      }
    )
  })
}

async function makeSvg(text, opts) {
  return new Promise((resolve, reject) => {
    QRCode.toString(
      text,
      {
        type: 'svg',
        errorCorrectionLevel: opts.ecl,
        margin: 2,
        color: { dark: opts.fg, light: opts.bg },
      },
      (err, str) => {
        if (err) reject(err)
        else resolve(str)
      }
    )
  })
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

function dataUrlToBlob(dataUrl) {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/data:([^;]+)/)[1]
  const bin = atob(base64)
  const u8 = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  return new Blob([u8], { type: mime })
}

function slug(s, i) {
  const base = s.replace(/https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 40) || `qr-${i + 1}`
  return `${String(i + 1).padStart(3, '0')}-${base}`
}

const PALETTES = [
  { fg: '#2b1a12', bg: '#f7f1e4', label: 'Paper' },
  { fg: '#ffffff', bg: '#0d0a08', label: 'Ink' },
  { fg: '#7a1f2b', bg: '#fbf1e6', label: 'Seal' },
  { fg: '#0f5c52', bg: '#eaf5f0', label: 'Moss' },
]

export function QrGeneratorClient() {
  const [mode, setMode] = useState('single')
  const [text, setText] = useState('https://converthub.local')
  const [batchText, setBatchText] = useState('https://vercel.com\nhttps://linear.app\nhttps://notion.so')
  const [fg, setFg] = useState(PALETTES[0].fg)
  const [bg, setBg] = useState(PALETTES[0].bg)
  const [ecl, setEcl] = useState('M')
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)

  const currentText = mode === 'single' ? text : batchText.split('\n').find((l) => l.trim()) || ''

  useEffect(() => {
    if (!currentText) {
      setPreview('')
      return
    }
    let cancelled = false
    makeDataUrl(currentText, { fg, bg, ecl })
      .then((url) => {
        if (!cancelled) setPreview(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [currentText, fg, bg, ecl])

  const batchLines = useMemo(() => batchText.split('\n').map((l) => l.trim()).filter(Boolean), [batchText])

  const downloadPng = async () => {
    if (!currentText) return
    setBusy(true)
    try {
      const url = await makeDataUrl(currentText, { fg, bg, ecl })
      const blob = dataUrlToBlob(url)
      downloadBlob(blob, `qr-${Date.now()}.png`)
      toast.success('PNG saved')
    } catch (e) {
      toast.error('Could not generate PNG')
    } finally {
      setBusy(false)
    }
  }

  const downloadSvg = async () => {
    if (!currentText) return
    setBusy(true)
    try {
      const svg = await makeSvg(currentText, { fg, bg, ecl })
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      downloadBlob(blob, `qr-${Date.now()}.svg`)
      toast.success('SVG saved')
    } catch (e) {
      toast.error('Could not generate SVG')
    } finally {
      setBusy(false)
    }
  }

  const downloadBatch = async (format) => {
    if (batchLines.length === 0) {
      toast.error('Add some lines first')
      return
    }
    setBusy(true)
    try {
      const zip = new JSZip()
      for (let i = 0; i < batchLines.length; i++) {
        const line = batchLines[i]
        const name = slug(line, i)
        if (format === 'png') {
          const url = await makeDataUrl(line, { fg, bg, ecl })
          const blob = dataUrlToBlob(url)
          zip.file(`${name}.png`, blob)
        } else {
          const svg = await makeSvg(line, { fg, bg, ecl })
          zip.file(`${name}.svg`, svg)
        }
      }
      const csv =
        'index,value,filename\n' +
        batchLines.map((l, i) => `${i + 1},"${l.replace(/"/g, '""')}",${slug(l, i)}.${format}`).join('\n')
      zip.file('index.csv', csv)

      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, `qr-batch-${Date.now()}.zip`)
      toast.success(`Zipped ${batchLines.length} QR codes`)
    } catch (e) {
      console.error(e)
      toast.error('Batch failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12 pb-28 lg:pb-12">
      <motion.div initial="hidden" animate="show" variants={stagger(0.03, 0.08)} className="mb-10">
        <motion.h1 variants={fadeUp} className="font-serif-display text-4xl sm:text-5xl">
          QR Generator
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-3 max-w-2xl text-muted-foreground">
          A single link, or a whole list — preview lives, download as PNG, SVG, or a zip.
        </motion.p>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="h-10 rounded-full bg-card p-1">
              <TabsTrigger value="single" className="rounded-full px-5">
                Single
              </TabsTrigger>
              <TabsTrigger value="batch" className="rounded-full px-5">
                Batch
              </TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-5 paper-edge">
                <Label className="mb-2 block text-sm">Text or URL</Label>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="https://example.com"
                  className="min-h-[120px] resize-none"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={downloadPng} disabled={busy || !text}>
                    {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileImage className="mr-2 h-3.5 w-3.5" />}
                    PNG
                  </Button>
                  <Button size="sm" variant="outline" onClick={downloadSvg} disabled={busy || !text}>
                    <FileText className="mr-2 h-3.5 w-3.5" />
                    SVG
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="batch" className="mt-6">
              <div className="rounded-2xl border border-border bg-card p-5 paper-edge">
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm">One URL or line of text per row</Label>
                  <span className="text-xs text-muted-foreground">{batchLines.length} entries</span>
                </div>
                <Textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder={'https://example.com\nhello world\nhttps://another.link'}
                  className="min-h-[200px] resize-none font-mono text-sm"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => downloadBatch('png')} disabled={busy || batchLines.length === 0}>
                    {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Archive className="mr-2 h-3.5 w-3.5" />}
                    Download PNG zip
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => downloadBatch('svg')} disabled={busy || batchLines.length === 0}>
                    <Archive className="mr-2 h-3.5 w-3.5" />
                    Download SVG zip
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 paper-edge">
            <h3 className="font-serif-display text-lg">Preview</h3>
            <div className="relative mt-4 flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
              <AnimatePresence mode="wait">
                {preview ? (
                  <motion.img
                    key={preview}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    src={preview}
                    alt="QR preview"
                    className="h-full w-full object-contain p-4"
                  />
                ) : (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <QrCode className="h-16 w-16 text-muted-foreground/30" strokeWidth={1} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="mt-3 truncate text-center text-xs text-muted-foreground">
              {currentText || 'Preview will appear here'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 paper-edge">
            <div className="mb-4 flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-serif-display text-lg">Style</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Foreground</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fg}
                    onChange={(e) => setFg(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
                  />
                  <Input value={fg} onChange={(e) => setFg(e.target.value)} className="h-9" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Background</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bg}
                    onChange={(e) => setBg(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded border border-border bg-transparent"
                  />
                  <Input value={bg} onChange={(e) => setBg(e.target.value)} className="h-9" />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-xs text-muted-foreground">Error correction</Label>
                <Select value={ecl} onValueChange={setEcl}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Low — ~7%</SelectItem>
                    <SelectItem value="M">Medium — ~15%</SelectItem>
                    <SelectItem value="Q">Quartile — ~25%</SelectItem>
                    <SelectItem value="H">High — ~30%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {PALETTES.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setFg(p.fg)
                      setBg(p.bg)
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs transition hover:border-primary"
                  >
                    <span className="flex h-3 w-3 overflow-hidden rounded-full border border-border">
                      <span style={{ background: p.fg }} className="h-full w-1/2" />
                      <span style={{ background: p.bg }} className="h-full w-1/2" />
                    </span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Sticky mobile CTA — mirrors whichever action matches the active tab */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-md lg:hidden">
        <Button
          onClick={mode === 'single' ? downloadPng : () => downloadBatch('png')}
          disabled={busy || (mode === 'single' ? !text : batchLines.length === 0)}
          size="lg"
          className="h-11 w-full rounded-full"
        >
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {mode === 'single' ? 'Download PNG' : `Download ${batchLines.length} as zip`}
        </Button>
      </div>
    </main>
  )
}
