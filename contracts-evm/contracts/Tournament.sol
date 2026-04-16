// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract Tournament {
    uint8 public constant STATE_OPEN = 0;
    uint8 public constant STATE_ACTIVE = 1;
    uint8 public constant STATE_FINISHED = 2;

    error TournamentFull();
    error AlreadyEntered();
    error TournamentNotOpen();
    error InvalidTournament();
    error Unauthorized();
    error InvalidFee();
    error InvalidWinner();

    struct TournamentData {
        uint256 id;
        string name;
        address[] participants;
        uint256[] creatureIds;
        uint256 entryFee;
        uint8 state;
        address winner;
        uint256 prizePool;
        bool prizeClaimed;
    }

    address public owner;
    uint256 public totalTournaments;

    mapping(uint256 => TournamentData) private tournaments;
    uint256[] private tournamentIds;
    address[] public allWinners;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function createTournament(string calldata name, uint256 entryFee) external {
        totalTournaments += 1;
        TournamentData storage t = tournaments[totalTournaments];
        t.id = totalTournaments;
        t.name = name;
        t.entryFee = entryFee;
        t.state = STATE_OPEN;
        tournamentIds.push(totalTournaments);
    }

    function enterTournament(uint256 tournamentId, uint256 creatureId) external payable {
        TournamentData storage t = tournaments[tournamentId];
        if (t.id == 0) revert InvalidTournament();
        if (t.state != STATE_OPEN) revert TournamentNotOpen();
        if (t.participants.length >= 8) revert TournamentFull();
        if (msg.value != t.entryFee) revert InvalidFee();

        for (uint256 i = 0; i < t.participants.length; i++) {
            if (t.participants[i] == msg.sender) revert AlreadyEntered();
        }

        t.participants.push(msg.sender);
        t.creatureIds.push(creatureId);
        t.prizePool += msg.value;

        if (t.participants.length == 8) {
            t.state = STATE_ACTIVE;
        }
    }

    function setWinner(uint256 tournamentId, address winner) external onlyOwner {
        TournamentData storage t = tournaments[tournamentId];
        if (t.id == 0) revert InvalidTournament();
        if (t.state == STATE_FINISHED) revert TournamentNotOpen();

        bool isParticipant = false;
        for (uint256 i = 0; i < t.participants.length; i++) {
            if (t.participants[i] == winner) {
                isParticipant = true;
                break;
            }
        }
        if (!isParticipant) revert InvalidWinner();

        t.winner = winner;
        t.state = STATE_FINISHED;
        allWinners.push(winner);
    }

    function claimPrize(uint256 tournamentId) external {
        TournamentData storage t = tournaments[tournamentId];
        if (t.id == 0) revert InvalidTournament();
        if (t.state != STATE_FINISHED) revert TournamentNotOpen();
        if (msg.sender != t.winner) revert Unauthorized();
        if (t.prizeClaimed) revert Unauthorized();

        t.prizeClaimed = true;
        uint256 amount = t.prizePool;
        t.prizePool = 0;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "prize transfer failed");
    }

    function getTournament(uint256 id) external view returns (TournamentData memory) {
        return tournaments[id];
    }

    function getActiveTournamentIds() external view returns (uint256[] memory) {
        uint256[] memory tmp = new uint256[](tournamentIds.length);
        uint256 count = 0;

        for (uint256 i = 0; i < tournamentIds.length; i++) {
            uint256 id = tournamentIds[i];
            if (tournaments[id].state != STATE_FINISHED) {
                tmp[count] = id;
                count++;
            }
        }

        uint256[] memory activeIds = new uint256[](count);
        for (uint256 j = 0; j < count; j++) {
            activeIds[j] = tmp[j];
        }
        return activeIds;
    }
}
