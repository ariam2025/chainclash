import React, { useState, useEffect } from 'react'
import CreatureCard from './CreatureCard'
import BattleCanvas from './BattleCanvas'
import { useBattle } from '../hooks/useBattle'
import { useCreature } from '../hooks/useCreature'
import { useAutoSign } from '../hooks/useAutoSign'
import { MoveType, ActiveBattle } from '../lib/types'
import { MOVE_DESCRIPTIONS, MOCK_MODE } from '../lib/constants'
import { resolveTurn, botChooseMove } from '../lib/mockBattle'
import { useBrawlerXP, calcXpReward } from '../hooks/useBrawlerXP'
import { Swords, Info, Coins, Loader2, Timer } from 'lucide-react'

interface BattleArenaProps {
  battleId: number;
  playerCreatureId?: number;
  botLevel?: number;
  onFinish: () => void;
  onNextLevel?: () => void;
}

const BattleArena: React.FC<BattleArenaProps> = ({ 
  battleId, 
  playerCreatureId,
  botLevel = 1, 
  onFinish, 
  onNextLevel 
}) => {
  const { creatures } = useCreature()
  const { battle: chainBattle, isLoading: chainLoading, submitMove: chainSubmitMove } = useBattle(battleId)
  const { sessionActive, enableSession, submitBattleMove } = useAutoSign()
  
  // Local state for MOCK_MODE or PVE
  const [mockBattle, setMockBattle] = useState<ActiveBattle | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentLog, setCurrentLog] = useState<string | null>(null)
  const [selectedMove, setSelectedMove] = useState<MoveType | null>(null)
  const [hoveredMove, setHoveredMove] = useState<MoveType | null>(null)
  const [winReason, setWinReason] = useState<'ko' | 'decision' | null>(null)
  const [xpAwarded, setXpAwarded] = useState<number | null>(null)

  // XP system
  const { addXp, activePowerUps, consumePowerUps } = useBrawlerXP()
  
  // FORCE MOCK LOGIC for PVE to keep it instant and gas-free
  const isPve = !!botLevel;
  const useMock = MOCK_MODE || isPve;
  const battle = useMock ? mockBattle : chainBattle
  const isLoading = useMock ? !mockBattle : chainLoading

  // Move limit — battle ends by decision when this is reached
  const MAX_TURNS = isPve ? 30 + (botLevel - 1) * 5 : 30;

  // Initialize Mock Battle
  useEffect(() => {
    if (useMock && !mockBattle) {
      // Find actual player creature or fallback
      let playerBrawler = creatures?.find((c: any) => c.id === playerCreatureId) || {
        id: 1, name: 'Brawler', element: 'Fire' as any, rarity: 'Common' as any,
        level: 1, xp: 0, hp: 120, maxHp: 120, attack: 15, defense: 12, speed: 14,
        specialPower: 18, wins: 0, losses: 0, inBattle: true
      }

      // Apply active power-ups to player brawler stats
      if (activePowerUps.length > 0) {
        let boosted = { ...playerBrawler }
        for (const pu of activePowerUps) {
          const key = pu.statKey as keyof typeof boosted
          if (typeof boosted[key] === 'number') {
            (boosted as any)[key] = Math.round((boosted[key] as number) * pu.multiplier)
          }
        }
        // Sync maxHp if hp was boosted
        if (boosted.maxHp !== playerBrawler.maxHp) boosted.hp = boosted.maxHp
        playerBrawler = boosted
        consumePowerUps()
      }

      // SCALE BOT STATS based on botLevel
      // Level 1 is heavily nerfed and acts as an "Easy" tutorial. Level 2 is "Normal".
      const isEasy = botLevel === 1
      const scaleMultiplier = Math.max(0, botLevel - 2)
      
      const botHp = isEasy ? 60 : 100 + scaleMultiplier * 25
      const botAtk = isEasy ? 8 : 15 + scaleMultiplier * 5
      const botDef = isEasy ? 5 : 12 + scaleMultiplier * 4
      const botSpd = isEasy ? 8 : 14 + scaleMultiplier * 4
      
      // ENSURE BOT PICKS A DIFFERENT CHARACTER
      const allElements = ['Fire', 'Water', 'Earth', 'Wind', 'Shadow']
      const botElements = allElements.filter(e => e !== playerBrawler.element)
      const botElement = botElements[botLevel % botElements.length]
      
      const dummyBot = { 
        ...playerBrawler, 
        id: 999,
        name: `Bot ${['Ignitron', 'Frostbite', 'Stonehowl', 'Stormwing', 'Shadowstalker'][botLevel % 5]}`, 
        element: botElement as any,
        level: botLevel,
        hp: botHp, 
        maxHp: botHp,
        attack: botAtk,
        defense: botDef,
        speed: botSpd
      }
      
      setMockBattle({
        battleId,
        player1: '0x1', player2: '0x0',
        creature1: playerBrawler, creature2: dummyBot,
        creature1Hp: playerBrawler.hp, creature2Hp: botHp,
        turn: 1, p1MoveSubmitted: false, p2MoveSubmitted: false,
        state: 'active', winner: null, isPve: true, botDifficulty: botLevel,
        wager: 0,
        battleLog: [],
        p1Buff: null, p2Buff: null
      })
    }
  }, [battleId, mockBattle, botLevel, playerCreatureId, creatures, useMock])

  const handleMove = async (type: MoveType) => {
    if (!battle || battle.state !== 'active' || isAnimating) return
    setSelectedMove(type)
    setIsAnimating(true)
    setCurrentLog(null) // Clear previous log immediately when turn starts

    if (useMock && mockBattle) {
      // 1. Bot chooses move
      const bMove = botChooseMove(
        mockBattle.creature2, mockBattle.creature1,
        mockBattle.creature2Hp, mockBattle.creature2.maxHp,
        mockBattle.creature1Hp, mockBattle.creature1.maxHp,
        mockBattle.turn
      )
      
      // 2. Resolve turn locally
      const result = resolveTurn(
        mockBattle.creature1, mockBattle.creature2,
        type, bMove,
        mockBattle.creature1Hp, mockBattle.creature2Hp,
        mockBattle.turn,
        mockBattle.p1Buff, mockBattle.p2Buff
      )

      // 3. Simulate "chain delay" and wait for animations
      await new Promise(r => setTimeout(r, 1800))

      // 4. Update state
      setMockBattle(prev => {
        if (!prev) return null

        const newPlayerHp = Math.max(0, result.newPlayerHp)
        const newBotHp = Math.max(0, result.newBotHp)
        const newTurn = prev.turn + 1

        // KO win check
        const isKo = newBotHp <= 0 || newPlayerHp <= 0
        // Move-limit win check (turn just completed = newTurn - 1 was the last turn)
        const isDecision = !isKo && newTurn > MAX_TURNS

        let newState: 'active' | 'finished' = 'active'
        let winner: string | null = null

        if (isKo) {
          newState = 'finished'
          winner = newBotHp <= 0 ? prev.player1 : prev.player2
          setWinReason('ko')
          // Award XP
          const isWin = newBotHp <= 0
          const earned = calcXpReward(isWin, botLevel, 'ko')
          addXp(earned)
          setXpAwarded(earned)
        } else if (isDecision) {
          newState = 'finished'
          // Winner = higher remaining HP percentage
          const playerPct = newPlayerHp / prev.creature1.maxHp
          const botPct = newBotHp / prev.creature2.maxHp
          winner = playerPct >= botPct ? prev.player1 : prev.player2
          setWinReason('decision')
          // Award XP
          const isWin = playerPct >= botPct
          const earned = calcXpReward(isWin, botLevel, 'decision')
          addXp(earned)
          setXpAwarded(earned)
        }

        return {
          ...prev,
          creature1Hp: newPlayerHp,
          creature2Hp: newBotHp,
          turn: newTurn,
          state: newState,
          winner,
          p1Buff: result.playerNewBuff,
          p2Buff: result.botNewBuff
        }
      })
      
      let log = result.logLine
      if (result.clutchSurvival) log += " → Clutch survival!"
      if (type === 'HeavyAttack' && result.playerMissed) log += " → Risky move backfired!"
      if (mockBattle.p1Buff === 'Counter' && type === 'HeavyAttack' && !result.playerMissed) log += " → COUNTER-STRIKE!"
      if (result.playerNewBuff === 'Counter') log += " → COUNTER ENERGY GAINED!"
      
      setCurrentLog(log)
      setIsAnimating(false)
      setSelectedMove(null)
    } else {
      // REAL MODE: use the submitBattleMove from useAutoSign
      try {
        await chainSubmitMove(type)
      } finally {
        setIsAnimating(false)
        setSelectedMove(null)
      }
    }
  }

  if (isLoading || !battle) return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-dark text-white flex flex-col overflow-hidden relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0 bg-[url('/game-background3.jpg')] bg-cover bg-center pointer-events-none"
        style={{ opacity: 0.25 }}
      />
      {/* HUD Header */}
      <div className="p-3 sm:p-4 bg-panel/80 border-b border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 backdrop-blur-md z-30">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <img src="/logo1.png" alt="Logo" className="w-5 sm:w-6 h-5 sm:h-6 object-contain" />
            </div>
            <div>
              <div className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-tighter">
                {battle.isPve ? `Level ${battle.botDifficulty} Bot` : `Battle #${battleId}`}
              </div>
              <div className="font-fantasy font-bold uppercase tracking-widest text-xs sm:text-sm">
                  {isPve ? 'Training Arena' : (MOCK_MODE ? 'Mock Training Session' : 'On-Chain Arena')}
              </div>
            </div>
          </div>
          <button onClick={onFinish} className="sm:hidden px-3 py-1.5 bg-white/5 border border-white/10 text-white/50 text-[9px] font-black tracking-widest uppercase transition-colors hover:text-red-400">
            SURRENDER
          </button>
        </div>

        {/* Move Limit Countdown */}
        {(() => {
          const turnsLeft = Math.max(0, MAX_TURNS - (battle.turn - 1))
          const pct = (turnsLeft / MAX_TURNS) * 100
          const isCritical = turnsLeft <= 5
          const barColor = isCritical ? 'bg-red-500' : turnsLeft <= 10 ? 'bg-yellow-500' : 'bg-orange-500'
          return (
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${ isCritical ? 'text-red-400 animate-pulse' : 'text-white/40'}`}>
                <span className="text-[10px]">▶</span>
                <span>{turnsLeft} Moves Left</span>
              </div>
              <div className="w-full sm:w-40 h-2 sm:h-3 bg-[#0a0a14] border-2 border-[#1a1a2e] relative overflow-hidden shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                <div
                  className={`h-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
                {/* Chunk dividers */}
                {[20, 40, 60, 80].map(p => (
                  <div key={p} className="absolute top-0 bottom-0 w-px bg-black/40" style={{ left: `${p}%` }} />
                ))}
              </div>
            </div>
          )
        })()}

        {/* Prize Pool Display */}
        {!isPve && battle.wager > 0 && (
          <div className="hidden sm:flex items-center gap-3 px-6 py-2 bg-orange-500/10 border border-orange-500/30 rounded-2xl">
             <div className="text-[10px] font-black uppercase tracking-widest text-orange-500/60">Prize Pool</div>
             <div className="flex items-center gap-1.5 font-fantasy text-xl text-orange-500">
                <Coins size={16} fill="currentColor" />
                {battle.wager} ETH
             </div>
          </div>
        )}

        <button onClick={onFinish} className="hidden sm:block px-4 py-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-[10px] font-black tracking-widest transition-all uppercase border border-white/5">
          SURRENDER
        </button>
      </div>

      {/* Mobile Mini HUD - Only visible on small screens */}
      <div className="md:hidden flex items-center justify-between p-3 bg-[#0a0a14] border-b-2 border-[#1a1a2e] z-20">
         {/* Player HP */}
         <div className="flex-1 flex flex-col gap-1 w-full max-w-[140px]">
            <div className="text-[9px] font-black uppercase text-green-400 truncate">{battle.creature1.name} <span className="text-white/40">LV.{battle.creature1.level}</span></div>
            <div className="h-2 bg-[#1a1a2e] border border-white/10 w-full relative">
               <div className="h-full bg-green-500 transition-all" style={{ width: `${(battle.creature1Hp / battle.creature1.maxHp) * 100}%` }} />
            </div>
         </div>
         <div className="px-3 text-[10px] font-black text-white/30 italic">VS</div>
         {/* Bot HP */}
         <div className="flex-1 flex flex-col gap-1 items-end w-full max-w-[140px]">
            <div className="text-[9px] font-black uppercase text-red-400 truncate"><span className="text-white/40">LV.{battle.creature2.level}</span> {battle.creature2.name}</div>
            <div className="h-2 bg-[#1a1a2e] border border-white/10 w-full relative">
               <div className="h-full bg-red-500 transition-all" style={{ width: `${(battle.creature2Hp / battle.creature2.maxHp) * 100}%` }} />
            </div>
         </div>
      </div>


      {/* PvP Move Sync Status */}
      {!isPve && battle.state === 'active' && battle.p1MoveSubmitted && !battle.p2MoveSubmitted && (
         <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="px-6 py-2 bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-full flex items-center gap-3 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
               <Loader2 size={14} className="animate-spin text-blue-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">Waiting for Opponent Move...</span>
            </div>
         </div>
      )}

      {/* Low HP Alert - Top Notification */}
      {battle.creature1Hp < battle.creature1.maxHp * 0.3 && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="px-6 py-2 bg-green-500/10 backdrop-blur-md border border-green-500/20 rounded-full flex items-center gap-2 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.15)] animate-pulse">
            <Info size={14} className="text-green-500" />
            <span className="text-xs font-black uppercase tracking-[0.2em] italic">Critical HP — Defend recommended</span>
          </div>
        </div>
      )}

      <div className="flex-1 relative flex flex-col pt-12 z-10">
        {/* Opponent Side */}
        <div className="absolute top-4 right-8 z-10 hidden md:block lg:scale-100 origin-top-right">
           <CreatureCard 
             creature={battle.creature2} 
             size="small" 
             isEnemy 
             showStats={false} 
             currentHp={battle.creature2Hp} 
           />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-2 sm:p-4">
           <BattleCanvas 
             playerCreature={battle.creature1}
             botCreature={battle.creature2}
             isAnimating={isAnimating}
             activeMove={selectedMove}
             hoveredMove={hoveredMove}
           />
        </div>

        {/* Player Side */}
        <div className="absolute bottom-52 left-8 z-10 hidden md:block lg:scale-100 origin-bottom-left">
           <CreatureCard 
             creature={battle.creature1} 
             size="small" 
             currentHp={battle.creature1Hp} 
           />
        </div>

        {/* Controls — Pixel Game Style */}
        <div className="bg-[#0a0a12] border-t-4 border-[#1a1a2e] z-20 pb-safe">
          {/* Move log bar */}
          <div className="border-b-2 border-[#1a1a2e] px-6 py-2 flex items-center gap-3 min-h-[40px]">
            {currentLog ? (
              <p className="text-[11px] font-black uppercase tracking-wider text-orange-400 animate-in fade-in duration-300">
                ▶ {currentLog}
              </p>
            ) : isAnimating ? (
              <p className="text-[11px] font-black uppercase tracking-wider text-white/30 animate-pulse">
                ▶ Resolving turn...
              </p>
            ) : (
              <p className="text-[11px] font-black uppercase tracking-wider text-white/20">
                ▶ Choose your move
              </p>
            )}
          </div>

          {/* Move buttons grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border-b-2 border-[#1a1a2e]">
            {(['Attack', 'HeavyAttack', 'Defend', 'Special'] as MoveType[]).map((type, idx) => {
              const isWaitingForSync = !isPve && battle.p1MoveSubmitted
              const isDisabled = battle.state !== 'active' || isAnimating || isWaitingForSync
              const isSelected = selectedMove === type
              const isLowHpDefend = type === 'Defend' && battle.creature1Hp < battle.creature1.maxHp * 0.3

              // Per-move accent color
              const accentColors: Record<string, { border: string; glow: string; label: string }> = {
                Attack:      { border: '#e85c1a', glow: 'rgba(232,92,26,0.6)',  label: 'text-orange-400' },
                HeavyAttack: { border: '#dc2626', glow: 'rgba(220,38,38,0.6)',  label: 'text-red-400'    },
                Defend:      { border: '#16a34a', glow: 'rgba(22,163,74,0.6)',  label: 'text-green-400'  },
                Special:     { border: '#7c3aed', glow: 'rgba(124,58,237,0.6)', label: 'text-violet-400' },
              }
              const accent = accentColors[type]

              return (
                <button
                  key={type}
                  disabled={isDisabled}
                  onClick={() => handleMove(type)}
                  onMouseEnter={() => setHoveredMove(type)}
                  onMouseLeave={() => setHoveredMove(null)}
                  style={isSelected ? {
                    borderBottom: `4px solid ${accent.border}`,
                    boxShadow: `inset 0 0 20px ${accent.glow}, 0 0 16px ${accent.glow}`,
                    background: 'rgba(255,255,255,0.06)',
                  } : isLowHpDefend ? {
                    borderBottom: '4px solid #16a34a',
                    boxShadow: 'inset 0 0 12px rgba(22,163,74,0.3)',
                  } : {}}
                  className={`
                    relative flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-4 sm:py-5 px-2
                    border-r-2 border-b-2 md:border-b-0 border-[#1a1a2e] md:last:border-r-0
                    transition-all duration-100 select-none
                    ${isSelected
                      ? 'scale-[0.97]'
                      : isDisabled
                        ? 'opacity-30 cursor-not-allowed bg-transparent'
                        : 'bg-transparent hover:bg-white/[0.03] active:scale-[0.97] cursor-pointer'}
                    ${isLowHpDefend && !isDisabled ? 'animate-pulse' : ''}
                  `}
                >
                  {/* Pixel corner dots */}
                  <span className={`absolute top-1.5 left-1.5 w-1 h-1 ${isSelected ? 'bg-white/60' : 'bg-white/10'}`} />
                  <span className={`absolute top-1.5 right-1.5 w-1 h-1 ${isSelected ? 'bg-white/60' : 'bg-white/10'}`} />

                  {/* Move icon */}
                  <div className={`w-10 h-10 flex items-center justify-center transition-transform duration-100 ${!isDisabled && !isSelected ? 'group-hover:scale-110' : ''}`}>
                    {MOVE_DESCRIPTIONS[type].image ? (
                      <img
                        src={MOVE_DESCRIPTIONS[type].image!}
                        alt={MOVE_DESCRIPTIONS[type].label}
                        className={`w-9 h-9 object-contain ${isSelected ? 'drop-shadow-[0_0_6px_white]' : ''} image-rendering-pixelated`}
                        style={{ imageRendering: 'pixelated' }}
                      />
                    ) : (
                      <span className="text-3xl">{MOVE_DESCRIPTIONS[type].emoji}</span>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isSelected ? accent.label : 'text-white/50'}`}>
                    {MOVE_DESCRIPTIONS[type].label}
                  </span>

                  {/* SAVE badge for low HP */}
                  {isLowHpDefend && (
                    <span className="absolute top-1 right-1 text-[7px] bg-green-500 text-black px-1 font-black uppercase animate-bounce">
                      SAVE
                    </span>
                  )}

                  {/* Selected flash overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />
                  )}

                  {/* Keyboard shortcut hint (1-4) */}
                  <span className="absolute bottom-1 right-1.5 text-[8px] text-white/15 font-mono font-bold">
                    {idx + 1}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Footer: turn info */}
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 gap-2 sm:gap-0 text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white/20">
            <span>Turn {battle.turn}</span>
            <span>{Math.max(0, MAX_TURNS - (battle.turn - 1))} moves remaining</span>
            <span>{isPve ? `Bot LV.${botLevel}` : 'PVP'}</span>
          </div>
        </div>
      </div>

      {battle.state === 'finished' && (() => {
        const isWin = battle.winner === battle.player1
        const accentColor = isWin ? '#22c55e' : '#ef4444'
        const accentDim   = isWin ? '#15803d' : '#991b1b'

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 animate-in fade-in duration-300">
            {/* Pixel scanline overlay on backdrop */}
            <div
              className="absolute inset-0 pointer-events-none opacity-[0.04]"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)',
                backgroundSize: '100% 4px',
              }}
            />

            {/* Card */}
            <div
              className="relative w-[340px] bg-[#0a0a14] border-2 overflow-hidden"
              style={{ borderColor: accentColor + '55' }}
            >
              {/* Pixel corner accents */}
              <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2" style={{ borderColor: accentColor }} />
              <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2" style={{ borderColor: accentColor }} />
              <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2" style={{ borderColor: accentColor }} />
              <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2" style={{ borderColor: accentColor }} />

              {/* Glow backdrop */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.07]"
                style={{ background: `radial-gradient(ellipse at center, ${accentColor}, transparent 70%)` }}
              />

              {/* Scanlines on card */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                  backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)',
                  backgroundSize: '100% 3px',
                }}
              />

              {/* ── Title strip ─────────────────────── */}
              <div
                className="relative border-b-2 px-6 pt-8 pb-5 flex flex-col items-center gap-2"
                style={{ borderColor: accentColor + '33' }}
              >
                {/* Big pixel icon */}
                <div className="text-6xl mb-1" style={{ imageRendering: 'pixelated', filter: `drop-shadow(0 0 12px ${accentColor})` }}>
                  {isWin ? '🏆' : '💀'}
                </div>

                {/* Title */}
                <h2
                  className="text-3xl font-fantasy font-black uppercase tracking-tight"
                  style={{ color: accentColor, textShadow: `0 0 20px ${accentColor}88` }}
                >
                  {isWin ? 'Victory!' : 'Defeated!'}
                </h2>

                {/* How it ended */}
                <div
                  className="border px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.2em]"
                  style={{ borderColor: accentColor + '44', color: accentColor + 'cc', background: accentColor + '11' }}
                >
                  {winReason === 'decision' ? '▶ DECISION — HP ADVANTAGE' : '▶ KNOCKOUT'}
                </div>

                {/* XP Award Banner */}
                {xpAwarded !== null && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <span className="text-orange-400 text-sm">✦</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">
                      +{xpAwarded} Brawlers XP
                    </span>
                    <span className="text-orange-400 text-sm">✦</span>
                  </div>
                )}
              </div>

              {/* ── HP comparison (decision only) ─── */}
              {winReason === 'decision' && (
                <div className="border-b-2 border-[#1a1a2e] px-6 py-4">
                  <div className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-3 text-center">Final HP</div>
                  <div className="flex items-center gap-3">
                    {/* Player */}
                    <div className="flex-1 text-center">
                      <div className="text-[9px] font-black text-white/40 uppercase mb-1 truncate">{battle.creature1.name}</div>
                      <div className="text-xl font-black text-green-400">{Math.round((battle.creature1Hp / battle.creature1.maxHp) * 100)}%</div>
                      <div className="mt-1 h-2 bg-[#1a1a2e] border border-white/10 relative overflow-hidden">
                        <div className="h-full bg-green-500 transition-all" style={{ width: `${(battle.creature1Hp / battle.creature1.maxHp) * 100}%` }} />
                        {[25,50,75].map(p => <div key={p} className="absolute top-0 bottom-0 w-px bg-black/50" style={{ left: `${p}%` }} />)}
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-white/20 flex-shrink-0">VS</div>
                    {/* Bot */}
                    <div className="flex-1 text-center">
                      <div className="text-[9px] font-black text-white/40 uppercase mb-1 truncate">{battle.creature2.name}</div>
                      <div className="text-xl font-black text-red-400">{Math.round((battle.creature2Hp / battle.creature2.maxHp) * 100)}%</div>
                      <div className="mt-1 h-2 bg-[#1a1a2e] border border-white/10 relative overflow-hidden">
                        <div className="h-full bg-red-500 transition-all" style={{ width: `${(battle.creature2Hp / battle.creature2.maxHp) * 100}%` }} />
                        {[25,50,75].map(p => <div key={p} className="absolute top-0 bottom-0 w-px bg-black/50" style={{ left: `${p}%` }} />)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Flavour text ─────────────────────── */}
              <div className="px-6 py-4 border-b-2 border-[#1a1a2e] text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/25 leading-relaxed">
                  {isWin
                    ? winReason === 'decision'
                      ? '▶ You outlasted your opponent\n— the arena bows to you'
                      : '▶ You have proven your strength in combat'
                    : winReason === 'decision'
                      ? '▶ You fought hard but fell short on endurance'
                      : '▶ The void consumes your champion this time'}
                </p>
              </div>

              {/* ── Buttons ─────────────────────────── */}
              <div className="px-6 py-5 flex flex-col gap-3">
                {isWin && onNextLevel && (
                  <button
                    onClick={() => { setMockBattle(null); setWinReason(null); onNextLevel() }}
                    className="w-full py-4 font-black text-sm uppercase tracking-widest text-white
                      border-b-4 transition-all active:border-b-0 active:translate-y-1"
                    style={{
                      background: '#e85c1a',
                      borderColor: '#7c2d00',
                    }}
                  >
                    ▶ Next Level
                  </button>
                )}
                <button
                  onClick={onFinish}
                  className="w-full py-4 font-black text-sm uppercase tracking-widest border-2 border-b-4 transition-all active:border-b-0 active:translate-y-1"
                  style={{
                    color: accentColor,
                    borderColor: accentColor + '44',
                    borderBottomColor: accentDim,
                    background: accentColor + '0d',
                  }}
                >
                  ▶ Return to Base
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

export default BattleArena
