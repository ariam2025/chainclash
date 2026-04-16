module initia_brawlers::brawlers {
    use std::string::{String};
    use std::vector;
    use initia_std::table::{Self, Table};
    use initia_std::signer;
 
    friend initia_brawlers::battle;

    // --- CONSTANTS ---
    const MAX_LEVEL: u64 = 20;
    const MAX_INVENTORY: u64 = 6;

    // --- ERRORS ---
    const E_ALREADY_INITIALIZED: u64 = 1;
    const E_NOT_INITIALIZED: u64 = 2;
    const E_INVENTORY_FULL: u64 = 3;
    const E_INSUFFICIENT_FUNDS: u64 = 4;
    const E_CREATURE_NOT_FOUND: u64 = 5;

    struct Creature has store, copy, drop {
        id: u64,
        name: String,
        element: u8,    // 0=Fire,1=Water,2=Earth,3=Wind,4=Shadow
        rarity: u8,     // 0=Common,1=Rare,2=Epic,3=Legendary
        level: u64,
        xp: u64,
        hp: u64,
        max_hp: u64,
        attack: u64,
        defense: u64,
        speed: u64,
        special_power: u64,
        wins: u64,
        losses: u64,
        in_battle: bool,
    }

    struct Registry has key {
        creatures: Table<address, vector<Creature>>,
        usernames: Table<address, String>,
        registered_players: vector<address>,
        total_mints: u64,
    }

    public entry fun initialize(account: &signer) {
        let addr = signer::address_of(account);
        assert!(!exists<Registry>(addr), E_ALREADY_INITIALIZED);
        move_to(account, Registry {
            creatures: table::new(),
            usernames: table::new(),
            registered_players: vector::empty(),
            total_mints: 0,
        });
    }

    public entry fun set_username(account: &signer, username: String) acquires Registry {
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        table::upsert(&mut registry.usernames, signer::address_of(account), username);
    }

    public entry fun mint_creature(
        account: &signer,
        name: String,
        element: u8,
        rarity: u8,
        seed: u64
    ) acquires Registry {
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(@initia_brawlers);

        if (!table::contains(&registry.creatures, addr)) {
            table::add(&mut registry.creatures, addr, vector::empty());
            vector::push_back(&mut registry.registered_players, addr);
        };

        let inventory = table::borrow_mut(&mut registry.creatures, addr);
        assert!(vector::length(inventory) < MAX_INVENTORY, E_INVENTORY_FULL);

        // Handle Mint Fees
        let fee = get_mint_fee(rarity);
        if (fee > 0) {
            // In a real implementation, we would call coin::transfer or similar
            // For hackathon/local, we assume the user has funds
        };

        registry.total_mints = registry.total_mints + 1;
        let multiplier = get_rarity_multiplier(rarity);

        // Base Stats + Randomness
        let hp_var = seed % 20;
        let atk_var = seed % 5;
        let def_var = (seed + 1) % 5;
        let spd_var = (seed + 2) % 5;
        let spw_var = (seed + 3) % 6;

        let max_hp = (100 * multiplier / 100) + hp_var;
        let attack = (10 * multiplier / 100) + atk_var;
        let defense = (10 * multiplier / 100) + def_var;
        let speed = (10 * multiplier / 100) + spd_var;
        let special_power = (12 * multiplier / 100) + spw_var;

        let new_creature = Creature {
            id: registry.total_mints,
            name,
            element,
            rarity,
            level: 1,
            xp: 0,
            hp: max_hp,
            max_hp,
            attack,
            defense,
            speed,
            special_power,
            wins: 0,
            losses: 0,
            in_battle: false,
        };

        vector::push_back(inventory, new_creature);
    }

    // --- HELPERS ---

    fun get_mint_fee(rarity: u8): u64 {
        if (rarity == 1) return 500000;    // 0.5 INIT
        if (rarity == 2) return 1000000;   // 1.0 INIT
        if (rarity == 3) return 3000000;   // 3.0 INIT
        0 // Common is FREE
    }

    fun get_rarity_multiplier(rarity: u8): u64 {
        if (rarity == 1) return 120;
        if (rarity == 2) return 140;
        if (rarity == 3) return 160;
        100
    }

    // --- VIEW FUNCTIONS ---

    #[view]
    public fun get_stable(owner: address): vector<Creature> acquires Registry {
        let registry = borrow_global<Registry>(@initia_brawlers);
        if (table::contains(&registry.creatures, owner)) {
            *table::borrow(&registry.creatures, owner)
        } else {
            vector::empty()
        }
    }

    #[view]
    public fun get_all_players(): vector<address> acquires Registry {
        borrow_global<Registry>(@initia_brawlers).registered_players
    }

    #[view]
    public fun get_username(owner: address): String acquires Registry {
        let registry = borrow_global<Registry>(@initia_brawlers);
        if (table::contains(&registry.usernames, owner)) {
            *table::borrow(&registry.usernames, owner)
        } else {
            std::string::utf8(b"")
        }
    }

    #[view]
    public fun get_creature(owner: address, creature_id: u64): Creature acquires Registry {
        let registry = borrow_global<Registry>(@initia_brawlers);
        let inventory = table::borrow(&registry.creatures, owner);
        let len = vector::length(inventory);
        let i = 0;
        while (i < len) {
            let c = vector::borrow(inventory, i);
            if (c.id == creature_id) return *c;
            i = i + 1;
        };
        abort E_NOT_INITIALIZED
    }

    // --- INTERNAL LOGIC (for battle module only) ---

    public entry fun release_creature(account: &signer, creature_id: u64) acquires Registry {
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        assert!(table::contains(&registry.creatures, addr), E_NOT_INITIALIZED);

        let inventory = table::borrow_mut(&mut registry.creatures, addr);
        let len = vector::length(inventory);
        let i = 0;
        let found = false;
        while (i < len) {
            if (vector::borrow(inventory, i).id == creature_id) {
                vector::remove(inventory, i);
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, E_CREATURE_NOT_FOUND);
    }

    public(friend) fun add_xp(owner: address, creature_id: u64, amount: u64, is_win: bool) acquires Registry {
        let registry = borrow_global_mut<Registry>(@initia_brawlers);
        let inventory = table::borrow_mut(&mut registry.creatures, owner);
        let len = vector::length(inventory);
        let i = 0;
        while (i < len) {
            let c = vector::borrow_mut(inventory, i);
            if (c.id == creature_id) {
                c.xp = c.xp + amount;
                if (is_win) c.wins = c.wins + 1 else c.losses = c.losses + 1;
                
                // Check Level Up
                let xp_needed = c.level * 100;
                if (c.xp >= xp_needed && c.level < MAX_LEVEL) {
                    c.level = c.level + 1;
                    c.xp = c.xp - xp_needed;
                    c.max_hp = c.max_hp + 10;
                    c.attack = c.attack + 2;
                    c.defense = c.defense + 2;
                    c.speed = c.speed + 1;
                    c.hp = c.max_hp; // heal on level up
                };
                return
            };
            i = i + 1;
        };
    }
}
