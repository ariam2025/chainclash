import React from 'react'
import { Creature } from '../lib/types'
import { ELEMENT_COLORS, RARITY_COLORS } from '../lib/constants'
import { getCreatureImage } from '../lib/assets'
import { Sword, Shield, Zap, Sparkles, Trash2 } from 'lucide-react'

interface CreatureCardProps {
  creature: Creature;
  size?: 'small' | 'medium' | 'large';
  selected?: boolean;
  showStats?: boolean;
  isEnemy?: boolean;
  currentHp?: number;
  onClick?: () => void;
  onRelease?: (e: React.MouseEvent) => void;
}

const CreatureCard: React.FC<CreatureCardProps> = ({
  creature,
  size = 'medium',
  selected = false,
  showStats = true,
  isEnemy = false,
  currentHp,
  onClick,
  onRelease
}) => {
  const hp = currentHp !== undefined ? currentHp : creature.hp
  const hpPercent = (hp / creature.maxHp) * 100

  const getHpColor = () => {
    if (hpPercent > 60) return 'bg-green-400'
    if (hpPercent > 30) return 'bg-yellow-400'
    return 'bg-red-500 animate-pulse'
  }

  const elementColor = ELEMENT_COLORS[creature.element]

  const sizeConfigs = {
    small:  { container: 'w-[160px] h-[248px]', sprite: 'h-[96px]',  image: 'w-20 h-20', title: 'text-sm',  padding: 'p-2', statsVisible: false },
    medium: { container: 'w-[200px] h-[312px]', sprite: 'h-[120px]', image: 'w-24 h-24', title: 'text-base', padding: 'p-3', statsVisible: true  },
    large:  { container: 'w-[248px] h-[376px]', sprite: 'h-[152px]', image: 'w-32 h-32', title: 'text-lg',  padding: 'p-4', statsVisible: true  },
  }
  const cfg = sizeConfigs[size]

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col cursor-pointer select-none overflow-hidden
        bg-[#0c0c18] border-2 transition-all duration-150
        ${cfg.container}
        ${selected
          ? '-translate-y-1'
          : 'hover:-translate-y-0.5 hover:brightness-110'}
      `}
      style={{
        borderColor: selected ? elementColor : 'rgba(255,255,255,0.08)',
        boxShadow: selected
          ? `0 0 0 1px ${elementColor}44, inset 0 0 30px ${elementColor}18, 0 8px 32px ${elementColor}22`
          : 'none',
      }}
    >
      {/* Pixel scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Element glow */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 w-28 h-28 blur-[50px] opacity-15 pointer-events-none"
        style={{ backgroundColor: elementColor }}
      />

      {/* Rarity top strip */}
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{ backgroundColor: RARITY_COLORS[creature.rarity] }}
      />

      {/* Header row */}
      <div className="relative z-10 flex items-center justify-between px-2.5 pt-3 pb-1">
        <span
          className="text-[8px] font-black uppercase tracking-[0.2em]"
          style={{ color: elementColor }}
        >
          {creature.element}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-widest text-white/30">
            LV.{creature.level}
          </span>
          {/* Release button */}
          {onRelease && (
            <button
              onClick={(e) => { e.stopPropagation(); onRelease(e) }}
              className="text-white/20 hover:text-red-400 transition-colors"
              title="Release Brawler"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Sprite area — flat, dark bg, pixel border bottom */}
      <div
        className="relative mx-2.5 flex items-center justify-center border-b-2 border-white/5"
        style={{ height: cfg.sprite }}
      >
        <img
          src={getCreatureImage(creature.element)}
          alt={creature.name}
          className={`object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] ${cfg.image} ${isEnemy ? 'scale-x-[-1]' : ''}`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Info area */}
      <div className={`${cfg.padding} flex-1 flex flex-col justify-between relative z-10`}>
        {/* Name + rarity */}
        <div className="text-center mb-1">
          <h4 className={`font-fantasy font-bold truncate leading-tight ${cfg.title}`}>
            {creature.name}
          </h4>
          <div
            className="text-[7px] uppercase font-black tracking-[0.25em] mt-0.5"
            style={{ color: RARITY_COLORS[creature.rarity] + 'cc' }}
          >
            {creature.rarity}
          </div>
        </div>

        {/* HP bar */}
        <div className="w-full mt-auto">
          <div className="flex justify-between text-[8px] mb-1 font-black tracking-tight">
            <span className="text-white/40">HP</span>
            <span className="text-white/40">{hp}/{creature.maxHp}</span>
          </div>
          {/* Pixel-chunked HP bar */}
          <div className="w-full h-2 bg-[#1a1a2e] border border-white/10 relative overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getHpColor()}`}
              style={{ width: `${hpPercent}%` }}
            />
            {/* Chunk separators */}
            {[25, 50, 75].map(pct => (
              <div
                key={pct}
                className="absolute top-0 bottom-0 w-px bg-black/40"
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>
        </div>

        {/* Stats grid */}
        {showStats && cfg.statsVisible && (
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[8px] font-black uppercase pt-2 border-t border-white/5 mt-2 opacity-60">
            <div className="flex items-center gap-1"><Sword size={8} /><span>{creature.attack}</span></div>
            <div className="flex items-center gap-1"><Shield size={8} /><span>{creature.defense}</span></div>
            <div className="flex items-center gap-1"><Zap size={8} /><span>{creature.speed}</span></div>
            <div className="flex items-center gap-1"><Sparkles size={8} /><span>{creature.specialPower}</span></div>
          </div>
        )}
      </div>

      {/* XP bar at very bottom */}
      {!isEnemy && size !== 'small' && (
        <div className="w-full h-1 bg-[#1a1a2e]">
          <div
            className="h-full bg-blue-400 opacity-60"
            style={{ width: `${creature.xp % 100}%` }}
          />
        </div>
      )}

      {/* Selected pixel corner accents */}
      {selected && (
        <>
          <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2" style={{ borderColor: elementColor }} />
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2" style={{ borderColor: elementColor }} />
          <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2" style={{ borderColor: elementColor }} />
          <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2" style={{ borderColor: elementColor }} />
        </>
      )}
    </div>
  )
}

export default CreatureCard
