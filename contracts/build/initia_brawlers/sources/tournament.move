module initia_brawlers::tournament {
    use std::vector;
    use std::string::{Self, String};
    use initia_std::signer;
    use initia_std::table::{Self, Table};
    use initia_brawlers::native_coin;

    const STATE_OPEN: u8 = 0;
    const STATE_ACTIVE: u8 = 1;
    const STATE_FINISHED: u8 = 2;

    const E_TOURNAMENT_FULL: u64 = 1;
    const E_ALREADY_ENTERED: u64 = 2;
    const E_TOURNAMENT_NOT_OPEN: u64 = 3;

    struct Tournament has store, copy, drop {
        id: u64,
        name: String,
        participants: vector<address>,
        creature_ids: vector<u64>,
        entry_fee: u64,
        state: u8,
        winner: address,
    }

    struct Registry has key {
        tournaments: Table<u64, Tournament>,
        tournament_ids: vector<u64>,
        total_tournaments: u64,
        all_winners: vector<address>,
    }

    public entry fun initialize(account: &signer) {
        move_to(account, Registry {
            tournaments: table::new(),
            tournament_ids: vector::empty(),
            total_tournaments: 0,
            all_winners: vector::empty(),
        });
    }

    public entry fun create_tournament(
        account: &signer,
        name_bytes: vector<u8>,
        entry_fee: u64
    ) acquires Registry {
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        let id = registry.total_tournaments + 1;
        
        let tournament = Tournament {
            id,
            name: string::utf8(name_bytes),
            participants: vector::empty(),
            creature_ids: vector::empty(),
            entry_fee,
            state: STATE_OPEN,
            winner: @0x0,
        };

        table::add(&mut registry.tournaments, id, tournament);
        vector::push_back(&mut registry.tournament_ids, id);
        registry.total_tournaments = id;
    }

    public entry fun enter_tournament(
        account: &signer,
        tournament_id: u64,
        creature_id: u64
    ) acquires Registry {
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        
        assert!(table::contains(&registry.tournaments, tournament_id), 0);
        let tournament = table::borrow_mut(&mut registry.tournaments, tournament_id);
        
        assert!(tournament.state == STATE_OPEN, E_TOURNAMENT_NOT_OPEN);
        assert!(vector::length(&tournament.participants) < 8, E_TOURNAMENT_FULL);
        assert!(!vector::contains(&tournament.participants, &addr), E_ALREADY_ENTERED);

        // Fee Escrow
        if (tournament.entry_fee > 0) {
            native_coin::transfer(account, @initia_brawlers, tournament.entry_fee);
        };

        vector::push_back(&mut tournament.participants, addr);
        vector::push_back(&mut tournament.creature_ids, creature_id);

        if (vector::length(&tournament.participants) == 8) {
            tournament.state = STATE_ACTIVE;
        };
    }

    #[view]
    public fun get_tournament(id: u64): Tournament acquires Registry {
        let registry = borrow_global<Registry>(@initia_brawlers);
        *table::borrow(&registry.tournaments, id)
    }

    #[view]
    public fun get_active_tournament_ids(): vector<u64> acquires Registry {
        let registry = borrow_global<Registry>(@initia_brawlers);
        let active_ids = vector::empty();
        let i = 0;
        let len = vector::length(&registry.tournament_ids);
        while (i < len) {
            let id = *vector::borrow(&registry.tournament_ids, i);
            let tournament = table::borrow(&registry.tournaments, id);
            if (tournament.state != STATE_FINISHED) {
                vector::push_back(&mut active_ids, id);
            };
            i = i + 1;
        };
        active_ids
    }
}
