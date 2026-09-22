import dynamic from 'next/dynamic'

export const metadata = {
  title: 'PDF to Document — ConvertHub',
  description: 'Extract text from a PDF and rebuild it as an editable .docx file.',
}

const PdfToDocClient = dynamic(() =>
  import('./PdfToDocClient').then((m) => m.PdfToDocClient)
)

export default function Page() {
  return <PdfToDocClient />
}
