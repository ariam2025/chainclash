import React, { useState, useEffect } from 'react'
import { X, Search, Coins, Trophy, Zap } from 'lucide-react'
import { useBattle } from '../hooks/useBattle'
import { LCD_URL, CONTRACT_ADDRESS } from '../lib/constants'
import ConfirmModal from './ConfirmModal'

interface ChallengeModalProps {
  creatureId: number;
  onClose: () => void;
  onChallengeStarted: (battleId: number) => void;
}

interface Player {
  address: string;
  username: string;
  isOnline: boolean;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ creatureId, onClose, onChallengeStarted }) => {
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState('')
  const [wager, setWager] = useState('1.0')
  const [isLoading, setIsLoading] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{ title: string; message: string; variant: 'danger' | 'warning' | 'info' } | null>(null)
  const { createChallenge } = useBattle(null)

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await fetch(`${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            function_name: 'get_all_players',
            type_args: [],
            args: [],
          }),
        })
        const data = await res.json()
        const addrs: string[] = data.data || []

        // Fetch usernames for each player
        const playersWithNames = await Promise.all(addrs.map(async (addr) => {
          try {
            const nameRes = await fetch(`${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                function_name: 'get_username',
                type_args: [],
                args: [addr],
              }),
            })
            const nameData = await nameRes.json()
            return {
              address: addr,
              username: nameData.data || '',
              isOnline: true // Simulated for now
            }
          } catch {
            return { address: addr, username: '', isOnline: true }
          }
        }))

        setPlayers(playersWithNames)
      } catch (err) {
        console.error("Failed to fetch players:", err)
      }
    }
    fetchPlayers()
  }, [])

  const handleChallenge = async (opponent: string) => {
    setIsLoading(true)
    try {
      const uinitWager = parseFloat(wager) * 1_000_000
      await createChallenge(creatureId, opponent, Math.floor(uinitWager))
      setAlertConfig({
        title: 'Challenge Sent',
        message: 'Your challenge has been broadcasted! Wait for your opponent to accept.',
        variant: 'info'
      })
    } catch (err: any) {
      setAlertConfig({
        title: 'Challenge Failed',
        message: err?.message || 'Failed to send challenge.',
        variant: 'danger'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPlayers = players.filter(p => 
    p.address.toLowerCase().includes(search.toLowerCase()) || 
    p.username.toLowerCase().includes(search.toLowerCase())
  )

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

      <div className="relative w-full max-w-md bg-[#0a0a14] border-2 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh]"
        style={{ borderColor: '#e85c1a40' }}
      >
        {/* Pixel corner accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-500/60 z-10" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-orange-500/60 z-10" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-orange-500/60 z-10" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-500/60 z-10" />

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025] z-0"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 3px)',
            backgroundSize: '100% 3px',
          }}
        />

        {/* ── Header ──────────────────────────── */}
        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b-2 border-[#1a1a2e] bg-[#0c0c18]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0a0a14] border-2 border-orange-500/30 flex items-center justify-center flex-shrink-0">
              <Trophy size={16} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-[13px] font-fantasy font-black uppercase tracking-tight text-white">
                Find Opponent
              </h2>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/25 mt-0.5">
                ▶ Challenge for Glory & ETH
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-[#1a1a2e] flex items-center justify-center
              text-white/30 hover:text-red-400 hover:border-red-500/30 transition-colors bg-[#0a0a14]"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Wager Input ───────────────────────── */}
        <div className="relative z-10 px-5 pt-5 pb-4 border-b-2 border-[#1a1a2e] bg-[#0a0a14]">
          <label className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[0.25em] text-white/25 mb-3">
            <Coins size={8} className="text-orange-500" />
            Set Your Wager (ETH)
          </label>
          <div
            className="flex items-center gap-3 border-2 border-[#1a1a2e] bg-[#08080f] px-4 py-3
              focus-within:border-orange-500/50 transition-colors mb-3"
          >
            <Coins size={16} className="text-orange-500/60 flex-shrink-0" />
            <input
              type="number"
              step="0.1"
              value={wager}
              onChange={(e) => setWager(e.target.value)}
              className="bg-transparent border-none outline-none flex-1 font-mono text-xl text-white placeholder:text-white/15"
              placeholder="0.0"
            />
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-white/20 italic">
            * Both players escrow this amount. Winner takes all.
          </p>
        </div>

        {/* ── Search ────────────────────────────── */}
        <div className="relative z-10 px-5 pt-5 pb-3 bg-[#0a0a14]">
          <div className="relative flex items-center border-2 border-[#1a1a2e] bg-[#08080f] focus-within:border-orange-500/50 transition-colors">
            <Search className="absolute left-4 text-white/20" size={14} />
            <input
              type="text"
              placeholder="SEARCH BY NAME OR WALLET..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent py-3 pl-10 pr-4 text-[10px] font-black tracking-widest uppercase text-white focus:outline-none placeholder:text-white/15"
            />
          </div>
        </div>

        {/* ── Player List ───────────────────────── */}
        <div className="relative z-10 flex-1 overflow-y-auto px-5 pb-5 pt-2 space-y-3 custom-scrollbar">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <button
                key={player.address}
                onClick={() => handleChallenge(player.address)}
                disabled={isLoading}
                className="w-full p-4 bg-[#0c0c18] border-2 border-[#1a1a2e] border-b-4 border-b-black
                  flex items-center justify-between group transition-all
                  hover:bg-[#10101c] hover:border-orange-500/30 active:border-b-2 active:translate-y-0.5"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border-2 border-[#1a1a2e] bg-[#08080f] flex items-center justify-center text-orange-500 font-black text-[10px] relative">
                    {player.address.slice(-2).toUpperCase()}
                    {player.isOnline && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 border border-black" />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-bold font-mono text-white/80">
                      {player.username ? `${player.username}.base` : `${player.address.slice(0, 8)}...${player.address.slice(-6)}`}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-[8px] font-black uppercase tracking-widest text-green-400 group-hover:animate-pulse">▶ Battle Ready</div>
                      {player.username && (
                         <div className="text-[7px] font-mono text-white/20">{player.address.slice(0, 8)}...</div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="w-8 h-8 border-2 border-[#1a1a2e] bg-[#08080f] group-hover:bg-orange-500/20 group-hover:border-orange-500/40 text-orange-500 flex items-center justify-center transition-all opacity-40 group-hover:opacity-100">
                  <Zap size={14} fill="currentColor" />
                </div>
              </button>
            ))
          ) : (
            <div className="py-12 border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center opacity-20 mt-2">
              <Search size={24} className="mb-4" />
              <p className="text-[9px] font-black uppercase tracking-[0.25em] leading-loose">
                ▶ No rivals found<br/>in this sector
              </p>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#0a0a14]/90 backdrop-blur-sm z-50 flex items-center justify-center flex-col gap-5">
             <div className="w-8 h-8 border-4 border-[#1a1a2e] border-t-orange-500 border-l-orange-500 animate-spin" style={{ borderRadius: '0' }} />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 animate-pulse">
               ▶ Initializing Duel...
             </span>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!alertConfig}
        title={alertConfig?.title || 'System Message'}
        message={alertConfig?.message || ''}
        variant={alertConfig?.variant || 'info'}
        onConfirm={() => {
          if (alertConfig?.title === 'Challenge Sent') onClose()
          setAlertConfig(null)
        }}
      />
    </div>
  )
}

export default ChallengeModal
