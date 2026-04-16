import { useQuery } from '@tanstack/react-query'
import { LeaderboardEntry } from '../lib/types'
import { MOCK_MODE, LCD_URL, CONTRACT_ADDRESS } from '../lib/constants'

export function useLeaderboard() {
  return useQuery({
    queryKey: ['leaderboard'],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      try {
        // 1. Get all players
        const playersRes = await fetch(`${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            function_name: 'get_all_players',
            type_args: [],
            args: [],
          }),
        });
        const playersData = await playersRes.json();
        const playerAddrs: string[] = playersData.data || [];

        // 2. Fetch stables for all players (Limited to first 20 for performance)
        const entries = await Promise.all(playerAddrs.slice(0, 20).map(async (addr) => {
          const stableRes = await fetch(`${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              function_name: 'get_stable',
              type_args: [],
              args: [addr],
            }),
          });
          const stableData = await stableRes.json();
          const stable = stableData.data || [];

          // Aggregate user stats
          let totalWins = 0;
          let totalBattles = 0;
          let highestLevel = 1;
          
          stable.forEach((c: any) => {
            totalWins += Number(c.wins);
            totalBattles += (Number(c.wins) + Number(c.losses));
            highestLevel = Math.max(highestLevel, Number(c.level));
          });

          // Fetch real username
          const nameRes = await fetch(`${LCD_URL}/initia/move/v1/accounts/${CONTRACT_ADDRESS}/view_functions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              function_name: 'get_username',
              type_args: [],
              args: [addr],
            }),
          });
          const nameData = await nameRes.json();
          const username = nameData.data || `${addr.slice(0, 6)}...${addr.slice(-4)}`;

          return {
            address: addr,
            username,
            totalBattles,
            totalWins,
            tournamentWins: 0,
            bestCreatureLevel: highestLevel
          };
        }));

        // 3. Sort by wins & return top 10
        return entries
          .sort((a, b) => b.totalWins - a.totalWins)
          .slice(0, 10);
          
      } catch (err) {
        console.error("Leaderboard fetch failed:", err);
        return [];
      }
    },
    refetchInterval: 30000,
  })
}
