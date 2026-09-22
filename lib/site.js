// Single source of truth for site-wide text and links.
// Edit MAKER below to swap in your own name, email, and portfolio link.

export const SITE_NAME = 'ConvertHub'
export const SITE_DESCRIPTION =
  'A small toolkit for everyday files — convert images to PDF, generate QR codes, and more, entirely in your browser.'
export const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://converthub.example.com'

export const MAKER = {
  name: 'Aryan Surya S',
  initials: 'AS',
  portfolio: 'https://aryansurya.vercel.app',
  // TODO: swap in your real contact email — this is a placeholder.
  email: 'aryansurya752006@gmail.com',
}

export const NAV_LINKS = [
  { href: '#tools', label: 'Tools' },
  { href: '#about', label: 'About' },
]
