// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBrawlers {
    function addXp(address player, uint256 creatureId, uint256 amount, bool isWin) external;
}

contract Battle {
    uint8 public constant STATE_WAITING = 0;
    uint8 public constant STATE_ACTIVE = 1;
    uint8 public constant STATE_FINISHED = 2;

    uint8 public constant MOVE_ATTACK = 0;
    uint8 public constant MOVE_DEFEND = 2;
    uint8 public constant MOVE_UNSET = 255;

    error Unauthorized();
    error BattleFinished();
    error AlreadySubmitted();
    error InvalidWager();
    error InvalidBattle();

    struct BattleData {
        uint256 battleId;
        address player1;
        address player2;
        uint256 creature1Id;
        uint256 creature2Id;
        uint256 creature1Hp;
        uint256 creature2Hp;
        uint8 p1Move;
        uint8 p2Move;
        uint8 state;
        address winner;
        bool isPve;
        uint8 botDifficulty;
        uint256 wager;
        uint256 turn;
        uint32[] battleLog;
    }

    mapping(uint256 => BattleData) private battles;
    mapping(uint256 => BattleData) private pendingChallenges;
    mapping(uint256 => bool) public pendingExists;
    uint256[] private challengeIds;

    uint256 public totalBattles;
    IBrawlers public immutable brawlers;

    constructor(address brawlersAddress) {
        brawlers = IBrawlers(brawlersAddress);
    }

    function startPveBattle(uint256 creatureId, uint256 creatureMaxHp, uint8 difficulty) external {
        totalBattles += 1;
        uint256 botHp = (creatureMaxHp * getBotMultiplier(difficulty)) / 100;

        BattleData storage b = battles[totalBattles];
        b.battleId = totalBattles;
        b.player1 = msg.sender;
        b.player2 = address(0);
        b.creature1Id = creatureId;
        b.creature2Id = 0;
        b.creature1Hp = creatureMaxHp;
        b.creature2Hp = botHp;
        b.p1Move = MOVE_UNSET;
        b.p2Move = MOVE_UNSET;
        b.state = STATE_ACTIVE;
        b.winner = address(0);
        b.isPve = true;
        b.botDifficulty = difficulty;
        b.wager = 0;
        b.turn = 1;
    }

    function challengePlayer(uint256 creatureId, address opponent, uint256 wager) external payable {
        if (msg.value != wager) revert InvalidWager();

        totalBattles += 1;
        BattleData storage b = pendingChallenges[totalBattles];
        b.battleId = totalBattles;
        b.player1 = msg.sender;
        b.player2 = opponent;
        b.creature1Id = creatureId;
        b.creature2Id = 0;
        b.creature1Hp = 0;
        b.creature2Hp = 0;
        b.p1Move = MOVE_UNSET;
        b.p2Move = MOVE_UNSET;
        b.state = STATE_WAITING;
        b.winner = address(0);
        b.isPve = false;
        b.botDifficulty = 0;
        b.wager = wager;
        b.turn = 1;
        pendingExists[totalBattles] = true;
        challengeIds.push(totalBattles);
    }

    function acceptChallenge(uint256 battleId, uint256 creatureId, uint256 creatureMaxHp) external payable {
        if (!pendingExists[battleId]) revert InvalidBattle();
        BattleData storage pending = pendingChallenges[battleId];
        if (pending.player2 != msg.sender) revert Unauthorized();
        if (msg.value != pending.wager) revert InvalidWager();

        BattleData storage b = battles[battleId];
        b.battleId = pending.battleId;
        b.player1 = pending.player1;
        b.player2 = pending.player2;
        b.creature1Id = pending.creature1Id;
        b.creature2Id = creatureId;
        b.creature1Hp = creatureMaxHp;
        b.creature2Hp = creatureMaxHp;
        b.p1Move = MOVE_UNSET;
        b.p2Move = MOVE_UNSET;
        b.state = STATE_ACTIVE;
        b.winner = address(0);
        b.isPve = false;
        b.botDifficulty = 0;
        b.wager = pending.wager;
        b.turn = 1;

        delete pendingChallenges[battleId];
        pendingExists[battleId] = false;
        _removeChallengeId(battleId);
    }

    function submitMove(uint256 battleId, uint8 moveType) external {
        BattleData storage b = battles[battleId];
        if (b.battleId == 0) revert InvalidBattle();
        if (b.state != STATE_ACTIVE) revert BattleFinished();

        if (msg.sender == b.player1) {
            if (b.p1Move != MOVE_UNSET) revert AlreadySubmitted();
            b.p1Move = moveType;
        } else if (msg.sender == b.player2) {
            if (b.p2Move != MOVE_UNSET) revert AlreadySubmitted();
            b.p2Move = moveType;
        } else {
            revert Unauthorized();
        }

        if (b.isPve) {
            b.p2Move = b.creature2Hp < 30 ? MOVE_DEFEND : MOVE_ATTACK;
        }

        if (b.p1Move != MOVE_UNSET && b.p2Move != MOVE_UNSET) {
            _resolveTurn(b);
        }
    }

    function _resolveTurn(BattleData storage b) internal {
        bool p1Defending = b.p1Move == MOVE_DEFEND;
        bool p2Defending = b.p2Move == MOVE_DEFEND;

        uint256 p1Dmg = p1Defending ? 0 : 15;
        uint256 p2Dmg = p2Defending ? 0 : 15;

        b.creature1Hp = b.creature1Hp > p2Dmg ? b.creature1Hp - p2Dmg : 0;
        b.creature2Hp = b.creature2Hp > p1Dmg ? b.creature2Hp - p1Dmg : 0;
        b.battleLog.push(uint32(block.timestamp));

        if (b.creature1Hp == 0 || b.creature2Hp == 0) {
            b.state = STATE_FINISHED;
            b.winner = b.creature2Hp == 0 ? b.player1 : b.player2;

            if (b.winner == b.player1) {
                brawlers.addXp(b.player1, b.creature1Id, 25, true);
                if (!b.isPve) {
                    brawlers.addXp(b.player2, b.creature2Id, 5, false);
                }
            } else {
                if (!b.isPve) {
                    brawlers.addXp(b.player2, b.creature2Id, 25, true);
                    brawlers.addXp(b.player1, b.creature1Id, 5, false);
                }
            }

            if (!b.isPve && b.wager > 0) {
                uint256 pot = b.wager * 2;
                (bool ok, ) = payable(b.winner).call{value: pot}("");
                require(ok, "wager payout failed");
            }
        } else {
            b.turn += 1;
            b.p1Move = MOVE_UNSET;
            b.p2Move = MOVE_UNSET;
        }
    }

    function getBotMultiplier(uint8 difficulty) public pure returns (uint256) {
        if (difficulty == 0) return 60;
        if (difficulty == 1) return 90;
        return 120;
    }

    function getTotalBattles() external view returns (uint256) {
        return totalBattles;
    }

    function getBattle(uint256 battleId) external view returns (BattleData memory) {
        return battles[battleId];
    }

    function getPendingBattle(uint256 battleId) external view returns (BattleData memory) {
        return pendingChallenges[battleId];
    }

    function getAllChallengeIds() external view returns (uint256[] memory) {
        return challengeIds;
    }

    function _removeChallengeId(uint256 battleId) internal {
        uint256 len = challengeIds.length;
        for (uint256 i = 0; i < len; i++) {
            if (challengeIds[i] == battleId) {
                challengeIds[i] = challengeIds[len - 1];
                challengeIds.pop();
                return;
            }
        }
    }
}
