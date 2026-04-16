import React, { useState } from 'react'
import { useBrawlerXP, STORE_ITEMS } from '../hooks/useBrawlerXP'
import { useInterwovenKit } from '../hooks/useInterwovenKit'
import { useCreature } from '../hooks/useCreature'
import { getCreatureImage } from '../lib/assets'
import { ELEMENT_COLORS } from '../lib/constants'
import type { StoreItem } from '../lib/types'
import { ArrowLeft, ShoppingBag, Zap, Sparkles, Star, Lock, ChevronRight, CheckCircle2, Wallet, Loader2, Plus } from 'lucide-react'

interface StoreScreenProps {
  onBack: () => void
}

type StoreTab = 'powerups' | 'levelup' | 'topup' | 'cosmetics'

// ── XP Top-Up Packages ──────────────────────────────────────────────────────
const TREASURY_ADDRESS = '0x0000000000000000000000000000000000000000'

interface XpPackage {
  id: string
  label: string
  ethAmount: number
  weiAmount: string
  xpGranted: number
  badge?: string
  popular?: boolean
}

const XP_PACKAGES: XpPackage[] = [
  { id: 'starter',  label: 'Starter Pack',  ethAmount: 0.001,  weiAmount: '1000000000000000',  xpGranted: 150,  badge: '🔰' },
  { id: 'warrior',  label: 'Warrior Pack',  ethAmount: 0.0025, weiAmount: '2500000000000000',  xpGranted: 400,  badge: '⚔️', popular: true },
  { id: 'champion', label: 'Champion Pack', ethAmount: 0.005,  weiAmount: '5000000000000000',  xpGranted: 900,  badge: '🏆' },
  { id: 'legend',   label: 'Legend Pack',   ethAmount: 0.01,   weiAmount: '10000000000000000', xpGranted: 2000, badge: '👑' },
]

const COSMETICS = [
  { id: 'aura_fire',      name: 'Fire Aura',       description: 'Wrap your brawler in a blazing aura effect',      icon: '🔥', cost: 200 },
  { id: 'aura_shadow',    name: 'Shadow Shroud',    description: 'A dark shroud follows your every move',           icon: '🌑', cost: 200 },
  { id: 'title_champion', name: '"Champion" Title', description: 'Display a golden title above your name',          icon: '👑', cost: 300 },
  { id: 'trail_electric', name: 'Electric Trail',   description: 'Leave sparks behind with every battle',           icon: '⚡', cost: 250 },
]

const TAB_CONFIG = [
  { id: 'powerups'  as StoreTab, label: 'Power-Ups', icon: <Zap size={13} /> },
  { id: 'levelup'   as StoreTab, label: 'Level Up',  icon: <Star size={13} /> },
  { id: 'topup'     as StoreTab, label: 'Top Up XP', icon: <Plus size={13} /> },
  { id: 'cosmetics' as StoreTab, label: 'Cosmetics', icon: <Sparkles size={13} /> },
]

const StoreScreen: React.FC<StoreScreenProps> = ({ onBack }) => {
  const { xp, activePowerUps, buyPowerUp, buyLevelUp, addXp, getExtraLevels } = useBrawlerXP()
  const { isConnected, address, requestTxBlock } = useInterwovenKit()
  const { creatures } = useCreature()
  const [activeTab, setActiveTab] = useState<StoreTab>('powerups')
  const [selectedCreatureId, setSelectedCreatureId] = useState<number | null>(null)
  const [purchaseFlash, setPurchaseFlash] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Top-up state
  const [purchasingPkg, setPurchasingPkg] = useState<string | null>(null)
  const [topUpSuccess, setTopUpSuccess] = useState<{ xp: number; pkg: string } | null>(null)
  const [topUpError, setTopUpError] = useState<string | null>(null)

  const flash = (id: string, success: boolean) => {
    if (success) {
      setPurchaseFlash(id)
      setTimeout(() => setPurchaseFlash(null), 1500)
    } else {
      setErrorMsg('Not enough Brawlers XP!')
      setTimeout(() => setErrorMsg(null), 2500)
    }
  }

  const handleBuyPowerUp = (item: StoreItem) => {
    const ok = buyPowerUp(item)
    flash(item.id, ok)
  }

  const handleBuyLevelUp = () => {
    if (!selectedCreatureId) return
    const creature = creatures?.find(c => c.id === selectedCreatureId)
    if (!creature) return
    const extraLevels = getExtraLevels(creature.id)
    const effectiveLevel = creature.level + extraLevels
    const ok = buyLevelUp(creature.id, effectiveLevel)
    flash(`levelup_${creature.id}`, ok)
  }

  const handleTopUp = async (pkg: XpPackage) => {
    if (!isConnected || !address) {
      setTopUpError('Connect your wallet first!')
      setTimeout(() => setTopUpError(null), 3000)
      return
    }
    setPurchasingPkg(pkg.id)
    setTopUpError(null)
    setTopUpSuccess(null)
    try {
      const msg = {
        typeUrl: '/cosmos.bank.v1beta1.MsgSend',
        value: {
          fromAddress: address,
          toAddress: TREASURY_ADDRESS,
          amount: [{ denom: 'wei', amount: pkg.weiAmount }],
        },
      }
      await requestTxBlock({ messages: [msg] })
      addXp(pkg.xpGranted)
      setTopUpSuccess({ xp: pkg.xpGranted, pkg: pkg.id })
      setTimeout(() => setTopUpSuccess(null), 5000)
    } catch (err: any) {
      const m = err?.message || 'Transaction failed or was rejected'
      setTopUpError(m.length > 90 ? m.slice(0, 90) + '...' : m)
      setTimeout(() => setTopUpError(null), 5000)
    } finally {
      setPurchasingPkg(null)
    }
  }

  const hasActivePowerUp = (id: string) => activePowerUps.some(p => p.id === id)

  const selectedCreature = creatures?.find(c => c.id === selectedCreatureId)
  const selectedExtraLevels = selectedCreature ? getExtraLevels(selectedCreature.id) : 0
  const selectedEffectiveLevel = selectedCreature ? selectedCreature.level + selectedExtraLevels : 1
  const levelUpCost = selectedEffectiveLevel * 80

  return (
    <div className="min-h-screen bg-[#07070f] text-white flex flex-col relative overflow-hidden">
      {/* Pixel grid bg */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── HEADER ──────────────────────────────────────────── */}
      <header className="relative z-30 bg-[#0a0a14] border-b-2 border-[#1a1a2e] flex flex-col md:flex-row items-stretch justify-between">
        
        {/* Top/Left Section */}
        <div className="flex items-stretch justify-between md:justify-start border-b-2 md:border-b-0 border-[#1a1a2e]">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-0 border-r-2 border-[#1a1a2e] text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="flex items-center gap-3 px-4 md:px-6 py-3 md:py-0">
            <div className="p-1.5 bg-orange-500/10 border border-orange-500/20">
              <ShoppingBag size={16} className="text-orange-400" />
            </div>
            <div>
              <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Training HQ</div>
              <div className="font-fantasy font-bold text-sm uppercase tracking-wider">Brawlers Store</div>
            </div>
          </div>
        </div>

        {/* Bottom/Right Section */}
        <div className="flex items-center gap-3 px-6 py-3 md:py-0 md:pl-6 md:border-l-2 border-[#1a1a2e] md:ml-auto justify-end bg-[#0c0c18] md:bg-transparent">
          <div className="flex flex-col items-end">
            <div className="text-[9px] font-black text-white/30 uppercase tracking-widest">Brawlers XP</div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black text-orange-400 tabular-nums">{xp.toLocaleString()}</span>
              <span className="text-orange-500/60 text-sm">✦</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/15 border-2 border-orange-500/30 flex items-center justify-center animate-[spin_8s_linear_infinite]">
            <span className="text-xl">✦</span>
          </div>
        </div>
      </header>

      {/* ── TABS ────────────────────────────────────────────── */}
      <div className="relative z-20 bg-[#0a0a14] border-b-2 border-[#1a1a2e] flex overflow-x-auto hide-scrollbar">
        {TAB_CONFIG.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 px-5 py-4 text-[10px] sm:text-[10px] font-black uppercase tracking-widest border-r-2 border-[#1a1a2e] transition-all whitespace-nowrap flex-shrink-0
              ${activeTab === tab.id
                ? 'text-orange-400 bg-orange-500/5 border-b-2 border-b-orange-500 -mb-[2px]'
                : 'text-white/30 hover:text-white/60 hover:bg-white/[0.02]'
              }`}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'topup' && (
              <span className="ml-1 px-1 py-px text-[7px] bg-green-500/20 text-green-400 border border-green-500/40 font-black uppercase">
                ETH
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Global XP error */}
      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest">
            ✕ {errorMsg}
          </div>
        </div>
      )}

      {/* ── POWERUPS TAB ────────────────────────────────────── */}
      {activeTab === 'powerups' && (
        <main className="flex-1 relative z-10 p-6 lg:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-5 bg-orange-500 inline-block" />
                Power-Ups
              </h2>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 ml-5">
                Single-use stat boosts — active for your next battle only
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {STORE_ITEMS.filter(i => i.type === 'powerup').map(item => {
                const owned = hasActivePowerUp(item.id)
                const canAfford = xp >= item.cost
                const justBought = purchaseFlash === item.id
                return (
                  <div
                    key={item.id}
                    className={`relative bg-[#0a0a14] border-2 p-5 flex flex-col gap-4 transition-all duration-200
                      ${justBought ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : owned ? 'border-orange-500/40' : 'border-[#1a1a2e] hover:border-white/20'}`}
                  >
                    <span className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/10" />
                    <span className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10" />
                    <span className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10" />
                    <span className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/10" />

                    {owned && !justBought && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-[8px] font-black uppercase bg-orange-500/15 border border-orange-500/40 text-orange-400 px-2 py-0.5">
                        <CheckCircle2 size={9} /> Active
                      </div>
                    )}
                    {justBought && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 text-[8px] font-black uppercase bg-green-500/20 border border-green-500/40 text-green-400 px-2 py-0.5 animate-pulse">
                        ✓ Purchased!
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#13131f] border-2 border-[#1a1a2e] flex items-center justify-center text-2xl">{item.icon}</div>
                      <div>
                        <div className="font-fantasy font-bold text-sm">{item.name}</div>
                        <div className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">×{item.multiplier?.toFixed(2)} Multiplier</div>
                      </div>
                    </div>
                    <p className="text-[10px] text-white/50 font-mono leading-relaxed flex-1">{item.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-orange-400 font-black text-sm">{item.cost}</span>
                        <span className="text-orange-500/50 text-xs">XP</span>
                      </div>
                      <button
                        onClick={() => handleBuyPowerUp(item)}
                        disabled={!canAfford}
                        className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all active:border-b-0 active:translate-y-0.5
                          ${canAfford ? 'bg-orange-600 border-orange-800 text-white hover:brightness-110 cursor-pointer' : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'}`}
                      >
                        {canAfford ? 'Buy' : 'Need XP'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {activePowerUps.length > 0 && (
              <div className="mt-8 border-2 border-orange-500/20 bg-orange-500/5 p-5">
                <div className="text-[9px] font-black uppercase tracking-widest text-orange-400/70 mb-3">▶ Active for next battle</div>
                <div className="flex flex-wrap gap-2">
                  {activePowerUps.map(p => (
                    <div key={p.id + p.remainingBattles} className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-[9px] font-black uppercase">
                      <span className="text-orange-400">✦</span>
                      <span>{p.name}</span>
                      <span className="text-white/30">(×{p.multiplier.toFixed(2)})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── LEVEL UP TAB ────────────────────────────────────── */}
      {activeTab === 'levelup' && (
        <main className="flex-1 relative z-10 p-6 lg:p-10 flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-5 bg-yellow-500 inline-block" />
                Level Up Your Brawler
              </h2>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 ml-5">
                Permanently boost stats — stacks with base level
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {creatures && creatures.length > 0 ? creatures.map(creature => {
                const extra = getExtraLevels(creature.id)
                const effectiveLevel = creature.level + extra
                const cost = effectiveLevel * 80
                const isSelected = selectedCreatureId === creature.id
                const ec = ELEMENT_COLORS[creature.element]
                return (
                  <button
                    key={creature.id}
                    onClick={() => setSelectedCreatureId(creature.id)}
                    className={`flex items-center gap-3 p-3 border-2 text-left transition-all
                      ${isSelected ? 'border-yellow-500/60 bg-yellow-500/5 shadow-[0_0_12px_rgba(234,179,8,0.15)]' : 'border-[#1a1a2e] hover:border-white/20 bg-[#0a0a14]'}`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center border-2 flex-shrink-0" style={{ borderColor: ec + '44', background: ec + '11' }}>
                      <img src={getCreatureImage(creature.element)} alt={creature.name} className="w-10 h-10 object-contain" style={{ imageRendering: 'pixelated' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-fantasy font-bold text-sm truncate">{creature.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: ec }}>{creature.element}</span>
                        <span className="text-[9px] text-white/30 font-black">LV.{effectiveLevel}</span>
                        {extra > 0 && <span className="text-[8px] bg-yellow-500/15 text-yellow-400 border border-yellow-500/30 px-1 font-black uppercase">+{extra} boosted</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-black text-orange-400">{cost}</div>
                      <div className="text-[8px] text-white/30 uppercase font-black">XP</div>
                    </div>
                  </button>
                )
              }) : (
                <div className="col-span-2 p-10 border-2 border-dashed border-white/8 text-center text-[10px] text-white/20 font-black uppercase tracking-widest">
                  No brawlers in your stable yet
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[300px] flex-shrink-0">
            <div className="sticky top-6 bg-[#0a0a14] border-2 border-[#1a1a2e] p-5 flex flex-col gap-4">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/30 border-b-2 border-[#1a1a2e] pb-3">Level-Up Preview</div>
              {selectedCreature ? (
                <>
                  <div className="flex items-center gap-3">
                    <img src={getCreatureImage(selectedCreature.element)} className="w-14 h-14 object-contain" style={{ imageRendering: 'pixelated' }} alt="" />
                    <div>
                      <div className="font-fantasy font-bold">{selectedCreature.name}</div>
                      <div className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">Currently LV.{selectedEffectiveLevel}</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[{ label: 'ATK', gain: 8 }, { label: 'DEF', gain: 6 }, { label: 'SPD', gain: 5 }, { label: 'HP', gain: 10 }, { label: 'SP PWR', gain: 4 }].map(({ label, gain }) => (
                      <div key={label} className="flex items-center justify-between text-[10px] font-black uppercase">
                        <span className="text-white/40">{label}</span>
                        <span className="text-green-400">+{gain}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 py-2 bg-yellow-500/5 border border-yellow-500/20">
                    <Star size={12} className="text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">→ LV.{selectedEffectiveLevel + 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-black uppercase text-white/30">Cost</div>
                      <div className="text-xl font-black text-orange-400">{levelUpCost} <span className="text-sm text-orange-500/50">XP</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[9px] font-black uppercase text-white/30">Balance</div>
                      <div className={`text-xl font-black ${xp >= levelUpCost ? 'text-white' : 'text-red-400'}`}>{xp.toLocaleString()}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleBuyLevelUp}
                    disabled={xp < levelUpCost}
                    className={`w-full py-4 font-black text-sm uppercase tracking-widest border-b-4 transition-all active:border-b-0 active:translate-y-1
                      ${xp >= levelUpCost ? 'bg-yellow-500 border-yellow-700 text-black hover:brightness-110 cursor-pointer' : 'bg-white/5 border-white/5 text-white/20 cursor-not-allowed'}
                      ${purchaseFlash === `levelup_${selectedCreature.id}` ? '!bg-green-500 !border-green-700' : ''}
                    `}
                  >
                    {purchaseFlash === `levelup_${selectedCreature.id}` ? '✓ Leveled Up!' : xp >= levelUpCost ? '▶ Level Up!' : 'Not Enough XP'}
                  </button>
                </>
              ) : (
                <div className="p-6 border-2 border-dashed border-white/8 text-center text-[10px] text-white/20 font-black uppercase tracking-widest">
                  ← Select a brawler
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ── TOP UP XP TAB ───────────────────────────────────── */}
      {activeTab === 'topup' && (
        <main className="flex-1 relative z-10 p-6 lg:p-10">
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-5 bg-green-500 inline-block" />
                Top Up Brawlers XP
              </h2>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 ml-5">
                Pay with ETH on Base Sepolia — XP credited instantly to your account
              </p>
            </div>

            {/* Wallet status badge */}
            {!isConnected ? (
              <div className="mb-8 flex items-center gap-4 p-5 border-2 border-orange-500/30 bg-orange-500/5">
                <Wallet size={20} className="text-orange-400 flex-shrink-0" />
                <div>
                  <div className="font-black text-sm text-orange-400 uppercase tracking-widest">Wallet Not Connected</div>
                  <div className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-0.5">
                    Connect your Base wallet to purchase XP with ETH
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-8 flex items-center gap-3 p-3 border-2 border-green-500/20 bg-green-500/5">
                <span className="w-2 h-2 bg-green-400 flex-shrink-0" />
                <div className="text-[9px] font-black uppercase tracking-widest text-green-400/80">
                  Connected · Base Sepolia · Payment sent to treasury on confirmation
                </div>
              </div>
            )}

            {/* Success message */}
            {topUpSuccess && (
              <div className="mb-6 flex items-center gap-4 p-5 border-2 border-green-500/40 bg-green-500/10 animate-in fade-in slide-in-from-top-4 duration-300">
                <span className="text-3xl">✦</span>
                <div>
                  <div className="font-black text-sm text-green-400 uppercase tracking-widest">Payment Confirmed!</div>
                  <div className="text-[10px] text-white/50 font-black uppercase tracking-widest mt-0.5">
                    +{topUpSuccess.xp.toLocaleString()} Brawlers XP added to your balance
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {topUpError && (
              <div className="mb-6 flex items-center gap-4 p-4 border-2 border-red-500/30 bg-red-500/5 animate-in fade-in duration-200">
                <span className="text-red-400 font-black text-lg">✕</span>
                <div className="text-[10px] text-red-400 font-black uppercase tracking-wider">{topUpError}</div>
              </div>
            )}

            {/* Package cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {XP_PACKAGES.map(pkg => {
                const isLoading = purchasingPkg === pkg.id
                const anyLoading = !!purchasingPkg
                const justBought = topUpSuccess?.pkg === pkg.id

                return (
                  <div
                    key={pkg.id}
                    className={`relative border-2 p-6 flex flex-col gap-5 transition-all duration-200
                      ${justBought
                        ? 'border-green-500 bg-green-500/5 shadow-[0_0_24px_rgba(34,197,94,0.2)]'
                        : pkg.popular
                          ? 'border-orange-500/50 bg-orange-500/5'
                          : 'border-[#1a1a2e] bg-[#0a0a14] hover:border-white/20'
                      }`}
                  >
                    {/* Pixel corners */}
                    <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/10" />
                    <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/10" />
                    <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/10" />
                    <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/10" />

                    {/* Best Value ribbon */}
                    {pkg.popular && (
                      <div className="absolute -top-px left-1/2 -translate-x-1/2 px-3 py-0.5 bg-orange-500 text-[8px] font-black uppercase tracking-[0.25em] text-black">
                        BEST VALUE
                      </div>
                    )}

                    {/* Badge icon + name */}
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 flex items-center justify-center border-2 text-3xl flex-shrink-0
                        ${pkg.popular ? 'border-orange-500/40 bg-orange-500/10' : 'border-[#1a1a2e] bg-[#13131f]'}`}
                      >
                        {pkg.badge}
                      </div>
                      <div>
                        <div className="font-fantasy font-bold text-base">{pkg.label}</div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-white/30 mt-0.5">Base Sepolia · ETH</div>
                      </div>
                    </div>

                    {/* XP received row */}
                    <div className="flex items-center justify-between border-2 border-[#1a1a2e] bg-[#0c0c18] px-4 py-3">
                      <div className="text-[9px] font-black uppercase tracking-widest text-white/30">You receive</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black text-orange-400">{pkg.xpGranted.toLocaleString()}</span>
                        <span className="text-orange-500/50 font-black text-sm">XP ✦</span>
                      </div>
                    </div>

                    {/* Buy button */}
                    <button
                      onClick={() => handleTopUp(pkg)}
                      disabled={!isConnected || anyLoading}
                      className={`w-full py-4 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all
                        ${!isConnected || anyLoading
                          ? 'bg-white/5 border-2 border-b-4 border-white/5 text-white/20 cursor-not-allowed'
                          : pkg.popular
                            ? 'bg-orange-600 border-b-4 border-orange-800 text-white hover:brightness-110 cursor-pointer active:border-b-0 active:translate-y-1'
                            : 'bg-[#0c0c18] border-2 border-b-4 border-[#1a1a2e] border-b-black text-white/70 hover:text-white hover:border-white/20 cursor-pointer active:border-b-0 active:translate-y-1'
                        }`}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Awaiting Wallet...</span>
                        </>
                      ) : justBought ? (
                        <span className="text-green-400">✓ XP Credited!</span>
                      ) : (
                        <>
                          <Wallet size={14} />
                          Pay {pkg.ethAmount} ETH
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>

            {/* How it works */}
            <div className="mt-8 border-2 border-dashed border-white/8 p-6">
              <div className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-4">ℹ How it works</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { step: '01', text: 'Choose a package and click "Pay ETH"' },
                  { step: '02', text: 'Approve the transaction in your Base wallet popup' },
                  { step: '03', text: 'XP is instantly credited once the tx confirms' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <span className="text-orange-500/40 font-black text-xs font-mono flex-shrink-0">{s.step}</span>
                    <span className="text-[10px] text-white/30 font-black uppercase tracking-wider leading-relaxed">{s.text}</span>
                  </div>
                ))}
              </div>
              <div className="text-[9px] text-white/15 font-black uppercase tracking-widest mt-4">
                ▶ Base Sepolia ETH only · No real money · Get faucet at base.org/builders/faucet
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── COSMETICS TAB ───────────────────────────────────── */}
      {activeTab === 'cosmetics' && (
        <main className="flex-1 relative z-10 p-6 lg:p-10">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <h2 className="text-base font-black uppercase tracking-widest flex items-center gap-3">
                <span className="w-1.5 h-5 bg-violet-500 inline-block" />
                Cosmetics
              </h2>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mt-1 ml-5">
                Visual upgrades — coming soon to the arena
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COSMETICS.map(item => (
                <div key={item.id} className="relative bg-[#0a0a14] border-2 border-[#1a1a2e] p-5 flex flex-col gap-4 opacity-60">
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#07070f]/70 backdrop-blur-[2px]">
                    <Lock size={20} className="text-white/20 mb-2" />
                    <span className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20">Coming Soon</span>
                  </div>
                  <div className="w-14 h-14 bg-[#13131f] border-2 border-[#1a1a2e] flex items-center justify-center text-3xl mx-auto">{item.icon}</div>
                  <div className="text-center">
                    <div className="font-fantasy font-bold text-sm">{item.name}</div>
                    <p className="text-[9px] text-white/30 font-mono mt-1 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-orange-400 font-black">{item.cost}</span>
                    <span className="text-orange-500/40 text-xs">XP</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <div className="relative z-20 bg-[#0a0a14] border-t-2 border-[#1a1a2e] px-6 py-3 flex items-center justify-between">
        <div className="text-[9px] font-black uppercase tracking-widest text-white/20">
          Earn XP by defeating bots · Buy more with ETH
        </div>
        <div className="flex items-center gap-2">
          <ChevronRight size={10} className="text-orange-500/40" />
          <span className="text-[9px] font-black text-orange-400">{xp.toLocaleString()} XP available</span>
        </div>
      </div>
    </div>
  )
}

export default StoreScreen
