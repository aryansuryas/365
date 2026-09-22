import dynamic from 'next/dynamic'

export const metadata = {
  title: 'QR Code Generator — ConvertHub',
  description: 'Turn text or URLs into scannable QR codes — free and instant.',
}

const QrGeneratorClient = dynamic(() =>
  import('./QrGeneratorClient').then((m) => m.QrGeneratorClient)
)

export default function Page() {
  return <QrGeneratorClient />
}
