// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IFeeRouter.sol";

/**
 * @title GenesisBadge
 * @dev Unlock or boost a genesis badge; forwards full payment to FeeRouter for Revenue Tree + tGRID + XP.
 * @notice Min payment 10 iKAS. First call assigns random theme/title; subsequent calls boost the same badge.
 */
contract GenesisBadge is Ownable, ReentrancyGuard {
    IFeeRouter public feeRouter;

    uint256 public constant MIN_PAYMENT_WEI = 10 * 1e18;
    uint8 public constant THEME_COUNT = 8;
    uint8 public constant TITLE_COUNT = 8;

    struct Badge {
        bool exists;
        uint8 themeId;
        uint8 titleId;
        uint256 totalSpentWei;
        uint32 boostCount;
    }

    mapping(address => Badge) public badges;
    uint256 private _nonce;

    event BadgeUnlocked(address indexed user, uint8 themeId, uint8 titleId, uint256 amountWei);
    event BadgeBoosted(address indexed user, uint256 amountWei, uint32 newBoostCount);
    event FeeRouterUpdated(address indexed oldRouter, address indexed newRouter);

    constructor(address _feeRouter) Ownable(msg.sender) {
        require(_feeRouter != address(0), "GenesisBadge: Invalid fee router");
        feeRouter = IFeeRouter(_feeRouter);
    }

    /**
     * @dev Unlock a new badge (first time) or boost existing badge. Forwards full msg.value to FeeRouter.
     */
    function unlockOrBoost() external payable nonReentrant {
        require(msg.value >= MIN_PAYMENT_WEI, "GenesisBadge: Min 10 iKAS required");
        require(address(feeRouter) != address(0), "GenesisBadge: Fee router not set");

        feeRouter.forwardFeeAndRevenueWithRewards{value: msg.value}(msg.sender, "genesis-badge", msg.value);

        Badge storage b = badges[msg.sender];
        if (!b.exists) {
            uint256 seed = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, msg.sender, _nonce)));
            _nonce++;
            b.exists = true;
            b.themeId = uint8(seed % THEME_COUNT);
            b.titleId = uint8(uint256(keccak256(abi.encodePacked(seed, _nonce))) % TITLE_COUNT);
            b.totalSpentWei = msg.value;
            b.boostCount = 1;
            emit BadgeUnlocked(msg.sender, b.themeId, b.titleId, msg.value);
        } else {
            b.totalSpentWei += msg.value;
            b.boostCount++;
            emit BadgeBoosted(msg.sender, msg.value, b.boostCount);
        }
    }

    function setFeeRouter(address _feeRouter) external onlyOwner {
        address oldRouter = address(feeRouter);
        feeRouter = IFeeRouter(_feeRouter);
        emit FeeRouterUpdated(oldRouter, _feeRouter);
    }
}
