import { useEffect, useState } from 'react'

const STORAGE_KEY = 'footer_walker_enabled'
const MESSAGES = ['meow~ 🐾', 'semangat wi!', 'jalan dulu...', '*purr*', 'keep shipping! 🚀', 'ngoding terus!', '🐱💨']

export function isWalkerEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === null ? true : v === '1'
  } catch { return true }
}

export default function FooterWalker() {
  const [enabled, setEnabled] = useState<boolean>(() => isWalkerEnabled())
  const [bubble, setBubble] = useState<string | null>(null)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    const h = () => setEnabled(isWalkerEnabled())
    window.addEventListener('storage', h)
    const custom = () => h()
    window.addEventListener('walker-toggle', custom as EventListener)
    return () => {
      window.removeEventListener('storage', h)
      window.removeEventListener('walker-toggle', custom as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!bubble) return
    const t = setTimeout(() => setBubble(null), 1600)
    return () => clearTimeout(t)
  }, [bubble])

  if (!enabled) return null

  const onCatClick = () => {
    setFlipped((f) => !f)
    setBubble(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
  }

  return (
    <div className="shrink-0 h-[42px] relative overflow-hidden border-t border-white/[0.06] bg-white/[0.02] backdrop-blur">
      {/* dotted ground */}
      <div className="absolute inset-x-0 bottom-[10px] h-px opacity-40" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.35) 2px, transparent 2px)', backgroundSize: '10px 1px', backgroundRepeat: 'repeat-x' }} />
      {/* walker */}
      <div
        className={`absolute bottom-[11px] cursor-pointer select-none ${flipped ? 'walker-flipped' : 'walker'}`}
        onClick={onCatClick}
        title="klik aku! 🐱"
        style={{ pointerEvents: 'auto' }}
      >
        {/* bubble */}
        {bubble && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 -translate-y-1 glass-strong rounded-full px-2.5 py-1 text-[11px] font-mono text-white whitespace-nowrap shadow-lg border border-white/15 pointer-events-none">
            {bubble}
          </div>
        )}
        <div className="cat-bob">
          {/* Pixel Cat SVG — 32x20 viewBox, pixelated */}
          <svg width="52" height="32" viewBox="0 0 32 20" shapeRendering="crispEdges" style={{ imageRendering: 'pixelated' as any, display: 'block' }}>
            {/* shadow */}
            <ellipse cx="16" cy="19" rx="9" ry="1.2" fill="rgba(0,0,0,0.35)" />
            {/* tail */}
            <g className="cat-tail" style={{ transformOrigin: '20px 10px' }}>
              <rect x="20" y="9" width="6" height="3" rx="0.5" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.6" />
              <rect x="25.5" y="8.5" width="2.5" height="2" rx="0.5" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.6" />
            </g>
            {/* body */}
            <rect x="8" y="8.5" width="12" height="6.5" rx="1" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.7" />
            <rect x="9" y="9.5" width="10" height="2" rx="0.5" fill="white" opacity="0.95" />
            {/* head */}
            <rect x="3.5" y="3.5" width="10.5" height="8" rx="1.2" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.7" />
            {/* ears */}
            <rect x="4" y="1.2" width="3.5" height="3.5" rx="0.6" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.7" />
            <rect x="10" y="1.2" width="3.5" height="3.5" rx="0.6" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.7" />
            <rect x="5.2" y="2.3" width="1.4" height="1.4" rx="0.3" fill="#ff7a8a" />
            <rect x="11.2" y="2.3" width="1.4" height="1.4" rx="0.3" fill="#ff7a8a" />
            {/* eyes */}
            <rect x="5.5" y="6.5" width="2.2" height="2.6" rx="0.6" fill="#1a1033" />
            <rect x="10.2" y="6.5" width="2.2" height="2.6" rx="0.6" fill="#1a1033" />
            <rect x="6.2" y="7.2" width="0.9" height="1" rx="0.4" fill="white" />
            <rect x="10.9" y="7.2" width="0.9" height="1" rx="0.4" fill="white" />
            {/* nose / mouth */}
            <rect x="8.6" y="9.2" width="1.1" height="1" rx="0.3" fill="#ff4d6a" />
            <rect x="7.5" y="10.4" width="1.8" height="0.7" rx="0.3" fill="#4a2c0a" opacity="0.9" />
            <rect x="9.3" y="10.4" width="1.8" height="0.7" rx="0.3" fill="#4a2c0a" opacity="0.9" />
            {/* legs — two groups for walk cycle */}
            <g className="leg leg1">
              <rect x="9" y="15" width="2.4" height="3.2" rx="0.6" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.6" />
              <rect x="9.4" y="17.8" width="1.6" height="0.9" rx="0.3" fill="#4a2c0a" />
            </g>
            <g className="leg leg2">
              <rect x="13" y="15" width="2.4" height="3.2" rx="0.6" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.6" />
              <rect x="13.4" y="17.8" width="1.6" height="0.9" rx="0.3" fill="#4a2c0a" />
            </g>
            <g className="leg leg1" style={{ animationDelay: '0.15s' } as any}>
              <rect x="17.2" y="15" width="2.4" height="3.2" rx="0.6" fill="#ffb86b" stroke="#4a2c0a" strokeWidth="0.6" />
              <rect x="17.6" y="17.8" width="1.6" height="0.9" rx="0.3" fill="#4a2c0a" />
            </g>
            {/* whiskers */}
            <rect x="2" y="7.2" width="2.2" height="0.5" rx="0.3" fill="#4a2c0a" opacity="0.6" />
            <rect x="2" y="8.6" width="2.2" height="0.5" rx="0.3" fill="#4a2c0a" opacity="0.6" />
            <rect x="14.2" y="7.2" width="2.2" height="0.5" rx="0.3" fill="#4a2c0a" opacity="0.6" />
            <rect x="14.2" y="8.6" width="2.2" height="0.5" rx="0.3" fill="#4a2c0a" opacity="0.6" />
          </svg>
        </div>
      </div>
      <style>{`
        .walker { left: 8px; animation: walkerMove 13s linear infinite alternate; }
        .walker-flipped { left: 8px; animation: walkerMoveFlipped 13s linear infinite alternate; }
        .cat-bob { animation: catBob 0.6s ease-in-out infinite; }
        .leg { animation: legWalk 0.32s ease-in-out infinite; }
        .leg2 { animation-delay: 0.16s; }
        .cat-tail { animation: tailWag 0.5s ease-in-out infinite; transform-box: fill-box; }
        @keyframes walkerMove {
          0% { transform: translateX(0) scaleX(1); }
          49% { transform: translateX(0) scaleX(1); }
          50% { transform: translateX(calc(100vw - 248px - 64px)) scaleX(-1); }
          100% { transform: translateX(calc(100vw - 248px - 64px)) scaleX(-1); }
        }
        @keyframes walkerMoveFlipped {
          0% { transform: translateX(calc(100vw - 248px - 64px)) scaleX(-1); }
          100% { transform: translateX(0) scaleX(1); }
        }
        @media (max-width: 768px) {
          @keyframes walkerMove {
            0% { transform: translateX(0) scaleX(1); }
            49% { transform: translateX(0) scaleX(1); }
            50% { transform: translateX(calc(100vw - 64px)) scaleX(-1); }
            100% { transform: translateX(calc(100vw - 64px)) scaleX(-1); }
          }
          @keyframes walkerMoveFlipped {
            0% { transform: translateX(calc(100vw - 64px)) scaleX(-1); }
            100% { transform: translateX(0) scaleX(1); }
          }
        }
        @keyframes catBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
        @keyframes legWalk { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
        @keyframes tailWag { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(14deg); } }
      `}</style>
    </div>
  )
}
