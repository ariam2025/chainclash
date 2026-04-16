// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Brawlers {
    uint256 public constant MAX_LEVEL = 20;
    uint256 public constant MAX_INVENTORY = 6;

    struct Creature {
        uint256 id;
        string name;
        uint8 element; // 0=Fire,1=Water,2=Earth,3=Wind,4=Shadow
        uint8 rarity; // 0=Common,1=Rare,2=Epic,3=Legendary
        uint256 level;
        uint256 xp;
        uint256 hp;
        uint256 maxHp;
        uint256 attack;
        uint256 defense;
        uint256 speed;
        uint256 specialPower;
        uint256 wins;
        uint256 losses;
        bool inBattle;
    }

    error InventoryFull();
    error CreatureNotFound();
    error Unauthorized();
    error InvalidFee();

    address public owner;
    address public battleContract;

    mapping(address => Creature[]) private creatures;
    mapping(address => string) public usernames;
    mapping(address => bool) private isRegistered;
    address[] private registeredPlayers;

    uint256 public totalMints;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyBattle() {
        if (msg.sender != battleContract) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setBattleContract(address battle) external onlyOwner {
        battleContract = battle;
    }

    function setUsername(string calldata username) external {
        usernames[msg.sender] = username;
    }

    function mintCreature(
        string calldata name,
        uint8 element,
        uint8 rarity,
        uint256 seed
    ) external payable {
        Creature[] storage inventory = creatures[msg.sender];
        if (inventory.length >= MAX_INVENTORY) revert InventoryFull();

        uint256 fee = getMintFee(rarity);
        if (msg.value != fee) revert InvalidFee();

        if (!isRegistered[msg.sender]) {
            isRegistered[msg.sender] = true;
            registeredPlayers.push(msg.sender);
        }

        totalMints += 1;
        uint256 multiplier = getRarityMultiplier(rarity);

        uint256 hpVar = seed % 20;
        uint256 atkVar = seed % 5;
        uint256 defVar = (seed + 1) % 5;
        uint256 spdVar = (seed + 2) % 5;
        uint256 spwVar = (seed + 3) % 6;

        uint256 maxHp = (100 * multiplier) / 100 + hpVar;
        uint256 attack = (10 * multiplier) / 100 + atkVar;
        uint256 defense = (10 * multiplier) / 100 + defVar;
        uint256 speed = (10 * multiplier) / 100 + spdVar;
        uint256 specialPower = (12 * multiplier) / 100 + spwVar;

        inventory.push(
            Creature({
                id: totalMints,
                name: name,
                element: element,
                rarity: rarity,
                level: 1,
                xp: 0,
                hp: maxHp,
                maxHp: maxHp,
                attack: attack,
                defense: defense,
                speed: speed,
                specialPower: specialPower,
                wins: 0,
                losses: 0,
                inBattle: false
            })
        );
    }

    function releaseCreature(uint256 creatureId) external {
        Creature[] storage inventory = creatures[msg.sender];
        uint256 len = inventory.length;
        for (uint256 i = 0; i < len; i++) {
            if (inventory[i].id == creatureId) {
                inventory[i] = inventory[len - 1];
                inventory.pop();
                return;
            }
        }
        revert CreatureNotFound();
    }

    function addXp(address player, uint256 creatureId, uint256 amount, bool isWin) external onlyBattle {
        Creature[] storage inventory = creatures[player];
        for (uint256 i = 0; i < inventory.length; i++) {
            Creature storage c = inventory[i];
            if (c.id == creatureId) {
                c.xp += amount;
                if (isWin) {
                    c.wins += 1;
                } else {
                    c.losses += 1;
                }

                uint256 xpNeeded = c.level * 100;
                if (c.xp >= xpNeeded && c.level < MAX_LEVEL) {
                    c.level += 1;
                    c.xp -= xpNeeded;
                    c.maxHp += 10;
                    c.attack += 2;
                    c.defense += 2;
                    c.speed += 1;
                    c.hp = c.maxHp;
                }
                return;
            }
        }
        revert CreatureNotFound();
    }

    function getStable(address player) external view returns (Creature[] memory) {
        return creatures[player];
    }

    function getAllPlayers() external view returns (address[] memory) {
        return registeredPlayers;
    }

    function getCreature(address player, uint256 creatureId) external view returns (Creature memory) {
        Creature[] storage inventory = creatures[player];
        for (uint256 i = 0; i < inventory.length; i++) {
            if (inventory[i].id == creatureId) {
                return inventory[i];
            }
        }
        revert CreatureNotFound();
    }

    function getMintFee(uint8 rarity) public pure returns (uint256) {
        if (rarity == 1) return 5e14; // 0.0005 ETH
        if (rarity == 2) return 1e15; // 0.001 ETH
        if (rarity == 3) return 3e15; // 0.003 ETH
        return 0;
    }

    function getRarityMultiplier(uint8 rarity) public pure returns (uint256) {
        if (rarity == 1) return 120;
        if (rarity == 2) return 140;
        if (rarity == 3) return 160;
        return 100;
    }

    function withdrawFees(address payable to) external onlyOwner {
        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "fee withdraw failed");
    }
}
