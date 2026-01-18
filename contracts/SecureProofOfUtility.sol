// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./DAppToken.sol";
import "./GRIDToken.sol";
import "./RewardManager.sol";

/**
 * @title SecureProofOfUtility
 * @dev Secure version of ProofOfUtility with access control, action verification, and anti-replay protection
 * @notice Prevents unauthorized reward minting and cross-contract exploitation
 */
contract SecureProofOfUtility is Ownable, ReentrancyGuard, Pausable {
    // RewardManager contract
    RewardManager public rewardManager;
    
    // Authorized dApp contracts whitelist
    mapping(address => bool) public authorizedDApps;
    
    // Processed transactions (prevent replay attacks)
    mapping(bytes32 => bool) public processedTransactions;
    
    // Last action time per user/dApp/action (for cooldowns)
    mapping(address => mapping(string => uint256)) public lastActionTime;
    
    // Maximum action value (prevent excessive rewards)
    uint256 public maxActionValue;
    
    // Maximum reward per action type
    mapping(string => uint256) public maxRewardPerAction;
    
    // Cooldown period per action type (in seconds)
    mapping(string => uint256) public cooldownPeriods;
    
    // Default cooldown period (1 hour)
    uint256 public defaultCooldownPeriod = 3600;
    
    // Usage event structure
    struct UsageEvent {
        address user;
        address dAppContract;
        uint256 dAppId;
        string actionType;
        uint256 timestamp;
        bytes32 txHash;
        uint256 nonce;
    }
    
    // Track events per user
    mapping(address => UsageEvent[]) public userEvents;
    
    // Track events per dApp
    mapping(address => UsageEvent[]) public dAppEvents;
    
    // Event counter
    uint256 public totalEvents;
    
    // Events
    event UsageEventRecorded(
        address indexed user,
        address indexed dAppContract,
        uint256 indexed dAppId,
        string actionType,
        uint256 timestamp,
        bytes32 txHash
    );
    event RewardDistributed(
        address indexed user,
        address indexed dAppContract,
        uint256 rewardAmount
    );
    event DAppAuthorized(address indexed dAppContract, bool authorized);
    event RewardManagerUpdated(address indexed oldManager, address indexed newManager);
    event MaxActionValueUpdated(uint256 oldValue, uint256 newValue);
    event MaxRewardUpdated(string indexed actionType, uint256 oldValue, uint256 newValue);
    event CooldownPeriodUpdated(string indexed actionType, uint256 oldValue, uint256 newValue);
    
    /**
     * @dev Modifier to ensure only authorized dApp contracts can call
     */
    modifier onlyAuthorizedDApp() {
        require(authorizedDApps[msg.sender], "SecureProofOfUtility: Unauthorized dApp");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _rewardManager Address of RewardManager contract
     * @param _maxActionValue Maximum action value allowed
     */
    constructor(address _rewardManager, uint256 _maxActionValue) Ownable(msg.sender) {
        require(_rewardManager != address(0), "SecureProofOfUtility: Invalid reward manager");
        require(_maxActionValue > 0, "SecureProofOfUtility: Invalid max action value");
        
        rewardManager = RewardManager(_rewardManager);
        maxActionValue = _maxActionValue;
    }
    
    /**
     * @dev Authorize a dApp contract (only owner)
     * @param dAppContract Address of the dApp contract
     */
    function authorizeDApp(address dAppContract) external onlyOwner {
        require(dAppContract != address(0), "SecureProofOfUtility: Invalid dApp contract");
        authorizedDApps[dAppContract] = true;
        emit DAppAuthorized(dAppContract, true);
    }
    
    /**
     * @dev Revoke authorization for a dApp contract (only owner)
     * @param dAppContract Address of the dApp contract
     */
    function revokeDApp(address dAppContract) external onlyOwner {
        require(dAppContract != address(0), "SecureProofOfUtility: Invalid dApp contract");
        authorizedDApps[dAppContract] = false;
        emit DAppAuthorized(dAppContract, false);
    }
    
    /**
     * @dev Verify transaction exists on-chain and matches expected parameters
     * @param txHash Transaction hash to verify
     * @param expectedUser Expected user address
     * @param expectedValue Expected transaction value
     * @return isValid Whether the transaction is valid
     * 
     * Note: This is a simplified verification. In production, you would:
     * - Query the blockchain for transaction details
     * - Verify transaction sender matches expectedUser
     * - Verify transaction value matches expectedValue
     * - Verify transaction was successful
     * - This may require an oracle or off-chain verification service
     */
    function verifyTransaction(
        bytes32 txHash,
        address expectedUser,
        uint256 expectedValue
    ) internal view returns (bool) {
        // Basic validation - transaction hash must be non-zero
        require(txHash != bytes32(0), "SecureProofOfUtility: Invalid transaction hash");
        
        // In a production environment, you would:
        // 1. Query the blockchain RPC for transaction details
        // 2. Verify tx.from == expectedUser
        // 3. Verify tx.value == expectedValue
        // 4. Verify tx.status == success
        // 
        // For now, we rely on the fact that only authorized dApps can call this,
        // and they should only call it after verifying the transaction themselves.
        // Additional on-chain verification can be added via an oracle.
        
        return true; // Simplified for now - should be enhanced with oracle/verification service
    }
    
    /**
     * @dev Record usage and distribute reward (called by authorized dApp contracts)
     * @param user Address of the user
     * @param dAppContract Address of the dApp contract
     * @param dAppId ID of the dApp
     * @param actionType Type of action performed
     * @param actionValue Value of the action (for reward calculation)
     * @param txHash Transaction hash for verification
     * @param nonce Nonce for replay protection
     */
    function recordUsageAndReward(
        address user,
        address dAppContract,
        uint256 dAppId,
        string memory actionType,
        uint256 actionValue,
        bytes32 txHash,
        uint256 nonce
    ) public onlyAuthorizedDApp whenNotPaused nonReentrant {
        require(user != address(0), "SecureProofOfUtility: Invalid user");
        require(dAppContract != address(0), "SecureProofOfUtility: Invalid dApp contract");
        require(dAppContract == msg.sender, "SecureProofOfUtility: dApp contract mismatch");
        require(txHash != bytes32(0), "SecureProofOfUtility: Invalid transaction hash");
        require(actionValue > 0 && actionValue <= maxActionValue, "SecureProofOfUtility: Invalid action value");
        
        // Verify transaction occurred (simplified - should be enhanced with oracle)
        require(
            verifyTransaction(txHash, user, actionValue),
            "SecureProofOfUtility: Transaction verification failed"
        );
        
        // Prevent replay attacks
        bytes32 replayKey = keccak256(abi.encodePacked(txHash, nonce, user, dAppContract));
        require(!processedTransactions[replayKey], "SecureProofOfUtility: Transaction already processed");
        processedTransactions[replayKey] = true;
        
        // Rate limiting / cooldown protection
        bytes32 actionKey = keccak256(abi.encodePacked(user, dAppContract, actionType));
        uint256 cooldownPeriod = cooldownPeriods[actionType] > 0 
            ? cooldownPeriods[actionType] 
            : defaultCooldownPeriod;
        
        require(
            block.timestamp >= lastActionTime[user][actionType] + cooldownPeriod,
            "SecureProofOfUtility: Cooldown active"
        );
        lastActionTime[user][actionType] = block.timestamp;
        
        // Record usage event
        UsageEvent memory event_ = UsageEvent({
            user: user,
            dAppContract: dAppContract,
            dAppId: dAppId,
            actionType: actionType,
            timestamp: block.timestamp,
            txHash: txHash,
            nonce: nonce
        });
        
        userEvents[user].push(event_);
        dAppEvents[dAppContract].push(event_);
        totalEvents++;
        
        emit UsageEventRecorded(user, dAppContract, dAppId, actionType, block.timestamp, txHash);
        
        // Distribute reward if actionValue > 0
        if (actionValue > 0) {
            // Check maximum reward per action type
            uint256 maxReward = maxRewardPerAction[actionType];
            if (maxReward > 0) {
                // Calculate expected reward (simplified - actual calculation in RewardManager)
                // This is a safety check - RewardManager will do the actual calculation
                require(actionValue <= maxReward, "SecureProofOfUtility: Action value exceeds maximum reward");
            }
            
            rewardManager.distributeReward(user, dAppContract, actionValue);
            emit RewardDistributed(user, dAppContract, actionValue);
        }
    }
    
    /**
     * @dev Record usage without reward (for tracking purposes)
     * @param user Address of the user
     * @param dAppContract Address of the dApp contract
     * @param dAppId ID of the dApp
     * @param actionType Type of action performed
     * @param txHash Transaction hash
     * @param nonce Nonce for replay protection
     */
    function recordUsage(
        address user,
        address dAppContract,
        uint256 dAppId,
        string memory actionType,
        bytes32 txHash,
        uint256 nonce
    ) public onlyAuthorizedDApp whenNotPaused {
        require(user != address(0), "SecureProofOfUtility: Invalid user");
        require(dAppContract != address(0), "SecureProofOfUtility: Invalid dApp contract");
        require(dAppContract == msg.sender, "SecureProofOfUtility: dApp contract mismatch");
        require(txHash != bytes32(0), "SecureProofOfUtility: Invalid transaction hash");
        
        // Prevent replay attacks
        bytes32 replayKey = keccak256(abi.encodePacked(txHash, nonce, user, dAppContract));
        require(!processedTransactions[replayKey], "SecureProofOfUtility: Transaction already processed");
        processedTransactions[replayKey] = true;
        
        // Record usage event
        UsageEvent memory event_ = UsageEvent({
            user: user,
            dAppContract: dAppContract,
            dAppId: dAppId,
            actionType: actionType,
            timestamp: block.timestamp,
            txHash: txHash,
            nonce: nonce
        });
        
        userEvents[user].push(event_);
        dAppEvents[dAppContract].push(event_);
        totalEvents++;
        
        emit UsageEventRecorded(user, dAppContract, dAppId, actionType, block.timestamp, txHash);
    }
    
    /**
     * @dev Get user's usage events
     * @param user User address
     * @return Array of usage events
     */
    function getUserEvents(address user) external view returns (UsageEvent[] memory) {
        return userEvents[user];
    }
    
    /**
     * @dev Get dApp's usage events
     * @param dAppContract dApp contract address
     * @return Array of usage events
     */
    function getDAppEvents(address dAppContract) external view returns (UsageEvent[] memory) {
        return dAppEvents[dAppContract];
    }
    
    /**
     * @dev Get user's event count
     * @param user User address
     * @return Event count
     */
    function getUserEventCount(address user) external view returns (uint256) {
        return userEvents[user].length;
    }
    
    /**
     * @dev Set maximum action value (only owner)
     * @param _maxActionValue New maximum action value
     */
    function setMaxActionValue(uint256 _maxActionValue) external onlyOwner {
        require(_maxActionValue > 0, "SecureProofOfUtility: Invalid max action value");
        uint256 oldValue = maxActionValue;
        maxActionValue = _maxActionValue;
        emit MaxActionValueUpdated(oldValue, _maxActionValue);
    }
    
    /**
     * @dev Set maximum reward per action type (only owner)
     * @param actionType Action type
     * @param maxReward Maximum reward for this action type
     */
    function setMaxRewardPerAction(string memory actionType, uint256 maxReward) external onlyOwner {
        uint256 oldValue = maxRewardPerAction[actionType];
        maxRewardPerAction[actionType] = maxReward;
        emit MaxRewardUpdated(actionType, oldValue, maxReward);
    }
    
    /**
     * @dev Set cooldown period for action type (only owner)
     * @param actionType Action type
     * @param cooldownPeriod Cooldown period in seconds
     */
    function setCooldownPeriod(string memory actionType, uint256 cooldownPeriod) external onlyOwner {
        uint256 oldValue = cooldownPeriods[actionType];
        cooldownPeriods[actionType] = cooldownPeriod;
        emit CooldownPeriodUpdated(actionType, oldValue, cooldownPeriod);
    }
    
    /**
     * @dev Set default cooldown period (only owner)
     * @param _defaultCooldownPeriod Default cooldown period in seconds
     */
    function setDefaultCooldownPeriod(uint256 _defaultCooldownPeriod) external onlyOwner {
        defaultCooldownPeriod = _defaultCooldownPeriod;
    }
    
    /**
     * @dev Update reward manager (only owner)
     * @param _rewardManager New reward manager address
     */
    function setRewardManager(address _rewardManager) external onlyOwner {
        require(_rewardManager != address(0), "SecureProofOfUtility: Invalid reward manager");
        address oldManager = address(rewardManager);
        rewardManager = RewardManager(_rewardManager);
        emit RewardManagerUpdated(oldManager, _rewardManager);
    }
    
    /**
     * @dev Pause contract (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause contract (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}
