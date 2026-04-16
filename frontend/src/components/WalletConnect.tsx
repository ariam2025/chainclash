import { useState, useRef, useEffect } from 'react'
import { useInterwovenKit } from '../hooks/useInterwovenKit'
import { Wallet, Zap, Copy, LogOut, ExternalLink, ChevronDown } from 'lucide-react'

function shortenAddress(addr: string): string {
  if (!addr) return ''
  if (addr.length <= 16) return addr
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`
}

export default function WalletConnect() {
  const { address, username, isConnected, openConnect, openWallet, disconnect, autoSign } = useInterwovenKit()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const copyAddress = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const displayName = username
    ? username.endsWith('.base') ? username : `${username}.base`
    : shortenAddress(address ?? '')

  const chainId = typeof autoSign?.isEnabledByChain === 'object'
    ? Object.keys(autoSign.isEnabledByChain)[0] : undefined
  const isAutoSignEnabled = chainId ? autoSign?.isEnabledByChain?.[chainId] : false

  // ── NOT CONNECTED ────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <button
        id="connect-wallet-btn"
        onClick={openConnect}
        className="relative flex items-center gap-2 px-4 py-2.5 bg-[#0c0c18] border-2 border-b-4 border-orange-500/40 border-b-orange-900/60
          text-orange-400 font-black text-[10px] uppercase tracking-[0.2em]
          transition-all active:border-b-2 active:translate-y-0.5 hover:border-orange-400/60 hover:text-orange-300
          select-none"
      >
        {/* Pixel corner dots */}
        <span className="absolute top-1 left-1 w-1 h-1 bg-orange-500/40" />
        <span className="absolute top-1 right-1 w-1 h-1 bg-orange-500/40" />
        <Wallet size={13} />
        <span>Connect Wallet</span>
      </button>
    )
  }

  // ── CONNECTED ────────────────────────────────────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pill button — pixel style */}
      <button
        id="wallet-pill-btn"
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center gap-2 px-4 py-2.5
          bg-[#0c0c18] border-2 border-[#1a1a2e] border-b-4 border-b-black/60
          text-white font-black text-[10px] uppercase tracking-[0.15em]
          transition-all active:border-b-2 active:translate-y-0.5
          hover:border-orange-500/30 hover:bg-[#0e0e1e]
          select-none"
      >
        {/* Pixel corner dots */}
        <span className="absolute top-1 left-1 w-1 h-1 bg-white/10" />
        <span className="absolute top-1 right-1 w-1 h-1 bg-white/10" />

        {/* Online indicator — pixel square, no rounded */}
        <span className="w-2 h-2 bg-green-400 flex-shrink-0" style={{ imageRendering: 'pixelated' }} />

        {/* Address / username */}
        <span className="font-mono text-white/70">{displayName}</span>

        {isAutoSignEnabled && <Zap size={10} className="text-yellow-400" />}

        <ChevronDown size={12} className={`text-white/30 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+4px)] w-64
            bg-[#0a0a14] border-2 border-[#1a1a2e]
            shadow-[4px_4px_0px_rgba(0,0,0,0.8)]
            z-50 overflow-hidden
            animate-in fade-in slide-in-from-top-1 duration-100"
        >
          {/* Pixel scanlines */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.025]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)',
              backgroundSize: '100% 3px',
            }}
          />

          {/* Identity block */}
          <div className="relative border-b-2 border-[#1a1a2e] p-4">
            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-orange-500/40" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-orange-500/40" />

            <div className="flex items-center gap-3">
              {/* Pixel wallet icon box */}
              <div className="w-9 h-9 bg-[#0c0c18] border-2 border-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                <Wallet size={15} className="text-orange-500/60" />
              </div>
              <div className="flex-1 min-w-0">
                {username ? (
                  <>
                    <p className="text-orange-400 font-black text-[10px] uppercase tracking-wider truncate">{displayName}</p>
                    <p className="text-white/30 text-[9px] font-mono truncate mt-0.5">{shortenAddress(address ?? '')}</p>
                  </>
                ) : (
                  <p className="text-white/60 font-mono text-[10px] truncate">{shortenAddress(address ?? '')}</p>
                )}
              </div>
            </div>

            {/* Online status bar */}
            <div className="mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-400" />
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-green-400/70">Connected</span>
              {isAutoSignEnabled && (
                <>
                  <span className="text-white/10 mx-1">|</span>
                  <Zap size={8} className="text-yellow-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-yellow-400/70">Auto-Sign</span>
                </>
              )}
            </div>
          </div>

          {/* Menu items */}
          <div className="relative">
            {[
              {
                icon: <Copy size={12} />,
                label: copied ? '▶ Copied!' : '▶ Copy Address',
                onClick: copyAddress,
                color: 'text-white/50 hover:text-white',
              },
              {
                icon: <ExternalLink size={12} />,
                label: '▶ Wallet Manager',
                onClick: () => { openWallet(); setOpen(false) },
                color: 'text-white/50 hover:text-white',
              },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b-2 border-[#1a1a2e]
                  text-[10px] font-black uppercase tracking-widest text-left
                  transition-colors hover:bg-white/[0.03] ${item.color}`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            {/* Disconnect */}
            <button
              onClick={() => { disconnect(); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3
                text-[10px] font-black uppercase tracking-widest text-left
                text-red-500/60 hover:text-red-400 hover:bg-red-500/[0.04] transition-colors"
            >
              <LogOut size={12} />
              ▶ Disconnect
            </button>
          </div>

          {/* Bottom corner accents */}
          <div className="relative h-0">
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-orange-500/20" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-orange-500/20" />
          </div>
        </div>
      )}
    </div>
  )
}
