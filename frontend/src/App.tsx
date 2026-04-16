import React, { useState } from 'react'
import LandingScreen from './components/LandingScreen'
import MintScreen from './components/MintScreen'
import StableScreen from './components/StableScreen'
import BattleArena from './components/BattleArena'
import StoreScreen from './components/StoreScreen'
import TournamentDashboard from './components/TournamentDashboard'
import TournamentBracket from './components/TournamentBracket'
import Leaderboard from './components/Leaderboard'
import { useCreature } from './hooks/useCreature'
import { useInterwovenKit } from './hooks/useInterwovenKit'

type Screen = 'landing' | 'mint' | 'stable' | 'battle' | 'tournament' | 'store'

const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('landing')
  const [activeBattleId, setActiveBattleId] = useState<number | null>(null)
  const [selectedCreatureId, setSelectedCreatureId] = useState<number | null>(null)
  const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null)
  const [botLevel, setBotLevel] = useState(1)
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  
  const { creatures } = useCreature()
  const { isConnected } = useInterwovenKit()

  const handleEnter = () => {
    // Reset bot level when entering from landing
    setBotLevel(1)
    // If we have creatures, go to stable (menu). Otherwise, go to mint.
    const hasBrawlers = creatures && creatures.length > 0;
    if (hasBrawlers) {
      setScreen('stable')
    } else {
      setScreen('mint')
    }
  }

  const handlePlayGuest = () => {
    // In guest mode, useCreature will provide mock brawlers
    setBotLevel(1)
    setScreen('stable')
  }

  const handleStartBattle = (battleId: number, playerCreatureId?: number) => {
    if (!battleId || isNaN(battleId)) return
    setActiveBattleId(battleId)
    if (playerCreatureId) setSelectedCreatureId(playerCreatureId)
    setScreen('battle')
  }

  const handleNextLevel = () => {
    setBotLevel(prev => prev + 1)
    setActiveBattleId(Math.floor(Math.random() * 10000))
    // Resetting battle state is handled by BattleArena re-initialization on prop change
  }

  return (
    <div className="min-h-screen bg-dark overflow-x-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* Dynamic Screens */}
      {screen === 'landing' && (
        <LandingScreen 
          onEnter={handleEnter} 
          onPlayGuest={handlePlayGuest} 
        />
      )}

      {screen === 'mint' && (
        <MintScreen 
          onSuccess={() => setScreen('stable')} 
        />
      )}

      {screen === 'stable' && (
        <StableScreen 
          onStartBattle={handleStartBattle}
          onMint={() => setScreen('mint')}
          onViewTournament={() => {
            setSelectedTournamentId(null);
            setScreen('tournament');
          }}
          onViewLeaderboard={() => setShowLeaderboard(true)}
          onViewStore={() => setScreen('store')}
        />
      )}

      {screen === 'battle' && activeBattleId !== null && (
        <BattleArena 
          battleId={activeBattleId} 
          playerCreatureId={selectedCreatureId || undefined}
          botLevel={botLevel}
          onFinish={() => setScreen('stable')} 
          onNextLevel={handleNextLevel}
        />
      )}

      {screen === 'store' && (
        <StoreScreen onBack={() => setScreen('stable')} />
      )}

      {screen === 'tournament' && (
        selectedTournamentId === null ? (
          <TournamentDashboard 
            onBack={() => setScreen('stable')}
            onViewBracket={(id) => setSelectedTournamentId(id)}
            creatures={creatures || undefined}
          />
        ) : (
          <div className="relative">
            <button 
              onClick={() => setSelectedTournamentId(null)}
              className="fixed top-8 left-8 z-50 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black uppercase hover:bg-white/10 transition-all backdrop-blur-xl flex items-center gap-3 group"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover:scale-150 transition-transform" />
              Return to Dashboard
            </button>
            <TournamentBracket tournamentId={selectedTournamentId} />
          </div>
        )
      )}

      {/* Global Overlays */}
      {showLeaderboard && (
        <Leaderboard onClose={() => setShowLeaderboard(false)} />
      )}
      
      {/* Simple Sidebar trigger if not on landing */}
      {screen !== 'landing' && !showLeaderboard && (
        <button 
          onClick={() => setShowLeaderboard(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-panel border-l border-y border-white/10 p-3 rounded-l-2xl hover:bg-white/5 transition-all z-40 group shadow-2xl"
        >
          <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
             <div className="w-1 h-3 bg-white/20 rounded-full" />
             <div className="w-1 h-5 bg-orange-500 rounded-full" />
             <div className="w-1 h-3 bg-white/20 rounded-full" />
          </div>
        </button>
      )}
    </div>
  )
}

export default App
