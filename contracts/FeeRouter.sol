// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FeeCollector.sol";
import "./RevenueTreeManager.sol";
import "./RewardManager.sol";
import "./LoyaltyPoints.sol";

/**
 * @title FeeRouter
 * @dev Splits fee (Revenue Tree + FeeCollector), optionally distributes GRID reward and awards points.
 * @notice dApps call forwardFeeAndRevenue(payer) or forwardFeeAndRevenueWithRewards(payer, transactionType).
 */
contract FeeRouter is Ownable {
    uint256 public constant BPS = 10000;

    RevenueTreeManager public revenueTreeManager;
    FeeCollector public feeCollector;
    uint256 public treeBps;

    RewardManager public rewardManager;
    LoyaltyPoints public loyaltyPoints;
    mapping(string => uint256) public baseRewardWei; // transactionType => GRID wei (18 decimals)

    mapping(address => bool) public authorizedDApps;

    event Forwarded(address indexed payer, uint256 total, uint256 toTree, uint256 toTreasury);
    event ForwardedWithRewards(address indexed payer, uint256 total, string transactionType, uint256 rewardWei);
    event TreeBpsUpdated(uint256 oldBps, uint256 newBps);
    event AuthorizedDAppSet(address indexed dapp, bool allowed);
    event RewardManagerSet(address indexed rm);
    event LoyaltyPointsSet(address indexed lp);
    event BaseRewardSet(string transactionType, uint256 amountWei);

    error Unauthorized();
    error InvalidAmount();

    modifier onlyAuthorizedDApp() {
        if (!authorizedDApps[msg.sender]) revert Unauthorized();
        _;
    }

    constructor(
        address _revenueTreeManager,
        address _feeCollector,
        uint256 _treeBps
    ) Ownable(msg.sender) {
        require(_revenueTreeManager != address(0), "FeeRouter: Invalid RevenueTreeManager");
        require(_feeCollector != address(0), "FeeRouter: Invalid FeeCollector");
        require(_treeBps <= BPS, "FeeRouter: treeBps must be <= 10000");
        revenueTreeManager = RevenueTreeManager(payable(_revenueTreeManager));
        feeCollector = FeeCollector(payable(_feeCollector));
        treeBps = _treeBps;
    }

    /**
     * @dev Receive fee and split only (no GRID/points). Same as before.
     */
    function forwardFeeAndRevenue(address payer) external payable onlyAuthorizedDApp {
        if (msg.value == 0) return;
        uint256 toTree = (msg.value * treeBps) / BPS;
        uint256 toTreasury = msg.value - toTree;
        if (toTree > 0) revenueTreeManager.distributeToUpline{value: toTree}(payer);
        if (toTreasury > 0) feeCollector.forwardFee{value: toTreasury}();
        emit Forwarded(payer, msg.value, toTree, toTreasury);
    }

    /**
     * @dev Receive fee, split, then distribute GRID reward and award points for transactionType.
     * Points failure does not revert; reward failure reverts entire call.
     */
    function forwardFeeAndRevenueWithRewards(address payer, string calldata transactionType) external payable onlyAuthorizedDApp {
        if (msg.value == 0) return;
        uint256 toTree = (msg.value * treeBps) / BPS;
        uint256 toTreasury = msg.value - toTree;
        if (toTree > 0) revenueTreeManager.distributeToUpline{value: toTree}(payer);
        if (toTreasury > 0) feeCollector.forwardFee{value: toTreasury}();

        uint256 rewardWei = baseRewardWei[transactionType];
        if (rewardWei > 0 && address(rewardManager) != address(0)) {
            try rewardManager.distributeRewardDirect(payer, rewardWei) {
                emit ForwardedWithRewards(payer, msg.value, transactionType, rewardWei);
            } catch {}
            // If reward distribution fails (e.g. insufficient tGRID in RewardManager), fee split and points still apply
        }
        if (address(loyaltyPoints) != address(0)) {
            try loyaltyPoints.awardPointsWithMultiplier(payer, transactionType) {} catch {}
        }
    }

    function setAuthorizedDApp(address dapp, bool allowed) external onlyOwner {
        authorizedDApps[dapp] = allowed;
        emit AuthorizedDAppSet(dapp, allowed);
    }

    function setTreeBps(uint256 _treeBps) external onlyOwner {
        require(_treeBps <= BPS, "FeeRouter: treeBps must be <= 10000");
        uint256 old = treeBps;
        treeBps = _treeBps;
        emit TreeBpsUpdated(old, _treeBps);
    }

    function setRewardManager(address _rewardManager) external onlyOwner {
        rewardManager = RewardManager(_rewardManager);
        emit RewardManagerSet(_rewardManager);
    }

    function setLoyaltyPoints(address _loyaltyPoints) external onlyOwner {
        loyaltyPoints = LoyaltyPoints(_loyaltyPoints);
        emit LoyaltyPointsSet(_loyaltyPoints);
    }

    function setBaseReward(string calldata transactionType, uint256 amountWei) external onlyOwner {
        baseRewardWei[transactionType] = amountWei;
        emit BaseRewardSet(transactionType, amountWei);
    }

    receive() external payable {}
}
