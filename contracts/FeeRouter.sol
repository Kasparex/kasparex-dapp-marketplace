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
     * @dev Receive fee, split, then distribute GRID reward and award points. Legacy: no payment amount = fixed reward per tx.
     */
    function forwardFeeAndRevenueWithRewards(address payer, string calldata transactionType) external payable onlyAuthorizedDApp {
        _forwardFeeAndRevenueWithRewards(payer, transactionType, 0);
    }

    /**
     * @dev Receive fee, split, then distribute GRID reward (scaled by paymentAmountWei) and award points (scaled by paymentAmountWei).
     * paymentAmountWei = total payment in wei (e.g. msg.value from SimplePayment). Reward = (paymentAmountWei/1e18) * baseRewardPer1iKAS * tierBps/BPS.
     */
    function forwardFeeAndRevenueWithRewards(address payer, string calldata transactionType, uint256 paymentAmountWei) external payable onlyAuthorizedDApp {
        _forwardFeeAndRevenueWithRewards(payer, transactionType, paymentAmountWei);
    }

    function _forwardFeeAndRevenueWithRewards(address payer, string calldata transactionType, uint256 paymentAmountWei) internal {
        if (msg.value == 0) return;
        uint256 toTree = (msg.value * treeBps) / BPS;
        uint256 toTreasury = msg.value - toTree;
        if (toTree > 0) revenueTreeManager.distributeToUpline{value: toTree}(payer);
        if (toTreasury > 0) feeCollector.forwardFee{value: toTreasury}();

        uint256 baseWei = baseRewardWei[transactionType];
        uint256 rewardWei;
        if (baseWei > 0 && address(rewardManager) != address(0)) {
            uint256 multBps = address(loyaltyPoints) != address(0) ? loyaltyPoints.getTierMultiplierBps(payer) : BPS;
            if (paymentAmountWei > 0) {
                rewardWei = (paymentAmountWei * baseWei / 1e18) * multBps / BPS;
            } else {
                rewardWei = (baseWei * multBps) / BPS;
            }
            if (rewardWei > 0) {
                try rewardManager.distributeRewardDirect(payer, rewardWei) {
                    emit ForwardedWithRewards(payer, msg.value, transactionType, rewardWei);
                } catch {}
            }
        }
        if (address(loyaltyPoints) != address(0)) {
            if (paymentAmountWei > 0) {
                try loyaltyPoints.awardPointsForPayment(payer, transactionType, paymentAmountWei) {} catch {}
            } else {
                try loyaltyPoints.awardPointsWithMultiplier(payer, transactionType) {} catch {}
            }
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
