import dynamic from 'next/dynamic'

export const metadata = {
  title: 'QR Code Generator — ConvertHub',
  description:
    'Turn text, links, or a whole list of URLs into scannable QR codes. Batch export as PNG or SVG, styled your way — free and instant.',
}

const QrGeneratorClient = dynamic(() =>
  import('./QrGeneratorClient').then((m) => m.QrGeneratorClient), {
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground text-sm">
      Loading tool…
    </div>
  ),
  ssr: false,
})

export default function Page() {
  return <QrGeneratorClient />
}
