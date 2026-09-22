import { SITE_URL } from '@/lib/site'

export default function sitemap() {
  const routes = [
    '',
    '/tools/image-to-pdf',
    '/tools/qr-generator',
    '/tools/doc-to-pdf',
    '/tools/pdf-to-doc',
    '/privacy',
    '/terms',
  ]
  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.7,
  }))
}
