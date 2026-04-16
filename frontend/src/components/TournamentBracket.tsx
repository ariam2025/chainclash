import React from 'react'
import { Trophy, Swords } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'

interface TournamentBracketProps {
  tournamentId: number;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({ tournamentId }) => {
  const { tournaments, isLoading } = useTournament()
  const tournament = tournaments?.find(t => t.id === tournamentId)

  const players = tournament?.participants || []
  const getPlayer = (idx: number) => players[idx] || (tournament?.isOpen ? 'VACANT' : `Bot_${idx + 1}`)
  const fmt = (addr: string) => addr.length > 14 ? `${addr.slice(0, 6)}..${addr.slice(-4)}` : addr

  if (isLoading || !tournament) {
    return (
      <div className="min-h-screen bg-[#07070f] flex items-center justify-center flex-col gap-4">
        <div className="w-8 h-8 border-2 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
        <p className="text-[9px] font-black uppercase tracking-[0.35em] text-yellow-500/60 animate-pulse">▶ Syncing Bracket...</p>
      </div>
    )
  }

  const rounds = [
    {
      name: 'Round of 8',
      matches: [
        { p1: getPlayer(0), p2: getPlayer(1), winner: tournament.round > 1 ? getPlayer(0) : null },
        { p1: getPlayer(2), p2: getPlayer(3), winner: tournament.round > 1 ? getPlayer(2) : null },
        { p1: getPlayer(4), p2: getPlayer(5), winner: tournament.round > 1 ? getPlayer(5) : null },
        { p1: getPlayer(6), p2: getPlayer(7), winner: tournament.round > 1 ? getPlayer(6) : null },
      ]
    },
    {
      name: 'Semi-Finals',
      matches: [
        { p1: tournament.round > 1 ? getPlayer(0) : 'TBD', p2: tournament.round > 1 ? getPlayer(2) : 'TBD', winner: tournament.round > 2 ? getPlayer(0) : null },
        { p1: tournament.round > 1 ? getPlayer(5) : 'TBD', p2: tournament.round > 1 ? getPlayer(6) : 'TBD', winner: tournament.round > 2 ? getPlayer(5) : null },
      ]
    },
    {
      name: 'Finals',
      matches: [
        { p1: tournament.round > 2 ? getPlayer(0) : 'TBD', p2: tournament.round > 2 ? getPlayer(5) : 'TBD', winner: tournament.winner },
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-[#07070f] text-white flex flex-col relative overflow-hidden">
      {/* Pixel grid background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Scanlines */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)',
          backgroundSize: '100% 3px',
        }}
      />

      {/* ── Header ─────────────────────────────── */}
      <div className="relative z-10 bg-[#0a0a14] border-b-2 border-[#1a1a2e] px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="w-2 h-8 bg-yellow-500" />
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-0.5">▶ Tournament</div>
            <h1 className="text-xl font-fantasy font-black uppercase tracking-tight text-white">
              {tournament.name || 'Week 3 Arena'}
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border-2 border-yellow-500/30">
            <Trophy size={11} className="text-yellow-400" fill="currentColor" />
            <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">
              {tournament.prizePool.toFixed(4)} ETH
            </span>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-white/20">
            Tournament #{tournament.id}
          </span>
        </div>
      </div>

      {/* ── Bracket ────────────────────────────── */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-0 overflow-x-auto">
        {rounds.map((round, rIdx) => (
          <div
            key={rIdx}
            className="flex-1 flex flex-col border-r-2 border-[#1a1a2e] last:border-r-0 min-w-[220px]"
          >
            {/* Round header */}
            <div className="flex items-center gap-2 px-5 py-3 border-b-2 border-[#1a1a2e] bg-[#0c0c18]">
              <span className="w-1 h-4"
                style={{ background: rIdx === 2 ? '#eab308' : rIdx === 1 ? '#f97316' : '#ffffff22' }}
              />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                {round.name}
              </span>
            </div>

            {/* Matches */}
            <div className="flex-1 flex flex-col justify-around gap-0 p-5 gap-4">
              {round.matches.map((match, mIdx) => (
                <div key={mIdx} className="relative">
                  {/* Match card */}
                  <div className="border-2 border-[#1a1a2e] overflow-hidden bg-[#0c0c18]"
                    style={rIdx === 2 ? { borderColor: '#eab30830' } : {}}>
                    {/* Pixel corner accents for finals */}
                    {rIdx === 2 && (
                      <>
                        <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-yellow-500/50" />
                        <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-yellow-500/50" />
                        <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-yellow-500/50" />
                        <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-yellow-500/50" />
                      </>
                    )}

                    {/* Player 1 row */}
                    <div
                      className="flex items-center justify-between px-4 py-3 border-b-2 border-[#1a1a2e] transition-colors"
                      style={match.winner === match.p1
                        ? { background: '#eab30814', borderColor: '#eab30822' }
                        : match.winner && match.winner !== match.p1
                          ? { opacity: 0.4 }
                          : {}}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[130px]"
                        style={{ color: match.winner === match.p1 ? '#fde047' : 'rgba(255,255,255,0.7)' }}
                      >
                        {match.p1 === 'TBD' || match.p1 === 'VACANT'
                          ? <span className="text-white/20 italic">{match.p1}</span>
                          : fmt(match.p1)}
                      </span>
                      {match.winner === match.p1 && (
                        <Trophy size={10} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
                      )}
                    </div>

                    {/* VS divider */}
                    <div className="px-4 py-0.5 flex items-center gap-2 bg-[#08080f]">
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[7px] font-black text-white/15 uppercase tracking-widest">vs</span>
                      <div className="flex-1 h-px bg-white/5" />
                    </div>

                    {/* Player 2 row */}
                    <div
                      className="flex items-center justify-between px-4 py-3 transition-colors"
                      style={match.winner === match.p2
                        ? { background: '#eab30814' }
                        : match.winner && match.winner !== match.p2
                          ? { opacity: 0.4 }
                          : {}}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[130px]"
                        style={{ color: match.winner === match.p2 ? '#fde047' : 'rgba(255,255,255,0.7)' }}
                      >
                        {match.p2 === 'TBD' || match.p2 === 'VACANT'
                          ? <span className="text-white/20 italic">{match.p2}</span>
                          : fmt(match.p2)}
                      </span>
                      {match.winner === match.p2 && (
                        <Trophy size={10} className="text-yellow-400 flex-shrink-0" fill="currentColor" />
                      )}
                    </div>
                  </div>

                  {/* Pixel connector line to next round */}
                  {rIdx < rounds.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-[1px] w-5 h-px bg-[#2a2a3e]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Status bar ─────────────────────────── */}
      <div className="relative z-10 bg-[#0a0a14] border-t-2 border-[#1a1a2e] px-6 py-4 flex items-center gap-4">
        <div className="p-3 bg-orange-600/20 border-2 border-orange-500/30 flex-shrink-0">
          <Swords size={16} className="text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-black uppercase tracking-widest text-white mb-0.5">
            {tournament.isOpen
              ? `▶ Waiting for ${8 - players.length} more players...`
              : tournament.winner
                ? '▶ Tournament Concluded!'
                : '▶ Battle In Progress'}
          </div>
          <div className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25">
            {tournament.winner
              ? `Champion rewarded: ${tournament.prizePool.toFixed(4)} ETH`
              : 'Turn resolution every 60 seconds'}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <div className="text-[8px] font-black uppercase tracking-widest text-white/20">Round</div>
          <div className="text-xl font-black text-orange-500">{tournament.round}/3</div>
        </div>
      </div>
    </div>
  )
}

export default TournamentBracket
