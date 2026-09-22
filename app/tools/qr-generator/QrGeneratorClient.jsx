'use client'

import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode/lib/browser'
import JSZip from 'jszip'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { QrCode, Loader2, FileImage, FileText, Archive } from 'lucide-react'
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

async function makeDataUrl(text, opts) {
  return new Promise((resolve, reject) => {
    QRCode.toDataURL(
      text,
      { errorCorrectionLevel: opts.ecl, margin: 2, width: 512, color: { dark: opts.fg, light: opts.bg } },
      (err, url) => { if (err) reject(err); else resolve(url) }
    )
  })
}

async function makeSvg(text, opts) {
  return new Promise((resolve, reject) => {
    QRCode.toString(
      text,
      { type: 'svg', errorCorrectionLevel: opts.ecl, margin: 2, color: { dark: opts.fg, light: opts.bg } },
      (err, str) => { if (err) reject(err); else resolve(str) }
    )
  })
}

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
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
  const [text, setText] = useState('')
  const [batchText, setBatchText] = useState('')
  const [fg, setFg] = useState(PALETTES[0].fg)
  const [bg, setBg] = useState(PALETTES[0].bg)
  const [ecl, setEcl] = useState('M')
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)

  const currentText = mode === 'single' ? text : batchText.split('\n').find((l) => l.trim()) || ''
  const batchLines = useMemo(() => batchText.split('\n').map((l) => l.trim()).filter(Boolean), [batchText])

  useEffect(() => {
    if (!currentText) { setPreview(''); return }
    let cancelled = false
    makeDataUrl(currentText, { fg, bg, ecl })
      .then((url) => { if (!cancelled) setPreview(url) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [currentText, fg, bg, ecl])

  const downloadPng = async () => {
    if (!currentText) return
    setBusy(true)
    try {
      const url = await makeDataUrl(currentText, { fg, bg, ecl })
      downloadBlob(dataUrlToBlob(url), `qr-${Date.now()}.png`)
      toast.success('PNG saved')
    } catch { toast.error('Could not generate PNG') } finally { setBusy(false) }
  }

  const downloadSvg = async () => {
    if (!currentText) return
    setBusy(true)
    try {
      const svg = await makeSvg(currentText, { fg, bg, ecl })
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `qr-${Date.now()}.svg`)
      toast.success('SVG saved')
    } catch { toast.error('Could not generate SVG') } finally { setBusy(false) }
  }

  const downloadBatch = async (format) => {
    if (batchLines.length === 0) { toast.error('Add some lines first'); return }
    setBusy(true)
    try {
      const zip = new JSZip()
      for (let i = 0; i < batchLines.length; i++) {
        const line = batchLines[i]
        const name = slug(line, i)
        if (format === 'png') {
          const url = await makeDataUrl(line, { fg, bg, ecl })
          zip.file(`${name}.png`, dataUrlToBlob(url))
        } else {
          zip.file(`${name}.svg`, await makeSvg(line, { fg, bg, ecl }))
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' })
      downloadBlob(blob, `qr-batch-${Date.now()}.zip`)
      toast.success(`Zipped ${batchLines.length} QR codes`)
    } catch (e) {
      console.error(e); toast.error('Batch failed')
    } finally { setBusy(false) }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-8">
        <h1 className="font-serif-display text-3xl sm:text-4xl">QR Generator</h1>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }} className="space-y-4">
        {/* Preview */}
        <div className="flex justify-center">
          <div className="relative flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl border border-border bg-card">
            <AnimatePresence mode="wait">
              {preview ? (
                <motion.img
                  key={preview}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  src={preview}
                  alt="QR preview"
                  className="h-full w-full object-contain p-3"
                />
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <QrCode className="h-14 w-14 text-muted-foreground/20" strokeWidth={1} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={mode} onValueChange={setMode}>
          <TabsList className="h-9 w-full rounded-xl bg-muted p-1">
            <TabsTrigger value="single" className="flex-1 rounded-lg text-sm">Single</TabsTrigger>
            <TabsTrigger value="batch" className="flex-1 rounded-lg text-sm">Batch</TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="mt-3">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://example.com or any text"
              className="min-h-[96px] resize-none rounded-xl text-sm"
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={downloadPng} disabled={busy || !text} className="flex-1">
                {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FileImage className="mr-1.5 h-3.5 w-3.5" />}
                PNG
              </Button>
              <Button size="sm" variant="outline" onClick={downloadSvg} disabled={busy || !text} className="flex-1">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                SVG
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="mt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">One URL per line</span>
              <span className="text-xs text-muted-foreground">{batchLines.length} entries</span>
            </div>
            <Textarea
              value={batchText}
              onChange={(e) => setBatchText(e.target.value)}
              placeholder={'https://example.com\nhello world'}
              className="min-h-[140px] resize-none font-mono text-sm rounded-xl"
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => downloadBatch('png')} disabled={busy || batchLines.length === 0} className="flex-1">
                {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Archive className="mr-1.5 h-3.5 w-3.5" />}
                PNG zip
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadBatch('svg')} disabled={busy || batchLines.length === 0} className="flex-1">
                <Archive className="mr-1.5 h-3.5 w-3.5" />
                SVG zip
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Style */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Style</p>
          <div className="flex flex-wrap gap-2">
            {PALETTES.map((p) => (
              <button
                key={p.label}
                onClick={() => { setFg(p.fg); setBg(p.bg) }}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                  fg === p.fg && bg === p.bg ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                }`}
              >
                <span className="flex h-3 w-3 overflow-hidden rounded-full border border-border">
                  <span style={{ background: p.fg }} className="h-full w-1/2" />
                  <span style={{ background: p.bg }} className="h-full w-1/2" />
                </span>
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Foreground</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
                <Input value={fg} onChange={(e) => setFg(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Background</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-10 cursor-pointer rounded border border-border bg-transparent" />
                <Input value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-xs text-muted-foreground">Error correction</Label>
            <Select value={ecl} onValueChange={setEcl}>
              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="L">Low (~7%)</SelectItem>
                <SelectItem value="M">Medium (~15%)</SelectItem>
                <SelectItem value="Q">Quartile (~25%)</SelectItem>
                <SelectItem value="H">High (~30%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>
    </main>
  )
}
