import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { SITE_NAME } from '@/lib/site'

export function Logo({ size = 'default' }) {
  const box = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const icon = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  const text = size === 'sm' ? 'text-lg' : 'text-xl'
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
      <div className={`flex ${box} items-center justify-center rounded-md bg-foreground text-background`}>
        <Sparkles className={icon} strokeWidth={2} />
      </div>
      <span className={`font-serif-display ${text} leading-none`}>{SITE_NAME}</span>
    </Link>
  )
}
