import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt     = 'PayLaw — Simple Payroll for Construction Teams'
export const size    = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          justifyContent:  'center',
          background:      'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
          fontFamily:      'sans-serif',
          position:        'relative',
          overflow:        'hidden',
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position:   'absolute',
            inset:      0,
            backgroundImage:
              'radial-gradient(circle at 25% 25%, #374151 0%, transparent 50%), radial-gradient(circle at 75% 75%, #374151 0%, transparent 50%)',
            opacity: 0.4,
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '8px',
            background:     'rgba(16, 185, 129, 0.15)',
            border:         '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius:   '100px',
            padding:        '8px 20px',
            marginBottom:   '32px',
          }}
        >
          <div
            style={{
              width:        '8px',
              height:       '8px',
              borderRadius: '50%',
              background:   '#10b981',
            }}
          />
          <span style={{ color: '#10b981', fontSize: '18px', fontWeight: 600 }}>
            Simple payroll for construction teams
          </span>
        </div>

        {/* Logo + name */}
        <div
          style={{
            display:     'flex',
            alignItems:  'center',
            gap:         '20px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width:          '72px',
              height:         '72px',
              background:     'white',
              borderRadius:   '16px',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
              fontSize:       '28px',
              fontWeight:     900,
              color:          '#111827',
            }}
          >
            PL
          </div>
          <span
            style={{
              fontSize:      '72px',
              fontWeight:    900,
              color:         'white',
              letterSpacing: '0.15em',
            }}
          >
            PAYLAW
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize:    '28px',
            color:       'rgba(255,255,255,0.7)',
            textAlign:   'center',
            maxWidth:    '700px',
            lineHeight:  1.4,
            margin:      '0 0 48px 0',
          }}
        >
          Mark attendance · Track overtime · Download PDF payslips
        </p>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            '📋 Attendance grid',
            '⏰ Overtime tracking',
            '📄 PDF payslips',
            '💰 7 currencies',
            '📱 Works offline',
          ].map(f => (
            <div
              key={f}
              style={{
                background:   'rgba(255,255,255,0.1)',
                border:       '1px solid rgba(255,255,255,0.15)',
                borderRadius: '100px',
                padding:      '10px 20px',
                color:        'white',
                fontSize:     '18px',
              }}
            >
              {f}
            </div>
          ))}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position:     'absolute',
            bottom:       '32px',
            right:        '40px',
            color:        'rgba(255,255,255,0.4)',
            fontSize:     '16px',
          }}
        >
          paylaw.com
        </div>
      </div>
    ),
    { ...size }
  )
}