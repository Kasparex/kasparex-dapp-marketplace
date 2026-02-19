// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./GRIDToken.sol";
import "./ProofOfUtility.sol";

/**
 * @title RewardManager
 * @dev Distributes GRID only. FeeRouter uses distributeRewardDirect (95% user, 5% treasury).
 * @notice ProofOfUtility path (distributeReward) is deprecated for reward flow; use for analytics only.
 */
contract RewardManager is Ownable, ReentrancyGuard {
    uint256 public constant BPS = 10000;
    uint256 public constant GRID_TREASURY_BPS = 500; // 5%

    ProofOfUtility public proofOfUtility;
    GRIDToken public gridToken;
    address public gridTreasury;
    mapping(address => bool) public authorizedRewardCallers; // e.g. FeeRouter

    mapping(address => uint256) public rewardRates;

    event RewardDistributed(
        address indexed user,
        address indexed dAppContract,
        address indexed token,
        uint256 amount,
        string rewardType
    );
    event RewardDistributedDirect(address indexed user, uint256 amountToUser, uint256 amountToTreasury);
    event RewardRateUpdated(address indexed dAppContract, uint256 oldRate, uint256 newRate);
    event GridTreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event AuthorizedRewardCallerSet(address indexed caller, bool allowed);
    
    modifier onlyAuthorizedRewardCaller() {
        require(authorizedRewardCallers[msg.sender], "RewardManager: Unauthorized");
        _;
    }

    constructor(address _proofOfUtility, address _gridToken) Ownable(msg.sender) {
        require(_proofOfUtility != address(0), "RewardManager: Invalid ProofOfUtility");
        require(_gridToken != address(0), "RewardManager: Invalid GRID token");
        proofOfUtility = ProofOfUtility(_proofOfUtility);
        gridToken = GRIDToken(_gridToken);
    }

    /**
     * @dev Direct GRID distribution: 95% to user, 5% to gridTreasury. Callable only by FeeRouter (or authorized).
     */
    function distributeRewardDirect(address user, uint256 amountWei) external nonReentrant onlyAuthorizedRewardCaller {
        require(user != address(0), "RewardManager: Invalid user");
        require(amountWei > 0, "RewardManager: Zero amount");
        require(gridTreasury != address(0), "RewardManager: Treasury not set");
        uint256 toUser = (amountWei * (BPS - GRID_TREASURY_BPS)) / BPS;
        uint256 toTreasury = amountWei - toUser;
        require(gridToken.balanceOf(address(this)) >= amountWei, "RewardManager: Insufficient GRID");
        require(gridToken.transfer(user, toUser), "RewardManager: Transfer to user failed");
        require(gridToken.transfer(gridTreasury, toTreasury), "RewardManager: Transfer to treasury failed");
        emit RewardDistributedDirect(user, toUser, toTreasury);
    }

    /**
     * @dev Legacy: distribute GRID for a usage event (ProofOfUtility only). Prefer FeeRouter -> distributeRewardDirect.
     */
    function distributeReward(
        address user,
        address dAppContract,
        uint256 actionValue
    ) public nonReentrant {
        require(user != address(0), "RewardManager: Invalid user");
        require(dAppContract != address(0), "RewardManager: Invalid dApp contract");
        require(msg.sender == address(proofOfUtility), "RewardManager: Only ProofOfUtility can call");
        uint256 rewardRate = rewardRates[dAppContract];
        if (rewardRate == 0) return;
        uint256 rewardAmount = (actionValue * rewardRate) / 10000;
        if (rewardAmount == 0) return;
        require(gridToken.balanceOf(address(this)) >= rewardAmount, "RewardManager: Insufficient GRID");
        require(gridToken.transfer(user, rewardAmount), "RewardManager: GRID transfer failed");
        emit RewardDistributed(user, dAppContract, address(gridToken), rewardAmount, "GRID");
    }

    /**
     * @dev Batch distribute GRID (ProofOfUtility only).
     */
    function distributeRewardsBatch(
        address[] memory users,
        address[] memory dAppContracts,
        uint256[] memory actionValues
    ) external nonReentrant {
        require(
            users.length == dAppContracts.length && dAppContracts.length == actionValues.length,
            "RewardManager: Array length mismatch"
        );
        require(msg.sender == address(proofOfUtility), "RewardManager: Only ProofOfUtility can call");
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            address dAppContract = dAppContracts[i];
            uint256 actionValue = actionValues[i];
            if (user == address(0) || dAppContract == address(0)) continue;
            uint256 rewardRate = rewardRates[dAppContract];
            if (rewardRate == 0) continue;
            uint256 rewardAmount = (actionValue * rewardRate) / 10000;
            if (rewardAmount == 0) continue;
            if (gridToken.balanceOf(address(this)) < rewardAmount) continue;
            if (!gridToken.transfer(user, rewardAmount)) continue;
            emit RewardDistributed(user, dAppContract, address(gridToken), rewardAmount, "GRID");
        }
    }

    function setRewardRate(address dAppContract, uint256 rate) external onlyOwner {
        require(dAppContract != address(0), "RewardManager: Invalid dApp contract");
        require(rate <= 10000, "RewardManager: Rate cannot exceed 100%");
        uint256 oldRate = rewardRates[dAppContract];
        rewardRates[dAppContract] = rate;
        emit RewardRateUpdated(dAppContract, oldRate, rate);
    }

    function setGridTreasury(address _gridTreasury) external onlyOwner {
        require(_gridTreasury != address(0), "RewardManager: Invalid treasury");
        address old = gridTreasury;
        gridTreasury = _gridTreasury;
        emit GridTreasuryUpdated(old, _gridTreasury);
    }

    function setAuthorizedRewardCaller(address caller, bool allowed) external onlyOwner {
        require(caller != address(0), "RewardManager: Invalid caller");
        authorizedRewardCallers[caller] = allowed;
        emit AuthorizedRewardCallerSet(caller, allowed);
    }

    function setProofOfUtility(address _proofOfUtility) external onlyOwner {
        require(_proofOfUtility != address(0), "RewardManager: Invalid ProofOfUtility");
        proofOfUtility = ProofOfUtility(_proofOfUtility);
    }
}

