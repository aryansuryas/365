import dynamic from 'next/dynamic'

export const metadata = {
  title: 'Document to PDF — ConvertHub',
  description: 'Convert .docx Word documents into clean PDFs right in your browser.',
}

const DocToPdfClient = dynamic(() =>
  import('./DocToPdfClient').then((m) => m.DocToPdfClient)
)

export default function Page() {
  return <DocToPdfClient />
}
