import React from 'react'
import { useLeaderboard } from '../hooks/useLeaderboard'
import { Trophy, BarChart3, ChevronLeft } from 'lucide-react'

interface LeaderboardProps {
  onClose: () => void;
}

const RANK_STYLES: Record<number, { bg: string; text: string; border: string; label: string }> = {
  0: { bg: '#b45309', text: '#fef08a', border: '#fbbf24', label: '🥇' },
  1: { bg: '#475569', text: '#e2e8f0', border: '#94a3b8', label: '🥈' },
  2: { bg: '#7c3409', text: '#fed7aa', border: '#f97316', label: '🥉' },
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onClose }) => {
  const { data: entries, isLoading } = useLeaderboard()

  return (
    <div className="fixed inset-y-0 right-0 w-80 z-50 flex flex-col bg-[#0a0a14] border-l-2 border-[#1a1a2e] shadow-[-8px_0_32px_rgba(0,0,0,0.8)] animate-in slide-in-from-right duration-200">
      
      {/* Pixel scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025] z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)',
          backgroundSize: '100% 3px',
        }}
      />

      {/* ── Header ─────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b-2 border-[#1a1a2e] bg-[#0c0c18]">
        {/* Corner accents */}
        <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-orange-500/40" />
        <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-orange-500/40" />

        <div className="flex items-center gap-3">
          <span className="w-1.5 h-6 bg-orange-500" />
          <BarChart3 size={14} className="text-orange-500/60" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">Leaderboard</h2>
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#0c0c18] border-2 border-[#1a1a2e] border-b-4 border-b-black/60
            text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white
            transition-colors active:border-b-2 active:translate-y-0.5"
        >
          <ChevronLeft size={11} />
          Close
        </button>
      </div>

      {/* ── Column labels ──────────────────────────── */}
      <div className="relative z-10 grid grid-cols-[32px_1fr_auto] gap-3 items-center px-5 py-2 border-b-2 border-[#1a1a2e] bg-[#08080f]">
        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">#</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Player</span>
        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">W</span>
      </div>

      {/* ── Entries ────────────────────────────────── */}
      <div className="relative z-10 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-6 h-6 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-yellow-500/60 animate-pulse">
              ▶ Fetching Legends...
            </p>
          </div>
        ) : (
          entries?.map((entry, idx) => {
            const rank = RANK_STYLES[idx]
            return (
              <div
                key={entry.address}
                className="relative grid grid-cols-[32px_1fr_auto] gap-3 items-center px-5 py-3.5 border-b-2 border-[#1a1a2e] transition-colors hover:bg-white/[0.02] group"
                style={rank ? { background: rank.bg + '14' } : {}}
              >
                {/* Rank badge */}
                <div
                  className="w-8 h-8 flex items-center justify-center font-black text-[10px] border-2 flex-shrink-0"
                  style={rank
                    ? { background: rank.bg, color: rank.text, borderColor: rank.border }
                    : { background: '#1a1a2e', color: 'rgba(255,255,255,0.3)', borderColor: '#2a2a3e' }
                  }
                >
                  {rank ? rank.label : idx + 1}
                </div>

                {/* Player info */}
                <div className="min-w-0">
                  <div className="text-[11px] font-black uppercase tracking-tight truncate text-white/80 group-hover:text-white transition-colors">
                    {entry.username || `0x...${entry.address.slice(-6)}`}
                  </div>
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/25 mt-0.5">
                    LV.{entry.bestCreatureLevel} · {entry.totalBattles} battles
                  </div>
                </div>

                {/* Wins + trophy */}
                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                  <span className="text-[11px] font-black" style={rank ? { color: rank.text } : { color: 'rgba(255,255,255,0.5)' }}>
                    {entry.totalWins}
                  </span>
                  {entry.tournamentWins > 0 && (
                    <div className="flex items-center gap-0.5 text-yellow-400">
                      <Trophy size={9} fill="currentColor" />
                      <span className="text-[8px] font-black">{entry.tournamentWins}</span>
                    </div>
                  )}
                </div>

                {/* Gold shimmer for #1 */}
                {idx === 0 && (
                  <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
                    style={{ background: 'linear-gradient(90deg, transparent, #fbbf24, transparent)' }}
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ── Your rank footer ───────────────────────── */}
      <div className="relative z-10 border-t-2 border-[#1a1a2e] bg-[#08080f]">
        <div className="flex items-center gap-3 px-5 py-2 border-b-2 border-[#1a1a2e]">
          <span className="w-1 h-4 bg-orange-500/50" />
          <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/25">Your Rank</span>
        </div>
        <div className="grid grid-cols-[32px_1fr_auto] gap-3 items-center px-5 py-3.5">
          <div className="w-8 h-8 bg-orange-600 border-2 border-orange-800 flex items-center justify-center font-black text-[10px] text-white">
            12
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-tight text-orange-400">you.base</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-white/25 mt-0.5">Top 15%</div>
          </div>
          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">—</span>
        </div>
      </div>
    </div>
  )
}

export default Leaderboard
