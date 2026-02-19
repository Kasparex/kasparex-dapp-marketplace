// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title LoyaltyPoints
 * @dev Soulbound participation points. Multiplier from KREX tier (hardcoded thresholds).
 * @notice Only authorized callers (e.g. FeeRouter) can call awardPointsWithMultiplier.
 */
contract LoyaltyPoints is Ownable {
    uint256 public constant BPS = 10000;

    struct LoyaltyData {
        uint256 totalPoints;
        uint256 participationDays;
        uint256 lastActivity;
        uint256 streakDays;
    }

    mapping(address => LoyaltyData) public userLoyalty;
    mapping(string => uint256) public actionPoints;
    uint256 public streakInterval = 86400;

    mapping(address => bool) public authorizedCallers;
    IERC20 public krexToken; // optional: set to read balance for tier multiplier

    // Hardcoded KREX tier thresholds (18 decimals, same as tKREX/KREX)
    uint256 private constant TIER1_MIN = 1 * 10**18;
    uint256 private constant TIER2_MIN = 10_000_000 * 10**18;
    uint256 private constant TIER3_MIN = 50_000_000 * 10**18;
    uint256 private constant TIER4_MIN = 100_000_000 * 10**18;

    event PointsAwarded(address indexed user, string actionType, uint256 points, uint256 totalPoints, uint256 timestamp);
    event StreakUpdated(address indexed user, uint256 streakDays, uint256 timestamp);
    event ActionPointsUpdated(string actionType, uint256 oldPoints, uint256 newPoints);
    event AuthorizedCallerSet(address indexed caller, bool allowed);
    event KREXTokenSet(address indexed token);

    modifier onlyAuthorized() {
        require(authorizedCallers[msg.sender], "LoyaltyPoints: Unauthorized");
        _;
    }

    constructor() Ownable(msg.sender) {
        actionPoints["vote"] = 10;
        actionPoints["proposal"] = 50;
        actionPoints["payment"] = 5;
        actionPoints["dapp-payment"] = 5;
        actionPoints["product-purchase"] = 10;
        actionPoints["article-creation"] = 20;
        actionPoints["listing"] = 15;
        actionPoints["quiz-completion"] = 25;
        actionPoints["dao-vote"] = 3;
        actionPoints["game-entry"] = 10;
        actionPoints["daily_login"] = 1;
    }

    /**
     * @dev Returns tier multiplier in BPS. Tier0=10000, Tier1=10000, Tier2=20000, Tier3=50000, Tier4=100000.
     */
    function _tierMultiplierBps(address user) internal view returns (uint256) {
        if (address(krexToken) == address(0)) return BPS;
        uint256 bal = krexToken.balanceOf(user);
        if (bal < TIER1_MIN) return BPS;   // Tier0: 1x
        if (bal < TIER2_MIN) return BPS;   // Tier1: 1x
        if (bal < TIER3_MIN) return 20000; // Tier2: 2x
        if (bal < TIER4_MIN) return 50000; // Tier3: 5x
        return 100000;                     // Tier4: 10x
    }

    /**
     * @dev Award points with on-chain KREX tier multiplier. Only callable by authorized (e.g. FeeRouter).
     */
    function awardPointsWithMultiplier(address user, string memory actionType) external onlyAuthorized {
        require(user != address(0), "LoyaltyPoints: Invalid user");
        uint256 basePoints = actionPoints[actionType];
        if (basePoints == 0) return;
        uint256 multBps = _tierMultiplierBps(user);
        uint256 points = (basePoints * multBps) / BPS;
        if (points == 0) points = 1;

        LoyaltyData storage loyalty = userLoyalty[user];
        uint256 prevActivity = loyalty.lastActivity;
        loyalty.totalPoints += points;
        loyalty.lastActivity = block.timestamp;

        if (prevActivity > 0 && (block.timestamp - prevActivity) >= streakInterval) {
            loyalty.participationDays++;
            if ((block.timestamp - prevActivity) < 2 * streakInterval) {
                loyalty.streakDays++;
            } else {
                loyalty.streakDays = 1;
            }
            emit StreakUpdated(user, loyalty.streakDays, block.timestamp);
        }

        emit PointsAwarded(user, actionType, points, loyalty.totalPoints, block.timestamp);
    }

    /**
     * @dev Legacy: award base points only. Restricted to owner.
     */
    function awardPoints(address user, string memory actionType) external onlyOwner {
        require(user != address(0), "LoyaltyPoints: Invalid user");
        uint256 points = actionPoints[actionType];
        if (points == 0) return;
        LoyaltyData storage loyalty = userLoyalty[user];
        uint256 prevActivity = loyalty.lastActivity;
        loyalty.totalPoints += points;
        loyalty.lastActivity = block.timestamp;
        if (prevActivity > 0 && (block.timestamp - prevActivity) >= streakInterval) {
            loyalty.participationDays++;
            if ((block.timestamp - prevActivity) < 2 * streakInterval) loyalty.streakDays++;
            else loyalty.streakDays = 1;
            emit StreakUpdated(user, loyalty.streakDays, block.timestamp);
        }
        emit PointsAwarded(user, actionType, points, loyalty.totalPoints, block.timestamp);
    }

    function awardPointsBatch(address[] memory users, string[] memory actionTypes) external onlyOwner {
        require(users.length == actionTypes.length, "LoyaltyPoints: Array length mismatch");
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            string memory actionType = actionTypes[i];
            if (user == address(0)) continue;
            uint256 points = actionPoints[actionType];
            if (points == 0) continue;
            LoyaltyData storage loyalty = userLoyalty[user];
            loyalty.totalPoints += points;
            loyalty.lastActivity = block.timestamp;
            emit PointsAwarded(user, actionType, points, loyalty.totalPoints, block.timestamp);
        }
    }

    function getUserLoyalty(address user) external view returns (LoyaltyData memory) {
        return userLoyalty[user];
    }

    function getTotalPoints(address user) external view returns (uint256) {
        return userLoyalty[user].totalPoints;
    }

    function getStreak(address user) external view returns (uint256) {
        return userLoyalty[user].streakDays;
    }

    function setActionPoints(string memory actionType, uint256 points) external onlyOwner {
        uint256 oldPoints = actionPoints[actionType];
        actionPoints[actionType] = points;
        emit ActionPointsUpdated(actionType, oldPoints, points);
    }

    function setStreakInterval(uint256 _interval) external onlyOwner {
        streakInterval = _interval;
    }

    function setAuthorizedCaller(address caller, bool allowed) external onlyOwner {
        require(caller != address(0), "LoyaltyPoints: Invalid caller");
        authorizedCallers[caller] = allowed;
        emit AuthorizedCallerSet(caller, allowed);
    }

    function setKREXToken(address _krexToken) external onlyOwner {
        krexToken = IERC20(_krexToken);
        emit KREXTokenSet(_krexToken);
    }
}
