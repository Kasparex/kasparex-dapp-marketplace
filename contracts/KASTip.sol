// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./ProofOfUtility.sol";
import "./AffiliateManager.sol";
import "./FeeHandler.sol";
import "./DAppRegistry.sol";

/**
 * @title KASTip
 * @dev KAS Tipping System with Leaderboard and Ecosystem Integration
 * @notice Allows users to tip KAS to recipients, tracks leaderboard, and integrates with ProofOfUtility, AffiliateManager, and FeeHandler
 */
contract KASTip is Ownable, ReentrancyGuard {
    // Ecosystem contracts
    ProofOfUtility public proofOfUtility;
    AffiliateManager public affiliateManager;
    FeeHandler public feeHandler;
    DAppRegistry public dAppRegistry;
    
    // dApp ID (set after registration)
    uint256 public dAppId;
    
    // Fee percentage (basis points, 10000 = 100%)
    uint256 public feePercentage = 200; // 2% default
    
    // Leaderboard tracking
    struct Tipper {
        address user;
        uint256 totalTipped;
        uint256 tipCount;
        uint256 lastTipTime;
    }
    
    mapping(address => Tipper) public tippers;
    address[] public topTippers; // Top 100 tippers
    
    // Tip structure
    struct Tip {
        address from;
        address to;
        uint256 amount;
        uint256 fee;
        address referral; // Optional referral address
        uint256 timestamp;
    }
    
    Tip[] public tips;
    mapping(address => Tip[]) public recipientTips; // Tips received by address
    mapping(address => Tip[]) public senderTips; // Tips sent by address
    
    // Events
    event TipSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 fee,
        address indexed referral,
        uint256 timestamp
    );
    event LeaderboardUpdated(address indexed user, uint256 totalTipped, uint256 rank);
    event FeePercentageUpdated(uint256 oldPercentage, uint256 newPercentage);
    event EcosystemContractUpdated(string contractName, address oldAddress, address newAddress);
    
    /**
     * @dev Constructor
     * @param _proofOfUtility ProofOfUtility contract address
     * @param _affiliateManager AffiliateManager contract address
     * @param _feeHandler FeeHandler contract address
     * @param _dAppRegistry DAppRegistry contract address
     */
    constructor(
        address _proofOfUtility,
        address _affiliateManager,
        address _feeHandler,
        address _dAppRegistry
    ) Ownable(msg.sender) {
        require(_proofOfUtility != address(0), "KASTip: Invalid ProofOfUtility");
        require(_affiliateManager != address(0), "KASTip: Invalid AffiliateManager");
        require(_feeHandler != address(0), "KASTip: Invalid FeeHandler");
        require(_dAppRegistry != address(0), "KASTip: Invalid DAppRegistry");
        
        proofOfUtility = ProofOfUtility(_proofOfUtility);
        affiliateManager = AffiliateManager(_affiliateManager);
        feeHandler = FeeHandler(_feeHandler);
        dAppRegistry = DAppRegistry(_dAppRegistry);
    }
    
    /**
     * @dev Set dApp ID (called after registration)
     * @param _dAppId dApp ID from DAppRegistry
     */
    function setDAppId(uint256 _dAppId) external onlyOwner {
        require(_dAppId > 0, "KASTip: Invalid dApp ID");
        require(dAppId == 0, "KASTip: dApp ID already set");
        dAppId = _dAppId;
    }
    
    /**
     * @dev Send a tip to a recipient
     * @param _recipient Address to receive the tip
     * @param _referral Optional referral address (from ?ref= parameter)
     */
    function tip(address _recipient, address _referral) external payable nonReentrant {
        require(_recipient != address(0), "KASTip: Invalid recipient");
        require(msg.value > 0, "KASTip: Tip amount must be greater than 0");
        require(_recipient != msg.sender, "KASTip: Cannot tip yourself");
        
        // Calculate fee
        uint256 fee = (msg.value * feePercentage) / 10000;
        uint256 tipAmount = msg.value - fee;
        
        // Send fee to FeeHandler
        if (fee > 0) {
            feeHandler.collectFee{value: fee}(address(0)); // Use default project treasury
        }
        
        // Send tip to recipient
        (bool success, ) = payable(_recipient).call{value: tipAmount}("");
        require(success, "KASTip: Tip transfer failed");
        
        // Record tip
        Tip memory newTip = Tip({
            from: msg.sender,
            to: _recipient,
            amount: tipAmount,
            fee: fee,
            referral: _referral,
            timestamp: block.timestamp
        });
        
        tips.push(newTip);
        recipientTips[_recipient].push(newTip);
        senderTips[msg.sender].push(newTip);
        
        // Update leaderboard
        _updateLeaderboard(msg.sender, msg.value);
        
        // Record referral if provided
        if (_referral != address(0) && _referral != msg.sender) {
            try affiliateManager.recordReferral(_referral, msg.sender, address(this)) {
                // Referral recorded successfully
            } catch {
                // Referral recording failed (e.g., rate limit), but continue with tip
            }
        }
        
        // Record usage event in ProofOfUtility
        if (dAppId > 0) {
            try proofOfUtility.recordUsage(
                msg.sender,
                address(this),
                dAppId,
                "tip"
            ) {
                // Usage event recorded
            } catch {
                // Usage event recording failed, but continue
            }
        }
        
        emit TipSent(msg.sender, _recipient, tipAmount, fee, _referral, block.timestamp);
    }
    
    /**
     * @dev Update leaderboard for a user
     * @param _user User address
     * @param _tipAmount Tip amount (including fee)
     */
    function _updateLeaderboard(address _user, uint256 _tipAmount) internal {
        Tipper storage tipper = tippers[_user];
        
        // Update tipper stats
        if (tipper.user == address(0)) {
            // New tipper
            tipper.user = _user;
            topTippers.push(_user);
        }
        
        tipper.totalTipped += _tipAmount;
        tipper.tipCount++;
        tipper.lastTipTime = block.timestamp;
        
        // Sort top tippers (simple bubble sort for top 100)
        _sortTopTippers();
        
        // Find user's rank
        uint256 rank = _findRank(_user);
        
        emit LeaderboardUpdated(_user, tipper.totalTipped, rank);
    }
    
    /**
     * @dev Sort top tippers by total tipped amount
     */
    function _sortTopTippers() internal {
        // Simple bubble sort (keep top 100)
        uint256 n = topTippers.length;
        if (n > 100) {
            n = 100;
        }
        
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (tippers[topTippers[j]].totalTipped < tippers[topTippers[j + 1]].totalTipped) {
                    address temp = topTippers[j];
                    topTippers[j] = topTippers[j + 1];
                    topTippers[j + 1] = temp;
                }
            }
        }
    }
    
    /**
     * @dev Find user's rank in leaderboard
     * @param _user User address
     * @return Rank (1-indexed, 0 if not in top 100)
     */
    function _findRank(address _user) internal view returns (uint256) {
        for (uint256 i = 0; i < topTippers.length && i < 100; i++) {
            if (topTippers[i] == _user) {
                return i + 1;
            }
        }
        return 0;
    }
    
    /**
     * @dev Get top tippers
     * @param _limit Number of top tippers to return
     * @return Array of tipper addresses
     */
    function getTopTippers(uint256 _limit) external view returns (address[] memory) {
        uint256 limit = _limit > topTippers.length ? topTippers.length : _limit;
        if (limit > 100) limit = 100;
        
        address[] memory result = new address[](limit);
        for (uint256 i = 0; i < limit; i++) {
            result[i] = topTippers[i];
        }
        return result;
    }
    
    /**
     * @dev Get user's rank
     * @param _user User address
     * @return Rank (1-indexed, 0 if not in top 100)
     */
    function getUserRank(address _user) external view returns (uint256) {
        return _findRank(_user);
    }
    
    /**
     * @dev Get total tips count
     * @return Total number of tips
     */
    function getTotalTipsCount() external view returns (uint256) {
        return tips.length;
    }
    
    /**
     * @dev Get tips for a recipient
     * @param _recipient Recipient address
     * @return Array of tips
     */
    function getRecipientTips(address _recipient) external view returns (Tip[] memory) {
        return recipientTips[_recipient];
    }
    
    /**
     * @dev Get tips sent by a user
     * @param _sender Sender address
     * @return Array of tips
     */
    function getSenderTips(address _sender) external view returns (Tip[] memory) {
        return senderTips[_sender];
    }
    
    /**
     * @dev Update fee percentage
     * @param _feePercentage New fee percentage in basis points
     */
    function setFeePercentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 1000, "KASTip: Fee cannot exceed 10%");
        uint256 oldPercentage = feePercentage;
        feePercentage = _feePercentage;
        emit FeePercentageUpdated(oldPercentage, _feePercentage);
    }
    
    /**
     * @dev Update ecosystem contract addresses
     * @param _contractName Contract name ("ProofOfUtility", "AffiliateManager", "FeeHandler", "DAppRegistry")
     * @param _newAddress New contract address
     */
    function updateEcosystemContract(string memory _contractName, address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "KASTip: Invalid address");
        
        bytes32 nameHash = keccak256(bytes(_contractName));
        
        if (nameHash == keccak256(bytes("ProofOfUtility"))) {
            address oldAddress = address(proofOfUtility);
            proofOfUtility = ProofOfUtility(_newAddress);
            emit EcosystemContractUpdated("ProofOfUtility", oldAddress, _newAddress);
        } else if (nameHash == keccak256(bytes("AffiliateManager"))) {
            address oldAddress = address(affiliateManager);
            affiliateManager = AffiliateManager(_newAddress);
            emit EcosystemContractUpdated("AffiliateManager", oldAddress, _newAddress);
        } else if (nameHash == keccak256(bytes("FeeHandler"))) {
            address oldAddress = address(feeHandler);
            feeHandler = FeeHandler(_newAddress);
            emit EcosystemContractUpdated("FeeHandler", oldAddress, _newAddress);
        } else if (nameHash == keccak256(bytes("DAppRegistry"))) {
            address oldAddress = address(dAppRegistry);
            dAppRegistry = DAppRegistry(_newAddress);
            emit EcosystemContractUpdated("DAppRegistry", oldAddress, _newAddress);
        } else {
            revert("KASTip: Unknown contract name");
        }
    }
    
    /**
     * @dev Calculate fee for a given amount
     * @param _amount Amount to calculate fee for
     * @return Fee amount
     */
    function calculateFee(uint256 _amount) external view returns (uint256) {
        return (_amount * feePercentage) / 10000;
    }
    
    /**
     * @dev Get contract statistics
     * @return totalTips Total number of tips
     * @return totalTipped Total amount tipped (including fees)
     * @return totalFees Total fees collected
     * @return topTippersCount Number of top tippers
     */
    function getStats() external view returns (
        uint256 totalTips,
        uint256 totalTipped,
        uint256 totalFees,
        uint256 topTippersCount
    ) {
        totalTips = tips.length;
        topTippersCount = topTippers.length > 100 ? 100 : topTippers.length;
        
        for (uint256 i = 0; i < tips.length; i++) {
            totalTipped += tips[i].amount + tips[i].fee;
            totalFees += tips[i].fee;
        }
    }
}

