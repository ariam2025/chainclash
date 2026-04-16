import React, { useState, useEffect } from 'react'
import { Zap, Trophy, Coins, X, ChevronRight } from 'lucide-react'
import { useWallet } from '../hooks/useWallet'
import { LCD_URL, CONTRACT_ADDRESS } from '../lib/constants'

interface PendingBattle {
  battleId: number;
  player1: string;
  username: string;
  wager: number;
}

interface ChallengeNotificationsProps {
  onAccept: (battleId: number) => void;
}

const ChallengeNotifications: React.FC<ChallengeNotificationsProps> = ({ onAccept }) => {
  const { address } = useWallet()
  const [challenges, setChallenges] = useState<PendingBattle[]>([])

  useEffect(() => {
    if (!address) return;

    const checkChallenges = async () => {
      try {
        // 1. Get all pending IDs
        const idsRes = await fetch(`${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            function_name: 'get_all_challenge_ids',
            type_args: [],
            args: [],
          }),
        });
        const idsData = await idsRes.json();
        const ids = idsData.data || [];

        // 2. Fetch details and filter
        const details = await Promise.all(ids.map(async (id: string) => {
          const res = await fetch(`${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              function_name: 'get_pending_battle',
              type_args: [],
              args: [id],
            }),
          });
          const d = await res.json();
          const battle = d.data;

          if (battle && battle.player2 === address) {
            // Fetch username for player1
            const nameRes = await fetch(`${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                function_name: 'get_username',
                type_args: [],
                args: [battle.player1],
              }),
            });
            const nameData = await nameRes.json();
            return {
              battleId: Number(battle.battle_id),
              player1: battle.player1,
              username: nameData.data || '',
              wager: Number(battle.wager) / 1_000_000,
            };
          }
          return null;
        }));

        const filtered = details.filter((d): d is PendingBattle & { username: string } => d !== null);

        setChallenges(filtered);
      } catch (err) {
        console.error("Failed to check challenges:", err);
      }
    };

    const interval = setInterval(checkChallenges, 10000); // Check every 10s
    checkChallenges();
    return () => clearInterval(interval);
  }, [address]);

  if (challenges.length === 0) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[50] flex flex-col gap-3 w-full max-w-md pointer-events-none">
      {challenges.map((c) => (
        <div 
          key={c.battleId}
          className="bg-orange-600 border border-orange-500 rounded-2xl p-4 shadow-[0_10px_50px_rgba(234,88,12,0.3)] flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500 pointer-events-auto"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                <Trophy size={20} />
             </div>
              <div>
                 <div className="text-[10px] font-black uppercase tracking-widest text-orange-200">New Duel Challenge!</div>
                 <div className="text-sm font-bold text-white flex items-center gap-2">
                    {c.username ? `${c.username}.base` : `${c.player1.slice(0, 6)}...${c.player1.slice(-4)}`}
                    <span className="text-orange-900/50 scale-125 mx-1">/</span>
                    <div className="flex items-center gap-1 text-orange-100 italic">
                       <Coins size={12} fill="currentColor" />
                      {c.wager} ETH
                    </div>
                 </div>
              </div>
          </div>

          <button 
            onClick={() => onAccept(c.battleId)}
            className="px-6 py-2 bg-white text-orange-600 rounded-lg font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group shadow-lg"
          >
            ACCEPT
            <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default ChallengeNotifications
