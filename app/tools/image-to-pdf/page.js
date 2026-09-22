import dynamic from 'next/dynamic'

export const metadata = {
  title: 'Image to PDF — ConvertHub',
  description:
    'Combine JPG, PNG, or WebP images into a single ordered PDF right in your browser. Drag to reorder, pick a page size, and download — nothing is uploaded.',
}

const ImageToPdfClient = dynamic(() =>
  import('./ImageToPdfClient').then((m) => m.ImageToPdfClient), {
  loading: () => (
    <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground text-sm">
      Loading tool…
    </div>
  ),
  ssr: false,
})

export default function Page() {
  return <ImageToPdfClient />
}
