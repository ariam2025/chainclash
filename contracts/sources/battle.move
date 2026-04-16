module initia_brawlers::battle {
    use std::vector;
    use initia_std::signer;
    use initia_std::table::{Self, Table};
    use initia_brawlers::native_coin;
    use initia_brawlers::brawlers;

    // --- CONSTANTS ---
    const STATE_ACTIVE: u8 = 1;
    const STATE_FINISHED: u8 = 2;

    const MOVE_ATTACK: u8 = 0;
    const MOVE_DEFEND: u8 = 2;

    // --- ERRORS ---
    const E_ALREADY_SUBMITTED: u64 = 2;
    const E_BATTLE_FINISHED: u64 = 3;

    struct Battle has store, copy, drop {
        battle_id: u64,
        player1: address,
        player2: address,
        creature1_id: u64,
        creature2_id: u64,
        creature1_hp: u64,
        creature2_hp: u64,
        p1_move: u8,
        p2_move: u8,
        state: u8,
        winner: address,
        is_pve: bool,
        bot_difficulty: u8,
        wager: u64,
        turn: u64,
        battle_log: vector<u32>,
    }

    struct Registry has key {
        battles: Table<u64, Battle>,
        pending_challenges: Table<u64, Battle>,
        challenge_ids: vector<u64>,
        total_battles: u64,
    }

    public entry fun initialize(account: &signer) {
        move_to(account, Registry {
            battles: table::new(),
            pending_challenges: table::new(),
            challenge_ids: vector::empty(),
            total_battles: 0,
        });
    }

    /// Start a PvE battle. creature_max_hp is passed from the frontend
    /// so we don't need to cross-import the brawlers module.
    public entry fun start_pve_battle(
        account: &signer,
        creature_id: u64,
        creature_max_hp: u64,
        difficulty: u8
    ) acquires Registry {
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        registry.total_battles = registry.total_battles + 1;

        let bot_hp = creature_max_hp * get_bot_multiplier(difficulty) / 100;

        let battle = Battle {
            battle_id: registry.total_battles,
            player1: addr,
            player2: @0x0,
            creature1_id: creature_id,
            creature2_id: 0,
            creature1_hp: creature_max_hp,
            creature2_hp: bot_hp,
            p1_move: 255,
            p2_move: 255,
            state: STATE_ACTIVE,
            winner: @0x0,
            is_pve: true,
            bot_difficulty: difficulty,
            wager: 0,
            turn: 1,
            battle_log: vector::empty(),
        };

        table::add(&mut registry.battles, registry.total_battles, battle);
    }

    /// Challenge another player with an on-chain wager.
    public entry fun challenge_player(
        account: &signer,
        creature_id: u64,
        opponent: address,
        wager: u64
    ) acquires Registry {
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        registry.total_battles = registry.total_battles + 1;

        // Escrow wager
        if (wager > 0) {
            native_coin::transfer(account, @initia_brawlers, wager);
        };

        let battle = Battle {
            battle_id: registry.total_battles,
            player1: addr,
            player2: opponent,
            creature1_id: creature_id,
            creature2_id: 0, // set on accept
            creature1_hp: 0,  // set on accept
            creature2_hp: 0,  // set on accept
            p1_move: 255,
            p2_move: 255,
            state: 0, // WAITING
            winner: @0x0,
            is_pve: false,
            bot_difficulty: 0,
            wager,
            turn: 1,
            battle_log: vector::empty(),
        };

        table::add(&mut registry.pending_challenges, registry.total_battles, battle);
        vector::push_back(&mut registry.challenge_ids, registry.total_battles);
    }

    /// Accept an incoming challenge and start the battle.
    public entry fun accept_challenge(
        account: &signer,
        battle_id: u64,
        creature_id: u64,
        creature_max_hp: u64
    ) acquires Registry {
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        let battle = table::remove(&mut registry.pending_challenges, battle_id);

        assert!(battle.player2 == addr, 1); // Not for you

        // Escrow opponent's wager
        if (battle.wager > 0) {
            native_coin::transfer(account, @initia_brawlers, battle.wager);
        };

        battle.creature2_id = creature_id;
        battle.creature2_hp = creature_max_hp;
        battle.creature1_hp = creature_max_hp; // assume same scale for now
        battle.state = STATE_ACTIVE;

        table::add(&mut registry.battles, battle_id, battle);
        
        let (found, idx) = vector::index_of(&registry.challenge_ids, &battle_id);
        if (found) {
            vector::remove(&mut registry.challenge_ids, idx);
        };
    }

    public entry fun submit_move(
        account: &signer,
        battle_id: u64,
        move_type: u8
    ) acquires Registry {
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        let battle = table::borrow_mut(&mut registry.battles, battle_id);

        assert!(battle.state == STATE_ACTIVE, E_BATTLE_FINISHED);

        if (battle.player1 == addr) {
            assert!(battle.p1_move == 255, E_ALREADY_SUBMITTED);
            battle.p1_move = move_type;
        } else if (battle.player2 == addr) {
            assert!(battle.p2_move == 255, E_ALREADY_SUBMITTED);
            battle.p2_move = move_type;
        } else {
            abort 1 // Unauthorized
        };

        // If PVE, bot reacts immediately
        if (battle.is_pve) {
            let bot_move = if (battle.creature2_hp < 30) MOVE_DEFEND else MOVE_ATTACK;
            battle.p2_move = bot_move;
        };

        // If both moves in, resolve turn
        if (battle.p1_move != 255 && battle.p2_move != 255) {
            resolve_turn(battle);
        };
    }

    // --- INTERNAL ---

    fun resolve_turn(battle: &mut Battle) {
        let p1_move = battle.p1_move;
        let p2_move = battle.p2_move;
        let p1_defending = p1_move == MOVE_DEFEND;
        let p2_defending = p2_move == MOVE_DEFEND;

        // Damage resolution
        let p1_dmg = if (p1_defending) 0 else 15;
        let p2_dmg = if (p2_defending) 0 else 15;

        // Apply Damage
        battle.creature1_hp = if (battle.creature1_hp > p2_dmg) battle.creature1_hp - p2_dmg else 0;
        battle.creature2_hp = if (battle.creature2_hp > p1_dmg) battle.creature2_hp - p1_dmg else 0;

        // Check Victory
        if (battle.creature1_hp == 0 || battle.creature2_hp == 0) {
            battle.state = STATE_FINISHED;
            let winner = if (battle.creature2_hp == 0) battle.player1 else battle.player2;
            battle.winner = winner;

            // Handle Rewards & Wagers
            if (winner == battle.player1) {
                brawlers::add_xp(battle.player1, battle.creature1_id, 25, true);
                if (!battle.is_pve) {
                    brawlers::add_xp(battle.player2, battle.creature2_id, 5, false);
                    if (battle.wager > 0) {
                        // Transfer stake to winner
                        // (Requires signer for @initia_brawlers, which we can get in a real setup)
                        // For now we assume prize payout logic is handled.
                    };
                };
            } else {
                 if (!battle.is_pve) {
                    brawlers::add_xp(battle.player2, battle.creature2_id, 25, true);
                    brawlers::add_xp(battle.player1, battle.creature1_id, 5, false);
                 };
            };
        } else {
            battle.turn = battle.turn + 1;
            battle.p1_move = 255;
            battle.p2_move = 255;
        };
    }

    fun get_bot_multiplier(difficulty: u8): u64 {
        if (difficulty == 0) return 60;
        if (difficulty == 1) return 90;
        120
    }

    #[view]
    public fun get_total_battles(): u64 acquires Registry {
        borrow_global<Registry>(@initia_brawlers).total_battles
    }

    #[view]
    public fun get_battle(battle_id: u64): Battle acquires Registry {
        *table::borrow(&borrow_global<Registry>(@initia_brawlers).battles, battle_id)
    }

    #[view]
    public fun get_pending_battle(battle_id: u64): Battle acquires Registry {
        *table::borrow(&borrow_global<Registry>(@initia_brawlers).pending_challenges, battle_id)
    }

    #[view]
    public fun get_all_challenge_ids(): vector<u64> acquires Registry {
        borrow_global<Registry>(@initia_brawlers).challenge_ids
    }
}
