import { ImageResponse } from 'next/og'
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: '#f6f1e7',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#241c15',
              display: 'flex',
            }}
          />
          <div style={{ fontSize: 32, color: '#241c15', fontWeight: 600 }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: 'flex', fontSize: 56, color: '#241c15', fontWeight: 700, maxWidth: 900, lineHeight: 1.15 }}>
          A small toolkit for everyday files.
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#5b5045', marginTop: 24, maxWidth: 800 }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    { ...size }
  )
}
