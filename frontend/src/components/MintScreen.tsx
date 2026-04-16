import React, { useState } from 'react'
import { ELEMENTS, RARITIES, ELEMENT_COLORS, RARITY_COLORS } from '../lib/constants'
import { ElementType, RarityType, Creature } from '../lib/types'
import CreatureCard from './CreatureCard'
import { Sparkles, Wand2 } from 'lucide-react'
import { useCreature } from '../hooks/useCreature'
import { getCreatureImage } from '../lib/assets'

interface MintScreenProps {
  onSuccess: () => void;
}

const MintScreen: React.FC<MintScreenProps> = ({ onSuccess }) => {
  const [element, setElement] = useState<ElementType>('Fire')
  const [rarity, setRarity] = useState<RarityType>('Common')
  const [name, setName] = useState('')
  const { mintCreature } = useCreature()
  const [isMinting, setIsMinting] = useState(false)
  const [errorStatus, setErrorStatus] = useState<string | null>(null)

  const handleMint = async () => {
    if (!name) return
    setIsMinting(true)
    setErrorStatus(null)
    try {
      await mintCreature(name, ELEMENTS.indexOf(element as any), RARITIES.indexOf(rarity as any))
      onSuccess()
    } catch (err: any) {
      console.error('Minting failed:', err)
      setErrorStatus(err.message || 'Minting failed. Please check your wallet.')
    } finally {
      setIsMinting(false)
    }
  }

  const previewCreature: Creature = {
    id: 0,
    name: name || 'ENTER NAME...',
    element: element,
    rarity: rarity,
    level: 1,
    xp: 0,
    hp: 100,
    maxHp: 100,
    attack: 12,
    defense: 10,
    speed: 10,
    specialPower: 15,
    wins: 0,
    losses: 0,
    inBattle: false,
  }

  return (
    <div className="min-h-screen bg-[#07070f] text-white flex flex-col items-center relative overflow-hidden">
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

      <div className="relative z-10 w-full max-w-6xl p-6 md:p-12 mb-8">
        
        {/* Header row */}
        <div className="flex items-center justify-between mb-10 pb-4 border-b-2 border-[#1a1a2e]">
          <div className="flex items-center gap-4">
            <span className="w-2 h-10 bg-orange-500" />
            <div>
              <h1 className="text-3xl font-fantasy font-black uppercase text-orange-500 tracking-tight">Summon Brawler</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mt-1">▶ Setup your first creature origins</p>
            </div>
          </div>
          <button 
            onClick={onSuccess}
            className="px-5 py-3 bg-[#0a0a14] border-2 border-[#1a1a2e] border-b-4 border-b-black/80
              text-[10px] font-black tracking-widest hover:border-white/20 hover:text-white text-white/40 transition-all uppercase
              active:border-b-2 active:translate-y-0.5"
          >
            ▶ Skip to Menu
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          
          {/* Left: Configuration */}
          <div className="space-y-8">
            {/* Step 1: Element */}
            <section className="bg-[#0a0a14] border-2 border-[#1a1a2e] p-6 relative">
              <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/10" />
              <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/10" />
              
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-5 flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-[#1a1a2e] bg-[#0c0c18] flex items-center justify-center text-orange-500">1</span>
                Choose Element
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                {ELEMENTS.map(el => {
                  const isSel = element === el;
                  return (
                    <button
                      key={el}
                      onClick={() => setElement(el as ElementType)}
                      className="flex flex-col items-center gap-3 p-4 border-2 transition-all border-b-4 active:border-b-2 active:translate-y-0.5"
                      style={isSel ? {
                        background: `${ELEMENT_COLORS[el as ElementType]}15`,
                        borderColor: `${ELEMENT_COLORS[el as ElementType]}88`,
                        borderBottomColor: `${ELEMENT_COLORS[el as ElementType]}aa`,
                      } : {
                        background: '#0c0c18',
                        borderColor: '#1a1a2e',
                        borderBottomColor: '#00000088',
                      }}
                    >
                      <img 
                        src={getCreatureImage(el as ElementType)} 
                        alt={el} 
                        className={`w-12 h-12 object-contain ${isSel ? 'drop-shadow-md grayscale-0 opacity-100' : 'grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100'}`} 
                        style={{ imageRendering: 'pixelated' }}
                      />
                      <span 
                        className="text-[10px] font-black uppercase tracking-widest"
                        style={{ color: isSel ? ELEMENT_COLORS[el as ElementType] : 'rgba(255,255,255,0.4)' }}
                      >
                        {el}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Step 2: Rarity */}
            <section className="bg-[#0a0a14] border-2 border-[#1a1a2e] p-6 relative">
              <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/10" />
              <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/10" />

              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-5 flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-[#1a1a2e] bg-[#0c0c18] flex items-center justify-center text-orange-500">2</span>
                Select Rarity
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {RARITIES.map(r => {
                  const isSel = rarity === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRarity(r as RarityType)}
                      className="p-3 text-left border-2 transition-all border-b-4 active:border-b-2 active:translate-y-0.5"
                      style={isSel ? {
                        background: `${RARITY_COLORS[r]}15`,
                        borderColor: `${RARITY_COLORS[r]}66`,
                        borderBottomColor: `${RARITY_COLORS[r]}88`,
                      } : {
                        background: '#0c0c18',
                        borderColor: '#1a1a2e',
                        borderBottomColor: '#00000088',
                      }}
                    >
                      <div className="text-[10px] font-black uppercase mb-1 tracking-widest" style={{ color: isSel ? RARITY_COLORS[r] : 'rgba(255,255,255,0.3)' }}>{r}</div>
                      <div className="text-[7px] text-white/40 font-black uppercase tracking-widest" style={isSel ? { color: RARITY_COLORS[r] } : {}}>
                        Mul {r === 'Common' ? '1.0' : r === 'Rare' ? '1.2' : r === 'Epic' ? '1.4' : '1.6'}x
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Step 3: Name */}
            <section className="bg-[#0a0a14] border-2 border-[#1a1a2e] p-6 relative">
              <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/10" />
              <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white/10" />

              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-5 flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-[#1a1a2e] bg-[#0c0c18] flex items-center justify-center text-orange-500">3</span>
                Assign Name
              </h3>
              <div className="relative border-2 border-[#1a1a2e] bg-[#08080f] focus-within:border-orange-500/50 transition-colors flex items-center">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ENTER BRAWLER NAME..."
                  className="w-full bg-transparent px-5 py-4 outline-none font-fantasy text-lg text-white placeholder:text-white/20 uppercase"
                />
                <Wand2 className="absolute right-5 text-orange-500/50" size={16} />
              </div>
              <div className="mt-4 flex gap-2">
                {['Flambo', 'Aquara', 'Stonkus'].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setName(n)}
                    className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border-2 border-[#1a1a2e] bg-[#0c0c18] hover:border-white/20 text-white/40 hover:text-white transition-colors"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </section>

            <button
              onClick={handleMint}
              disabled={!name || isMinting}
              className="w-full py-5 font-black text-sm uppercase tracking-widest text-white border-b-4 transition-all active:border-b-0 active:translate-y-1 select-none flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: (!name || isMinting) ? '#1a1a2e' : '#e85c1a',
                borderColor: (!name || isMinting) ? '#0a0a14' : '#7c2d00',
              }}
            >
              {isMinting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ▶ SUMMONING...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  ▶ SUMMON CREATURE
                </>
              )}
            </button>

            {errorStatus && (
              <div className="bg-red-500/10 border-2 border-red-500/30 p-4 text-red-500 text-[10px] font-black uppercase tracking-widest flex flex-col gap-2 relative">
                <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-red-500/60" />
                <span>▶ ERROR: {errorStatus}</span>
                {errorStatus.includes('0x1') && (
                  <span className="text-red-500/60 leading-relaxed">
                    Hint: CONTRACT_ADDRESS is set to placeholder "0x1". Update it in constants.ts.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="bg-[#0a0a14] border-2 border-[#1a1a2e] p-8 relative flex flex-col items-center justify-center overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)', backgroundSize: '100% 3px' }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 pointer-events-none blur-3xl" style={{ background: `radial-gradient(circle at center, ${ELEMENT_COLORS[element]}, transparent 60%)` }} />
            
            {/* Corner accents */}
            <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/15" />
            <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/15" />
            <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/15" />
            <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/15" />

            <div className="text-center mb-10 w-full border-b-2 border-[#1a1a2e] pb-4 relative z-10">
              <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Live Data Scan</h4>
              <p className="text-[8px] text-white/30 font-black uppercase tracking-widest mt-1">Stats randomize within rarity</p>
            </div>

            {/* Render the creature card at exactly large size (it naturally fits nicely now) */}
            <div className="relative z-10">
               <CreatureCard creature={previewCreature} size="large" />
            </div>
            
            <div className="mt-10 px-4 py-2 border-2 border-[#1a1a2e] bg-[#0c0c18] relative z-10 text-[9px] font-black uppercase tracking-widest text-[var(--element-color)] animate-pulse" style={{ '--element-color': ELEMENT_COLORS[element] } as React.CSSProperties}>
              ▶ SYSTEM READY
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MintScreen
