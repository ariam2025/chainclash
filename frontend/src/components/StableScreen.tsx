import React, { useState } from 'react'
import CreatureCard from './CreatureCard'
import WalletConnect from './WalletConnect'
import ChallengeModal from './ChallengeModal'
import ChallengeNotifications from './ChallengeNotifications'
import ConfirmModal from './ConfirmModal'
import { useCreature } from '../hooks/useCreature'
import { useBattle } from '../hooks/useBattle'
import { useBrawlerXP } from '../hooks/useBrawlerXP'
import { Plus, Trophy, BarChart3, Zap, ChevronRight, ShoppingBag } from 'lucide-react'
import { Creature } from '../lib/types'
import { getCreatureImage } from '../lib/assets'
import { ELEMENT_COLORS } from '../lib/constants'

interface StableScreenProps {
  onStartBattle: (battleId: number, playerCreatureId?: number) => void;
  onMint: () => void;
  onViewTournament: () => void;
  onViewLeaderboard: () => void;
  onViewStore: () => void;
}

const StableScreen: React.FC<StableScreenProps> = ({
  onStartBattle,
  onMint,
  onViewTournament,
  onViewLeaderboard,
  onViewStore
}) => {
  const { creatures, releaseCreature } = useCreature()
  const { acceptChallenge } = useBattle(null)
  const { xp, activePowerUps, getExtraLevels } = useBrawlerXP()

  // Merge store-purchased level boosts into a creature's displayed stats
  const applyLevelBoosts = (creature: Creature): Creature => {
    const extra = getExtraLevels(creature.id)
    if (extra === 0) return creature
    const hpGain   = extra * 10
    const atkGain  = extra * 8
    const defGain  = extra * 6
    const spdGain  = extra * 5
    const spGain   = extra * 4
    return {
      ...creature,
      level:        creature.level + extra,
      attack:       creature.attack + atkGain,
      defense:      creature.defense + defGain,
      speed:        creature.speed + spdGain,
      specialPower: creature.specialPower + spGain,
      maxHp:        creature.maxHp + hpGain,
      hp:           creature.hp + hpGain,
    }
  }
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [isAcceptingChallenge, setIsAcceptingChallenge] = useState(false)
  const [isConfirmingRelease, setIsConfirmingRelease] = useState(false)
  const [creatureToRelease, setCreatureToRelease] = useState<number | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; variant: 'danger' | 'warning' | 'info' } | null>(null)

  const handleRelease = (id: number) => {
    setCreatureToRelease(id)
    setIsConfirmingRelease(true)
  }

  const confirmRelease = async () => {
    if (!creatureToRelease) return
    setIsConfirmingRelease(false)
    try {
      await releaseCreature(creatureToRelease)
      if (selectedId === creatureToRelease) setSelectedId(null)
    } catch (err: any) {
      setAlertConfig({
        title: 'Release Failed',
        message: err?.message || 'Unknown error occurred during release.',
        variant: 'danger'
      })
    } finally {
      setCreatureToRelease(null)
    }
  }

  const handleAcceptChallenge = async (battleId: number) => {
    if (!selectedId) {
      setAlertConfig({
        title: 'Selection Required',
        message: 'Please select a brawler from your stable before accepting a challenge.',
        variant: 'warning'
      })
      return
    }
    const creature = creatures?.find(c => c.id === selectedId)
    if (!creature) return
    setIsAcceptingChallenge(true)
    try {
      await acceptChallenge(battleId, creature.id, creature.maxHp)
      onStartBattle(battleId, creature.id)
    } catch (err: any) {
      setAlertConfig({
        title: 'Accept Failed',
        message: err?.message || 'Failed to accept the challenge.',
        variant: 'danger'
      })
    } finally {
      setIsAcceptingChallenge(false)
    }
  }

  const handleStartPve = (creature: Creature) => {
    onStartBattle(Math.floor(Math.random() * 10000), creature.id)
  }

  const selectedCreature = creatures?.find(c => c.id === selectedId)
  const boostedSelectedCreature = selectedCreature ? applyLevelBoosts(selectedCreature) : undefined

  return (
    <div className="min-h-screen bg-[#07070f] text-white flex flex-col relative overflow-hidden">
      <ChallengeNotifications onAccept={handleAcceptChallenge} />

      {/* Pixel-style background grid */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      {/* Background scene image */}
      <div
        className="absolute inset-0 z-0 bg-[url('/game-background2.jpg')] bg-cover bg-center pointer-events-none"
        style={{ opacity: 0.12 }}
      />

      {/* ── PIXEL HEADER ────────────────────────────────── */}
      <header className="relative z-30 bg-[#0a0a14] border-b-2 border-[#1a1a2e] flex flex-col md:flex-row items-stretch">
        
        {/* Top row (mobile) / Left section (desktop): Logo + Wallet */}
        <div className="flex items-center justify-between w-full md:w-auto md:border-r-2 md:border-[#1a1a2e]">
          {/* Logo */}
          <div className="flex items-center gap-6 px-6 py-3 md:py-0 h-full">
            <img
              src="/logo1.png"
              alt="CHAIN SLASH"
              className="h-8 w-auto drop-shadow-[0_0_10px_rgba(234,88,12,0.3)]"
            />
          </div>
          {/* Wallet (Mobile only top row) */}
          <div className="md:hidden pr-4">
            <WalletConnect />
          </div>
        </div>

        {/* Bottom row (mobile) / Right section (desktop): Nav + XP + Wallet */}
        <div className="flex-1 flex overflow-x-auto hide-scrollbar border-t-2 border-[#1a1a2e] md:border-t-0 md:overflow-visible">
          {/* Nav */}
          <nav className="flex items-stretch gap-0 border-r-2 border-[#1a1a2e] flex-shrink-0">
            {[
              { icon: <Trophy size={13} />, label: 'Tournament', action: onViewTournament },
              { icon: <BarChart3 size={13} />, label: 'Leaderboard', action: onViewLeaderboard },
              { icon: <ShoppingBag size={13} />, label: 'Store', action: onViewStore },
            ].map(({ icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex items-center gap-2 px-4 md:px-5 py-3 md:py-4 text-[10px] font-black uppercase tracking-widest text-white/30
                  hover:text-white hover:bg-white/[0.04] border-r-2 border-[#1a1a2e] transition-colors last:border-r-0 whitespace-nowrap"
              >
                {icon}
                {label}
              </button>
            ))}
          </nav>
          
          {/* XP Balance Pill */}
          <div className="flex flex-shrink-0 items-center gap-2 px-4 md:border-r-2 border-[#1a1a2e]">
            <span className="text-orange-500/60 text-xs">✦</span>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Brawlers XP</span>
              <span className="text-sm font-black text-orange-400 tabular-nums">{xp.toLocaleString()}</span>
            </div>
            {activePowerUps.length > 0 && (
              <div className="ml-1 px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/40 text-[8px] font-black text-orange-400 uppercase">
                {activePowerUps.length} buff{activePowerUps.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Wallet (Desktop only) */}
          <div className="hidden md:flex items-center pl-4 pr-6 ml-auto">
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* ── MAIN LAYOUT ─────────────────────────────────── */}
      <main className="flex-1 relative z-10 flex flex-col lg:flex-row">

        {/* LEFT: Stable Grid */}
        <div className="flex-1 border-r-2 border-[#1a1a2e] flex flex-col">
          {/* Section header bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b-2 border-[#1a1a2e] bg-[#0a0a14]">
            <div className="flex items-center gap-3">
              <span className="w-1.5 h-5 bg-orange-500" />
              <h2 className="text-sm font-black uppercase tracking-widest">Your Stable</h2>
            </div>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
              {creatures?.length || 0} / 6
            </span>
          </div>

          {/* Cards grid */}
          <div className="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
            {creatures?.map(creature => {
              const boosted = applyLevelBoosts(creature)
              return (
                <CreatureCard
                  key={creature.id}
                  creature={boosted}
                  selected={selectedId === creature.id}
                  onClick={() => setSelectedId(creature.id)}
                  onRelease={() => handleRelease(creature.id)}
                />
              )
            })}

            {/* Add new slot */}
            {(creatures?.length || 0) < 6 && (
              <button
                onClick={onMint}
                className="h-[312px] w-[200px] border-2 border-dashed border-white/8 bg-[#0a0a14]/60
                  flex flex-col items-center justify-center gap-3 transition-all
                  text-white/15 hover:text-white/40 hover:border-white/20 hover:bg-white/[0.02]
                  group"
              >
                {/* Pixel corner dots */}
                <span className="absolute top-2 left-2 w-1 h-1 bg-white/10 group-hover:bg-white/30" />
                <span className="absolute top-2 right-2 w-1 h-1 bg-white/10 group-hover:bg-white/30" />
                <span className="absolute bottom-2 left-2 w-1 h-1 bg-white/10 group-hover:bg-white/30" />
                <span className="absolute bottom-2 right-2 w-1 h-1 bg-white/10 group-hover:bg-white/30" />
                <div className="w-10 h-10 border-2 border-current flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em]">Summon New</span>
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: Actions panel */}
        <div className="w-full lg:w-[320px] flex flex-col bg-[#0a0a14]">

          {/* Panel header */}
          <div className="flex items-center gap-3 px-5 py-3 border-b-2 border-[#1a1a2e]">
            <span className="w-1.5 h-5 bg-orange-500/60" />
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/70">
              Battle Operations
            </span>
          </div>

          {/* Selected brawler or prompt */}
          <div className="flex-1 p-5 flex flex-col gap-4">
            {boostedSelectedCreature ? (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col gap-3">
                {/* Selected brawler mini card */}
                <div
                  className="flex items-center gap-3 p-3 border-2 bg-[#0c0c18]"
                  style={{ borderColor: ELEMENT_COLORS[boostedSelectedCreature.element] + '44' }}
                >
                  <img
                    src={getCreatureImage(boostedSelectedCreature.element)}
                    className="w-12 h-12 object-contain"
                    style={{ imageRendering: 'pixelated' }}
                    alt=""
                  />
                  <div>
                    <div className="font-fantasy font-bold text-sm">{boostedSelectedCreature.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-white/30">▶ Ready for combat</span>
                      {boostedSelectedCreature.level > (selectedCreature?.level ?? 0) && (
                        <span className="text-[8px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1 font-black uppercase">
                          LV.{boostedSelectedCreature.level}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <button
                  onClick={() => handleStartPve(boostedSelectedCreature)}
                  className="w-full py-4 bg-orange-600 border-b-4 border-orange-800 font-black text-sm uppercase
                    tracking-widest flex items-center justify-center gap-2 transition-all
                    hover:brightness-110 active:border-b-0 active:translate-y-1"
                >
                  <Zap size={16} fill="currentColor" />
                  Train vs Bot
                </button>

                <button
                  onClick={() => setShowChallengeModal(true)}
                  className="w-full py-4 bg-[#0c0c18] border-2 border-white/10 border-b-4 border-b-white/5 font-black text-sm uppercase
                    tracking-widest flex items-center justify-center gap-2 transition-all text-white/60
                    hover:border-white/20 hover:text-white active:border-b-0 active:translate-y-1"
                >
                  Challenge Player
                  <ChevronRight size={14} className="opacity-40" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-white/8 p-8 flex flex-col items-center justify-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20 text-center leading-relaxed">
                  ▶ Select a brawler from your stable to begin
                </span>
              </div>
            )}
          </div>

          {/* Tournament section */}
          <div className="border-t-2 border-[#1a1a2e]">
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-[#1a1a2e] bg-[#0c0c18]">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/30">Upcoming Tournament</span>
              <span className="text-[8px] font-black px-2 py-0.5 bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 uppercase tracking-wider">
                Open
              </span>
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div>
                <div className="text-base font-fantasy font-bold">Week 3 Arena</div>
                <div className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">
                  Prize Pool: 0.02 ETH
                </div>
              </div>
              <button
                onClick={onViewTournament}
                className="w-full py-3 bg-yellow-600/10 border-2 border-yellow-600/30 border-b-4 border-b-yellow-800/30
                  text-yellow-500 font-black text-xs uppercase tracking-widest transition-all
                  hover:bg-yellow-600/20 active:border-b-2 active:translate-y-0.5"
              >
                View Bracket
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showChallengeModal && boostedSelectedCreature && (
        <ChallengeModal
          creatureId={boostedSelectedCreature.id}
          onClose={() => setShowChallengeModal(false)}
          onChallengeStarted={(battleId) => {
            setShowChallengeModal(false)
            onStartBattle(battleId, boostedSelectedCreature.id)
          }}
        />
      )}

      {isAcceptingChallenge && (
        <div className="fixed inset-0 z-[100] bg-[#07070f]/90 flex items-center justify-center flex-col gap-4">
          <div className="w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-orange-500 animate-pulse">
            ▶ Initializing PvP Duel...
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmingRelease}
        title="Release Brawler"
        message="Are you sure you want to release this brawler? This action is permanent and cannot be undone."
        confirmText="RELEASE"
        cancelText="CANCEL"
        variant="danger"
        onConfirm={confirmRelease}
        onCancel={() => { setIsConfirmingRelease(false); setCreatureToRelease(null) }}
      />

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

export default StableScreen
