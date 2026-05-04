'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#111',
        color: 'white',
        fontSize: '13px',
        fontWeight: 600,
        padding: '8px 18px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'sans-serif',
      }}
    >
      Print / Save as PDF
    </button>
  )
}