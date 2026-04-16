import React from 'react'
import { AlertCircle, X } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}) => {
  if (!isOpen) return null

  const variantColors = {
    danger: 'text-red-500 border-red-500/20 bg-red-500/5',
    warning: 'text-orange-500 border-orange-500/20 bg-orange-500/5',
    info: 'text-blue-500 border-blue-500/20 bg-blue-500/5',
  }

  const btnColors = {
    danger: 'bg-red-600 border-red-800 hover:bg-red-500',
    warning: 'bg-orange-600 border-orange-800 hover:bg-orange-500',
    info: 'bg-blue-600 border-blue-800 hover:bg-blue-500',
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 animate-in fade-in duration-200">
      {/* Backdrop scanlines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 4px)',
          backgroundSize: '100% 4px',
        }}
      />

      <div className="relative w-full max-w-sm bg-[#0a0a14] border-2 border-[#1a1a2e] shadow-[8px_8px_0px_rgba(0,0,0,0.9)] 
        flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Pixel corner accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/10 z-10" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/10 z-10" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/10 z-10" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/10 z-10" />

        {/* Scanline overlay for the card */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.02] z-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)',
            backgroundSize: '100% 3px',
          }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b-2 border-[#1a1a2e] bg-[#0c0c18]">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 border-2 flex items-center justify-center flex-shrink-0 ${variantColors[variant]}`}>
              <AlertCircle size={14} />
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
              {title}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-white/20 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 p-6 flex flex-col items-center text-center gap-4">
          <p className="text-[10px] font-bold text-white/60 leading-relaxed tracking-wider uppercase">
             {message}
          </p>
          <div className="w-12 h-0.5 bg-white/5" />
          <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/20 italic">
            ▶ Action Final - No Undo Possible
          </p>
        </div>

        {/* Footer / Actions */}
        <div className={`relative z-10 px-5 pb-5 pt-2 grid gap-3 ${onCancel ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {onCancel && (
            <button
              onClick={onCancel}
              className="py-3 bg-[#0c0c18] border-2 border-white/10 border-b-4 border-b-black/40 
                text-[9px] font-black uppercase tracking-widest text-white/40
                transition-all hover:text-white hover:border-white/20 active:border-b-2 active:translate-y-0.5"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`py-3 ${btnColors[variant]} border-b-4 text-[9px] font-black uppercase tracking-widest text-white
              transition-all active:border-b-0 active:translate-y-1`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
