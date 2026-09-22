import dynamic from 'next/dynamic'

export const metadata = {
  title: 'Image to PDF — ConvertHub',
  description: 'Combine JPG, PNG, or WebP images into a single ordered PDF right in your browser.',
}

const ImageToPdfClient = dynamic(() =>
  import('./ImageToPdfClient').then((m) => m.ImageToPdfClient)
)

export default function Page() {
  return <ImageToPdfClient />
}
