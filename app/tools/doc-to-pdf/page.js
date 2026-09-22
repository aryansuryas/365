import dynamic from 'next/dynamic'

export const metadata = {
  title: 'Document to PDF — ConvertHub',
  description:
    'Convert .docx Word documents into clean, paginated PDFs right in your browser — headings, paragraphs, and lists preserved. Nothing is uploaded.',
}

const DocToPdfClient = dynamic(() =>
  import('./DocToPdfClient').then((m) => m.DocToPdfClient), {
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground text-sm">
      Loading tool…
    </div>
  ),
  ssr: false,
})

export default function Page() {
  return <DocToPdfClient />
}
