import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#f7f1e4',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: '50%',
            background: '#7a1f2b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f7f1e4',
            fontSize: 72,
            fontWeight: 700,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          C
        </div>
      </div>
    ),
    { ...size }
  )
}
