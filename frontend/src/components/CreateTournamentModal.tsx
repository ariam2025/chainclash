import React, { useState } from 'react'
import { X, Trophy, Coins, Zap, Shield, Sparkles } from 'lucide-react'
import { useTournament } from '../hooks/useTournament'
import ConfirmModal from './ConfirmModal'

interface CreateTournamentModalProps {
  onClose: () => void;
  onCreated: (id: number) => void;
}

const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('CHAIN CLASH Cup')
  const [fee, setFee] = useState('2.0')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; variant: 'danger' | 'warning' | 'info' } | null>(null)
  const { createTournament } = useTournament()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await createTournament(name, parseFloat(fee))
      setAlertConfig({
        title: 'Championship Created',
        message: 'Your tournament has been initialized and is now open for registration!',
        variant: 'info'
      })
    } catch (err: any) {
      setAlertConfig({
        title: 'Creation Failed',
        message: err?.message || 'Failed to create the tournament.',
        variant: 'danger'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/85 animate-in fade-in duration-200">
      {/* Backdrop scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      {/* Modal panel */}
      <div className="relative w-full max-w-md max-h-[85vh] overflow-y-auto bg-[#0a0a14] border-2 shadow-[8px_8px_0px_rgba(0,0,0,0.9)]"
        style={{ borderColor: '#eab30840' }}
      >
        {/* Pixel corner accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-500/60" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-500/60" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-500/60" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-500/60" />

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025] z-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)',
            backgroundSize: '100% 3px',
          }}
        />

        {/* ── Title bar ──────────────────────────── */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b-2 border-[#1a1a2e] bg-[#0c0c18]">
          <div className="flex items-center gap-3">
            {/* Icon box */}
            <div className="w-9 h-9 bg-[#0a0a14] border-2 border-yellow-500/30 flex items-center justify-center flex-shrink-0">
              <Trophy size={16} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-[13px] font-fantasy font-black uppercase tracking-tight text-white">
                Host Championship
              </h2>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25 mt-0.5">
                ▶ Set the stakes for the arena
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-[#1a1a2e] flex items-center justify-center
              text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Form ───────────────────────────────── */}
        <form onSubmit={handleSubmit} className="relative z-10">

          {/* Championship Name field */}
          <div className="px-5 pt-5 pb-4 border-b-2 border-[#1a1a2e]">
            <label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.25em] text-white/25 mb-3">
              <Shield size={8} className="text-yellow-500" />
              Championship Name
            </label>
            <div
              className="flex items-center gap-3 border-2 border-[#1a1a2e] bg-[#08080f] px-4 py-3
                focus-within:border-yellow-500/50 transition-colors"
            >
              <Shield size={14} className="text-yellow-500/60 flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 font-fantasy text-base text-white placeholder:text-white/15"
                placeholder="The Grand Slam..."
                required
              />
            </div>
          </div>

          {/* Entry Fee field */}
          <div className="px-5 pt-5 pb-4 border-b-2 border-[#1a1a2e]">
            <label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.25em] text-white/25 mb-3">
              <Coins size={8} className="text-orange-500" />
              Entry Fee (ETH)
            </label>
            <div
              className="flex items-center gap-3 border-2 border-[#1a1a2e] bg-[#08080f] px-4 py-3
                focus-within:border-orange-500/50 transition-colors mb-3"
            >
              <Coins size={14} className="text-orange-500/60 flex-shrink-0" />
              <input
                type="number"
                step="0.1"
                min="0"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="bg-transparent border-none outline-none flex-1 font-mono text-base text-white placeholder:text-white/15"
                placeholder="0.0"
                required
              />
            </div>

            {/* Info note */}
            <div className="flex items-start gap-3 border-2 border-orange-500/20 bg-orange-500/[0.06] px-4 py-3">
              <Sparkles size={12} className="text-orange-500/60 flex-shrink-0 mt-0.5" />
              <p className="text-[9px] font-black uppercase tracking-wider text-orange-300/40 leading-relaxed">
                Note: 100% of entry fees are automatically deposited into the winner's prize pool.
              </p>
            </div>
          </div>

          {/* Submit button */}
          <div className="px-5 py-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 font-black text-[11px] uppercase tracking-widest text-white
                border-b-4 transition-all active:border-b-0 active:translate-y-1 select-none
                flex items-center justify-center gap-2
                disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: isSubmitting ? '#78350f' : '#ca8a04',
                borderColor: '#451a03',
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ▶ Publishing Event...
                </>
              ) : (
                <>
                  <Zap size={14} fill="currentColor" className="text-yellow-200" />
                  ▶ Initialize Championship
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={!!alertConfig}
        title={alertConfig?.title || 'System Message'}
        message={alertConfig?.message || ''}
        variant={alertConfig?.variant || 'info'}
        onConfirm={() => {
          if (alertConfig?.title === 'Championship Created') onCreated(Math.floor(Math.random() * 1000))
          setAlertConfig(null)
        }}
      />
    </div>
  )
}

export default CreateTournamentModal
