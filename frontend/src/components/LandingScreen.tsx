import React from 'react'
import WalletConnect from './WalletConnect'
import { useInterwovenKit } from '../hooks/useInterwovenKit'
import { Shield, Trophy, ChevronRight } from 'lucide-react'

interface LandingScreenProps {
  onEnter: () => void;
  onPlayGuest: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onEnter, onPlayGuest }) => {
  const { isConnected } = useInterwovenKit()

  return (
    <div className="min-h-screen bg-[#07070f] overflow-hidden relative flex flex-col items-center justify-center p-4">
      {/* Background Image - keep pixelated if it's pixel art, otherwise keep it */}
      <div
        className="absolute inset-0 z-0 bg-[url('/game-background.jpg')] bg-cover bg-center pointer-events-none"
        style={{ opacity: 0.5, imageRendering: 'pixelated' }}
      />

      {/* Pixel scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full animate-pulse-glow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Section */}
      <div className="relative z-10 text-center mt-2 mb-8 w-full max-w-4xl">
        <div className="flex items-center justify-center gap-4 mb-4 opacity-60">
          <img src="/swords.png" alt="Combat" className="w-5 h-5 object-contain" style={{ imageRendering: 'pixelated' }} />
          <div className="h-px w-12 bg-white/20" />
          <span className="text-[10px] tracking-[0.4em] font-black uppercase text-white">Let the Battle begin</span>
          <div className="h-px w-12 bg-white/20" />
          <img src="/swords.png" alt="Combat" className="w-5 h-5 object-contain scale-x-[-1]" style={{ imageRendering: 'pixelated' }} />
        </div>

        <div className="relative group mb-6 flex justify-center">
          <img
            src="/logo1.png"
            alt="CHAIN SLASH"
            className="w-full max-w-xl xl:max-w-2xl transform transition-all duration-700 hover:scale-105 active:scale-95 drop-shadow-[0_0_30px_rgba(234,88,12,0.3)] group-hover:drop-shadow-[0_0_50px_rgba(234,88,12,0.6)]"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <p className="text-xs md:text-sm text-white/70 font-black tracking-widest uppercase mb-8 max-w-2xl mx-auto border-y-2 border-white/10 py-3 bg-[#0a0a14]/60 backdrop-blur-sm">
          The first fully on-chain creature battle engine built on Base.<br/>
          <span className="text-orange-400">▶ Mint. ▶ Train. ▶ Battle. ▶ Dominate.</span>
        </p>

        <div className="flex flex-col items-center justify-center gap-6">
          {!isConnected ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500 w-full max-w-xs">
              <div className="transform scale-110 mb-2 w-full flex justify-center">
                <WalletConnect />
              </div>

              <div className="flex items-center gap-4 w-full opacity-40">
                <div className="h-px flex-1 bg-white" />
                <span className="text-[9px] font-black uppercase tracking-widest whitespace-nowrap">Or continue without wallet</span>
                <div className="h-px flex-1 bg-white" />
              </div>

              <button
                onClick={onPlayGuest}
                className="w-full px-5 py-3 bg-[#0a0a14] border-2 border-[#1a1a2e] border-b-4 border-b-black/80
                  font-black text-[10px] uppercase tracking-widest transition-all
                  hover:bg-[#0c0c18] hover:border-white/20 hover:text-white text-white/50
                  flex items-center justify-center gap-3 active:border-b-2 active:translate-y-0.5 select-none"
              >
                <span>▶ Play as Guest (PvE)</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-5 animate-in slide-in-from-bottom-8 duration-700 w-full max-w-sm">
              <div className="px-4 py-2 bg-green-500/10 border-2 border-green-500/20 flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 animate-pulse" style={{ imageRendering: 'pixelated' }} />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Wallet Connected</span>
              </div>

              <button
                onClick={onEnter}
                className="group flex flex-col items-center gap-3 w-full"
              >
                <div className="w-full px-8 py-5 bg-[#e85c1a] border-2 border-[#7c2d00] border-b-8 border-b-[#451a03]
                  font-black text-lg xl:text-xl uppercase tracking-widest text-white
                  shadow-[0_0_50px_rgba(234,88,12,0.4)]
                  transition-all active:border-b-2 active:mt-[6px] active:translate-y-0 select-none
                  flex items-center justify-center gap-4 hover:brightness-110"
                >
                  <span style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}>ENTER THE ARENA</span>
                  <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 group-hover:opacity-100 transition-opacity text-orange-200">
                  ▶ Prepare for combat
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Table */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6 w-full max-w-4xl opacity-0 animate-[fadeIn_1s_ease-out_0.5s_forwards]">
        {[
          { icon: <img src="/swords.png" alt="Battles" className="w-5 h-5 object-contain" style={{ imageRendering: 'pixelated' }} />, value: '247', label: 'Battles Today', color: 'orange-500' },
          { icon: <Shield size={16} className="text-blue-500" />, value: '1,204', label: 'Creatures Summoned', color: 'blue-500' },
          { icon: <Trophy size={16} className="text-yellow-500" />, value: '340 ETH', label: 'Prize Pools', color: 'yellow-500' }
        ].map((stat, i) => (
          <div key={i} className="bg-[#0a0a14]/80 border-2 border-[#1a1a2e] p-4 flex items-center gap-4 relative group backdrop-blur-md">
            {/* Pixel corners */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/10" />
            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/10" />
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white/10" />
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/10" />
            
            <div className="w-10 h-10 bg-[#0c0c18] border-2 border-[#1a1a2e] flex items-center justify-center flex-shrink-0">
              {stat.icon}
            </div>
            <div>
              <div className="text-lg xl:text-xl font-fantasy font-black truncate">{stat.value}</div>
              <div className="text-[8px] uppercase font-black tracking-widest text-white/40 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <footer className="mt-8 mb-2 relative z-10 text-[9px] text-white/20 font-black uppercase tracking-[0.4em]">
        Built on Base · EVM · 2026
      </footer>
    </div>
  )
}

export default LandingScreen
