import React, { useEffect, useState } from 'react'

const STORAGE_KEY = 'footer_walker_enabled'
const MESSAGES = ['meow~ 🐾', 'semangat wi!', 'jalan dulu...', '*purr*', 'keep shipping! 🚀', 'ngoding terus!', '🐱💨', 'halo! 👋']

export function isWalkerEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === null ? true : v === '1'
  } catch {
    return true
  }
}

export default function FooterWalker() {
  const [enabled, setEnabled] = useState<boolean>(isWalkerEnabled())
  const [bubble, setBubble] = useState<string | null>(null)
  const [flip, setFlip] = useState(false)

  // keep enabled state in sync with storage changes
  useEffect(() => {
    const handler = () => setEnabled(isWalkerEnabled())
    window.addEventListener('storage', handler)
    window.addEventListener('walker-toggle', handler as EventListener)
    return () => {
      window.removeEventListener('storage', handler)
      window.removeEventListener('walker-toggle', handler as EventListener)
    }
  }, [])

  // auto‑hide bubble after a short while
  useEffect(() => {
    if (!bubble) return
    const t = setTimeout(() => setBubble(null), 1500)
    return () => clearTimeout(t)
  }, [bubble])

  if (!enabled) return null

  return (
    <div className="shrink-0 relative overflow-hidden select-none" style={{ height: 46, borderTop: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.0))', backdropFilter: 'blur(6px)' }}>
      {/* ground line */}
      <div className="absolute left-0 right-0" style={{ bottom: 13, height: 1, opacity: 0.9, background: 'repeating-linear-gradient(to right, rgba(255,255,255,0.28) 0 6px, transparent 6px 12px)' }} />
      {/* walker */}
      <div className="walker-track" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div
          className="walker-cat"
          onClick={() => { setFlip(f => !f); setBubble(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]) }}
          title="klik aku 🐱"
          style={{ position: 'absolute', bottom: 14, left: 10, cursor: 'pointer', transform: flip ? 'scaleX(-1)' : undefined, animation: 'hermesWalk 11.5s linear infinite', willChange: 'left, transform' }}
        >
          {bubble && (
            <div className="walker-bubble glass-strong rounded-full px-2.5 py-1 text-[11px] font-mono text-white whitespace-nowrap shadow-lg border border-white/15" style={{ position: 'absolute', left: '50%', top: -10, transform: 'translate(-50%,-100%)', animation: 'bubblePop 0.18s ease-out' }}>
              {bubble}
            </div>
          )}
          <svg width="58" height="36" viewBox="0 0 38 22" shapeRendering="crispEdges" style={{ display: 'block', imageRendering: 'pixelated' as any }}>
            {/* shadow */}
            <ellipse cx="19" cy="20.6" rx="10.5" ry="1.4" fill="rgba(0,0,0,0.35)" />
            {/* tail */}
            <g className="cat-tail" style={{ transformOrigin: '24px 11px' }}>
              <rect x="24.5" y="10.2" width="7.2" height="3.2" rx="1.4" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.7" />
              <rect x="30.6" y="9.2" width="3.4" height="2.8" rx="1.2" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.7" />
              <rect x="31.2" y="10" width="1.6" height="1" rx="0.4" fill="#FFF2E6" />
            </g>
            {/* hind leg */}
            <g className="leg hind">
              <rect x="21.2" y="15.2" width="2.8" height="3.6" rx="1" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.7" />
              <rect x="21.5" y="18.2" width="2.2" height="1" rx="0.4" fill="#2D1B0F" />
            </g>
            {/* body */}
            <rect x="10.5" y="9.8" width="14.2" height="6.8" rx="2" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.75" />
            {/* belly */}
            <rect x="12" y="11.2" width="9.5" height="3.2" rx="1.2" fill="#FFF4E6" />
            {/* chest fluff */}
            <ellipse cx="11.2" cy="12.6" rx="2.1" ry="1.7" fill="#FFF4E6" stroke="#2D1B0F" strokeWidth="0.5" />
            {/* head */}
            <rect x="5.2" y="4.2" width="12.2" height="9.2" rx="2.2" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.75" />
            {/* ears */}
            <path d="M6.2 4.6 L8.8 1.1 L11.2 4.6 Z" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.7" strokeLinejoin="round" />
            <path d="M12.2 4.6 L14.8 1.1 L17.2 4.6 Z" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.7" strokeLinejoin="round" />
            <path d="M7.6 3.8 L8.8 2.2 L10 3.8 Z" fill="#FF8FA3" />
            <path d="M13.6 3.8 L14.8 2.2 L16 3.8 Z" fill="#FF8FA3" />
            {/* blush */}
            <ellipse cx="6.8" cy="9.6" rx="1.3" ry="0.9" fill="#FF8FA3" opacity="0.55" />
            <ellipse cx="15.9" cy="9.6" rx="1.3" ry="0.9" fill="#FF8FA3" opacity="0.55" />
            {/* eyes */}
            <rect x="7" y="7" width="3.4" height="3.4" rx="1.1" fill="#0F0A1E" />
            <rect x="12.2" y="7" width="3.4" height="3.4" rx="1.1" fill="#0F0A1E" />
            {/* eye highlights */}
            <rect x="7.8" y="7.7" width="1.2" height="1.2" rx="0.5" fill="white" />
            <rect x="13" y="7.7" width="1.2" height="1.2" rx="0.5" fill="white" />
            <rect x="7.7" y="9.1" width="0.7" height="0.6" rx="0.3" fill="white" opacity="0.7" />
            <rect x="12.9" y="9.1" width="0.7" height="0.6" rx="0.3" fill="white" opacity="0.7" />
            {/* nose */}
            <rect x="10.35" y="10.1" width="1.7" height="1.2" rx="0.5" fill="#FF5A79" stroke="#2D1B0F" strokeWidth="0.45" />
            {/* mouth */}
            <path d="M8.9 11.5 Q10.1 12.3 11.2 11.5 Q12.3 12.3 13.5 11.5" fill="none" stroke="#2D1B0F" strokeWidth="0.7" strokeLinecap="round" strokeLinejoin="round" />
            {/* whiskers */}
            <rect x="2.6" y="8.2" width="3" height="0.55" rx="0.3" fill="#2D1B0F" opacity="0.55" />
            <rect x="2.6" y="9.7" width="3" height="0.55" rx="0.3" fill="#2D1B0F" opacity="0.55" />
            <rect x="17.2" y="8.2" width="3" height="0.55" rx="0.3" fill="#2D1B0F" opacity="0.55" />
            <rect x="17.2" y="9.7" width="3" height="0.55" rx="0.3" fill="#2D1B0F" opacity="0.55" />
            {/* front legs */}
            <g className="leg front-a">
              <rect x="11.2" y="16.2" width="2.8" height="3.6" rx="1" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.7" />
              <rect x="11.5" y="18.8" width="2.2" height="1" rx="0.4" fill="#2D1B0F" />
            </g>
            <g className="leg front-b">
              <rect x="15.2" y="16.2" width="2.8" height="3.6" rx="1" fill="#FFC07A" stroke="#2D1B0F" strokeWidth="0.7" />
              <rect x="15.5" y="18.8" width="2.2" height="1" rx="0.4" fill="#2D1B0F" />
            </g>
          </svg>
        </div>
      </div>
      <style>{`
        @keyframes hermesWalk {
          0%   { left: 10px; transform: scaleX(1); }
          44%  { left: 10px; transform: scaleX(1); }
          45%  { left: 10px; transform: scaleX(1); }
          46%  { left: 10px; transform: scaleX(-1); }
          90%  { left: calc(100% - 68px); transform: scaleX(-1); }
          94%  { left: calc(100% - 68px); transform: scaleX(-1); }
          95%  { left: calc(100% - 68px); transform: scaleX(1); }
          100% { left: 10px; transform: scaleX(1); }
        }
        @keyframes bubblePop { from { transform: translate(-50%,-100%) scale(0.85); opacity:0; } to { transform: translate(-50%,-100%) scale(1); opacity:1; } }
        @media (max-width: 768px) {
          @keyframes hermesWalk {
            0%   { left: 8px; transform: scaleX(1); }
            44%  { left: 8px; transform: scaleX(1); }
            46%  { left: 8px; transform: scaleX(-1); }
            90%  { left: calc(100% - 66px); transform: scaleX(-1); }
            95%  { left: calc(100% - 66px); transform: scaleX(1); }
            100% { left: 8px; transform: scaleX(1); }
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .walker-cat { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
