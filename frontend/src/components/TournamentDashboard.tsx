import React, { useState } from 'react'
import { Trophy, Plus, Users, Coins, Swords, Sparkles, ChevronLeft, Trash2 } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import { Creature } from '../lib/types'
import CreateTournamentModal from './CreateTournamentModal'
import ConfirmModal from './ConfirmModal'

interface TournamentDashboardProps {
  onBack: () => void;
  onViewBracket: (tournamentId: number) => void;
  creatures?: Creature[];
}

const TournamentDashboard: React.FC<TournamentDashboardProps> = ({ onBack, onViewBracket, creatures }) => {
  const { tournaments, isLoading, joinTournament, deleteTournament } = useTournament()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [joiningId, setJoiningId] = useState<number | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; variant: 'danger' | 'warning' | 'info' } | null>(null)

  const handleJoin = async (id: number) => {
    if (!creatures || creatures.length === 0) {
      setAlertConfig({
        title: 'Brawler Required',
        message: 'You need an active brawler to enter this championship! Summon one from the stable first.',
        variant: 'warning'
      })
      return
    }
    const creature = creatures[0]
    setJoiningId(id)
    try {
      await joinTournament(id, creature.id)
      setAlertConfig({
        title: 'Entry Confirmed',
        message: 'You have successfully entered the tournament! Wait for 8 players to join to begin.',
        variant: 'info'
      })
    } catch (err: any) {
      setAlertConfig({
        title: 'Entry Failed',
        message: err?.message || 'Failed to join the tournament.',
        variant: 'danger'
      })
    } finally {
      setJoiningId(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await deleteTournament(id);
      // Optional: Add a success alert
    } catch (err) {
      console.error(err);
    }
  }

  const stats = [
    { icon: <Users size={18} className="text-white/40" />, label: 'Live Players', value: '128 Brawlers' },
    { icon: <Coins size={18} className="text-orange-500" />,  label: 'Prize Paid Out', value: '1.47 ETH'  },
    { icon: <Sparkles size={18} className="text-yellow-400" />, label: 'Next Event', value: 'Week 3 Finals' },
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

      {/* ── Header ─────────────────────────────────── */}
      <header className="relative z-10 bg-[#0a0a14] border-b-2 border-[#1a1a2e] px-4 sm:px-6 py-3 sm:py-0 flex flex-col sm:flex-row items-start sm:items-stretch justify-between gap-4 sm:gap-0">
        {/* Back + title */}
        <div className="flex items-stretch gap-0">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-4 border-r-2 border-[#1a1a2e]
              text-[10px] font-black uppercase tracking-widest text-white/30
              hover:text-white hover:bg-white/[0.03] transition-colors"
          >
            <ChevronLeft size={14} />
            Back
          </button>
          <div className="flex items-center gap-4 px-6">
            <span className="w-2 h-8 bg-yellow-500" />
            <div>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-yellow-500/70 mb-0.5">
                <Trophy size={9} fill="currentColor" />
                Global Championships
              </div>
              <h1 className="text-lg font-fantasy font-black uppercase tracking-tight text-white">
                Championship Dashboard
              </h1>
            </div>
          </div>
        </div>

        {/* Host button */}
        <div className="flex items-center pr-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-yellow-600 border-b-4 border-yellow-900
              text-[10px] font-black uppercase tracking-widest text-white
              transition-all active:border-b-2 active:translate-y-0.5 hover:brightness-110 select-none"
          >
            <Plus size={14} />
            Host New Tournament
          </button>
        </div>
      </header>

      <div className="relative z-10 flex-1 flex flex-col">

        {/* ── Stats row ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-b-2 border-[#1a1a2e]">
          {stats.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-5 px-8 py-6 border-r-2 border-[#1a1a2e] last:border-r-0 bg-[#0a0a14] relative"
            >
              {/* Pixel corner accents */}
              <span className="absolute top-2 left-2 w-1.5 h-1.5 bg-white/5" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-white/5" />

              {/* Icon box */}
              <div className="w-12 h-12 bg-[#0c0c18] border-2 border-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <div className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20 mb-1">
                  {s.label}
                </div>
                <div className="text-xl font-fantasy font-bold text-white">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tournament list ────────────────────────── */}
        <div className="flex-1 p-6">
          {/* Section header */}
          <div className="flex items-center justify-between mb-5 pb-3 border-b-2 border-[#1a1a2e]">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-6 bg-orange-500" />
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                Active & Upcoming Tournaments
              </h2>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
              {tournaments?.length || 0} Events Found
            </span>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="h-64 bg-[#0c0c18] border-2 border-[#1a1a2e] animate-pulse" />
              ))
            ) : tournaments?.length === 0 ? (
              <div className="col-span-full border-2 border-dashed border-white/8 py-24 flex flex-col items-center justify-center gap-4 text-white/15">
                {/* Pixel corner dots */}
                <Trophy size={40} className="opacity-20" />
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-center leading-relaxed">
                  ▶ No active tournaments found.<br />Host the first one!
                </p>
              </div>
            ) : (
              tournaments?.map((t) => {
                const roster = t.participants?.length || 0
                const rosterPct = (roster / 8) * 100
                const isOpen = t.isOpen
                return (
                  <div
                    key={t.id}
                    className="bg-[#0c0c18] border-2 border-[#1a1a2e] flex flex-col overflow-hidden relative group
                      hover:border-yellow-500/30 transition-colors"
                  >
                    {/* Pixel corner accents on hover */}
                    <span className="absolute top-0 left-0 w-2.5 h-2.5 border-t-2 border-l-2 border-transparent group-hover:border-yellow-500/50 transition-colors" />
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 border-t-2 border-r-2 border-transparent group-hover:border-yellow-500/50 transition-colors" />
                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b-2 border-l-2 border-transparent group-hover:border-yellow-500/50 transition-colors" />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b-2 border-r-2 border-transparent group-hover:border-yellow-500/50 transition-colors" />

                    {/* Card header */}
                    <div className="px-5 pt-5 pb-4 border-b-2 border-[#1a1a2e]">
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="px-2 py-0.5 border text-[8px] font-black uppercase tracking-[0.2em]"
                          style={isOpen
                            ? { borderColor: '#22c55e44', color: '#4ade80', background: '#22c55e10' }
                            : { borderColor: '#3b82f644', color: '#60a5fa', background: '#3b82f610' }
                          }
                        >
                          {isOpen ? '▶ Registration Open' : '▶ Tournament Live'}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] font-black text-white/20 font-mono">#{t.id}</span>
                          <button
                            onClick={(e) => handleDelete(e, t.id)}
                            className="text-red-500/50 hover:text-red-500 transition-colors"
                            title="Delete Tournament"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <h3 className="text-lg font-fantasy font-black uppercase tracking-tight text-white leading-none">
                        {t.name || 'CHAIN CLASH Clash'}
                      </h3>
                      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25 mt-1">
                        8-Player Bracket
                      </p>
                    </div>

                    {/* Prize + Fee row */}
                    <div className="grid grid-cols-2 border-b-2 border-[#1a1a2e]">
                      <div className="px-5 py-4 border-r-2 border-[#1a1a2e]">
                        <div className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-1 flex items-center gap-1">
                          <Coins size={8} className="text-yellow-500" /> Prize Pool
                        </div>
                        <div className="text-sm font-black text-yellow-400">
                          {t.prizePool > 0 ? `${t.prizePool.toFixed(4)} ETH` : 'No Stakes'}
                        </div>
                      </div>
                      <div className="px-5 py-4">
                        <div className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-1 flex items-center gap-1">
                          <Users size={8} /> Entry Fee
                        </div>
                        <div className="text-sm font-black text-white/60">{t.entryFee} ETH</div>
                      </div>
                    </div>

                    {/* Roster progress */}
                    <div className="px-5 py-4 border-b-2 border-[#1a1a2e]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Roster</span>
                        <span className="text-[9px] font-black text-white/40">{roster} / 8</span>
                      </div>
                      {/* Chunked pixel progress bar */}
                      <div className="flex gap-0.5">
                        {Array(8).fill(0).map((_, i) => (
                          <div
                            key={i}
                            className="flex-1 h-2 border border-[#1a1a2e] transition-colors"
                            style={{ background: i < roster ? '#f97316' : '#1a1a2e' }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="px-5 py-4">
                      <button
                        onClick={() => isOpen ? handleJoin(t.id) : onViewBracket(t.id)}
                        disabled={joiningId === t.id}
                        className="w-full py-3.5 font-black text-[10px] uppercase tracking-widest
                          flex items-center justify-center gap-2 border-b-4 transition-all
                          active:border-b-0 active:translate-y-0.5 select-none"
                        style={isOpen
                          ? { background: '#e85c1a', borderColor: '#7c2d00', color: 'white' }
                          : { background: '#1a1a2e', borderColor: '#0a0a14', color: 'rgba(255,255,255,0.5)', border: '2px solid #2a2a3e', borderBottom: '4px solid #0a0a14' }
                        }
                      >
                        {joiningId === t.id ? (
                          <>
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ▶ Entering...
                          </>
                        ) : isOpen ? (
                          <>
                            <Swords size={13} />
                            ▶ Enter Championship
                          </>
                        ) : (
                          <>▶ View Bracket</>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateTournamentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(_id: number) => setShowCreateModal(false)}
        />
      )}

      <ConfirmModal
        isOpen={!!alertConfig}
        title={alertConfig?.title || 'System Message'}
        message={alertConfig?.message || ''}
        variant={alertConfig?.variant || 'info'}
        onConfirm={() => setAlertConfig(null)}
      />
    </div>
  )
}

export default TournamentDashboard
