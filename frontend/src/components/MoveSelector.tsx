import React from 'react'
import { MoveType } from '../lib/types'
import { MOVE_DESCRIPTIONS } from '../lib/constants'

interface MoveSelectorProps {
  onSelect: (type: MoveType) => void;
  selectedMove: MoveType | null;
  disabled: boolean;
  isSubmitting: boolean;
}

// Per-move pixel art accent palette
const MOVE_ACCENTS: Record<string, { border: string; glow: string; labelClass: string; bg: string }> = {
  Attack:      { border: '#e85c1a', glow: 'rgba(232,92,26,0.5)',  labelClass: 'text-orange-400', bg: 'rgba(232,92,26,0.08)'  },
  HeavyAttack: { border: '#dc2626', glow: 'rgba(220,38,38,0.5)',  labelClass: 'text-red-400',    bg: 'rgba(220,38,38,0.08)'  },
  Defend:      { border: '#16a34a', glow: 'rgba(22,163,74,0.5)',  labelClass: 'text-green-400',  bg: 'rgba(22,163,74,0.08)'  },
  Special:     { border: '#7c3aed', glow: 'rgba(124,58,237,0.5)', labelClass: 'text-violet-400', bg: 'rgba(124,58,237,0.08)' },
}

const MoveSelector: React.FC<MoveSelectorProps> = ({ onSelect, selectedMove, disabled, isSubmitting }) => {
  const moves: MoveType[] = ['Attack', 'HeavyAttack', 'Defend', 'Special']

  return (
    <div className="w-full bg-[#0a0a12] border-2 border-[#1a1a2e]">
      {/* Label bar */}
      <div className="border-b-2 border-[#1a1a2e] px-4 py-1.5">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/20">▶ Select Move</p>
      </div>

      {/* Button grid */}
      <div className="grid grid-cols-4 gap-0">
        {moves.map((type, idx) => {
          const move = MOVE_ACCENTS[type]
          const desc = MOVE_DESCRIPTIONS[type]
          const isSelected = selectedMove === type
          const isDisabled = disabled || isSubmitting

          return (
            <button
              key={type}
              disabled={isDisabled}
              onClick={() => onSelect(type)}
              style={isSelected ? {
                borderBottom: `3px solid ${move.border}`,
                boxShadow: `inset 0 0 18px ${move.glow}, 0 0 12px ${move.glow}`,
                background: move.bg,
              } : {
                borderBottom: '3px solid transparent',
              }}
              className={`
                relative flex flex-col items-center justify-center gap-2 py-5 px-2
                border-r-2 border-[#1a1a2e] last:border-r-0
                transition-all duration-100 select-none
                ${isSelected
                  ? 'scale-[0.97]'
                  : isDisabled
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-white/[0.03] active:scale-[0.97] cursor-pointer'}
              `}
            >
              {/* Pixel corner dots */}
              <span className={`absolute top-1.5 left-1.5 w-1 h-1 ${isSelected ? 'bg-white/50' : 'bg-white/10'}`} />
              <span className={`absolute top-1.5 right-1.5 w-1 h-1 ${isSelected ? 'bg-white/50' : 'bg-white/10'}`} />

              {/* Icon */}
              <div className="w-10 h-10 flex items-center justify-center">
                {desc.image ? (
                  <img
                    src={desc.image}
                    alt={desc.label}
                    className={`w-9 h-9 object-contain ${isSelected ? 'drop-shadow-[0_0_8px_white]' : ''}`}
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <span className="text-3xl">{desc.emoji}</span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[9px] font-black uppercase tracking-[0.15em] ${isSelected ? move.labelClass : 'text-white/40'}`}>
                {desc.label}
              </span>

              {/* Desc tooltip visible on larger screens */}
              <span className="hidden md:block text-[8px] text-white/20 font-bold text-center px-1 leading-tight">
                {desc.desc}
              </span>

              {/* Selected shimmer */}
              {isSelected && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none" />}

              {/* Keyboard hint */}
              <span className="absolute bottom-1 right-1.5 text-[7px] text-white/10 font-mono font-bold">{idx + 1}</span>
            </button>
          )
        })}
      </div>

      {/* Footer hint */}
      <div className="border-t-2 border-[#1a1a2e] px-4 py-1">
        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/10">
          {isSubmitting ? '▶ Submitting...' : selectedMove ? `▶ ${MOVE_DESCRIPTIONS[selectedMove].desc}` : '▶ Tap or press 1–4 to choose'}
        </p>
      </div>
    </div>
  )
}

export default MoveSelector
