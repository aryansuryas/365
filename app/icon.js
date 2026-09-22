import { ImageResponse } from 'next/og'

export const size = { width: 64, height: 64 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: '#7a1f2b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#f7f1e4',
          fontSize: 34,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        C
      </div>
    ),
    { ...size }
  )
}
