import { useQuery } from '@tanstack/react-query'
import { useInterwovenKit } from './useInterwovenKit'
import { buildCreateTournament, buildEnterTournament, buildClaimPrize } from '../lib/transactions'
import { LCD_URL, CONTRACT_ADDRESS, MOCK_MODE } from '../lib/constants'
import { TournamentEntry } from '../lib/types'

// MOCK DATA SETUP
let mockTournamentsList: TournamentEntry[] = [
  {
    id: 1,
    name: "CHAIN CLASH Clash",
    participants: ["0xmock1", "0xmock2", "0xmock3"],
    round: 1,
    winner: null,
    prizePool: 6.0,
    isOpen: true,
    entryFee: 2.0,
    weekNumber: 3,
  } as any,
  {
    id: 2,
    name: "Brawler's Gauntlet",
    participants: ["0xmock1", "0xmock2", "0xmock3", "0xmock4", "0xmock5", "0xmock6", "0xmock7", "0xmock8"],
    round: 2,
    winner: null,
    prizePool: 8.0,
    isOpen: false,
    entryFee: 1.0,
    weekNumber: 3,
  } as any
];
let nextTournamentId = 3;

export function useTournament() {
  const { address, requestTxBlock } = useInterwovenKit()

  // Fetch all active tournament IDs
  const { data: tournamentIds, isLoading: idsLoading } = useQuery({
    queryKey: ['tournamentIds'],
    queryFn: async (): Promise<number[]> => {
      // USING MOCK DATA
      return mockTournamentsList.map(t => t.id);
    },
    refetchInterval: 10000,
  });

  // Fetch details for all IDs
  const { data: tournaments, isLoading: detailsLoading, refetch } = useQuery({
    queryKey: ['tournaments', tournamentIds],
    enabled: !!tournamentIds && tournamentIds.length > 0,
    queryFn: async (): Promise<TournamentEntry[]> => {
      // USING MOCK DATA
      return mockTournamentsList;
    },
    refetchInterval: 10000,
  });


  const createTournament = async (name: string, feeInit: number) => {
    // USING MOCK DATA
    const newTournament = {
      id: nextTournamentId++,
      name: name || "Custom Tournament",
      participants: [],
      round: 1,
      winner: null,
      prizePool: 0,
      isOpen: true,
      entryFee: feeInit,
      weekNumber: 3,
    };
    mockTournamentsList.unshift(newTournament as any);
    await refetch();
    return { transactionHash: 'mock_tx_hash' };
  };

  const joinTournament = async (tournamentId: number, creatureId: number) => {
    // USING MOCK DATA
    const t = mockTournamentsList.find((t) => t.id === tournamentId);
    if (!t) throw new Error('Tournament not found');
    if (t.participants.length >= 8) throw new Error('Tournament is full');
    
    t.participants.push(`0xuser_creature_${creatureId}`);
    t.prizePool += t.entryFee;
    if (t.participants.length === 8) {
       t.isOpen = false;
    }
    await refetch();
    return { transactionHash: 'mock_tx_hash' };
  };

  const deleteTournament = async (tournamentId: number) => {
    // USING MOCK DATA
    const index = mockTournamentsList.findIndex((t) => t.id === tournamentId);
    if (index === -1) throw new Error('Tournament not found');
    mockTournamentsList.splice(index, 1);
    await refetch();
    return { transactionHash: 'mock_tx_hash' };
  };

  return {
    tournaments,
    isLoading: idsLoading || detailsLoading,
    createTournament,
    joinTournament,
    deleteTournament,
  }
}
