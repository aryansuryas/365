import dynamic from 'next/dynamic'

export const metadata = {
  title: 'PDF to Document — ConvertHub',
  description:
    'Extract the text from a PDF and rebuild it as an editable .docx file, right in your browser — nothing is uploaded.',
}

const PdfToDocClient = dynamic(() =>
  import('./PdfToDocClient').then((m) => m.PdfToDocClient), {
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground text-sm">
      Loading tool…
    </div>
  ),
  ssr: false,
})

export default function Page() {
  return <PdfToDocClient />
}
