// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RevenueTreeManager
 * @dev Unified Revenue Tree per wallet per chain: referrer, volume, activation, upline snapshot, revenue distribution.
 * @notice One tree per wallet; upline immutable at activation; revenue to upline or matched Genesis when inactive.
 * Version 5 Design: Pull payment for platform, tiered activity maintenance, Push-Up Rule activation, anti-spam.
 */
contract RevenueTreeManager is Ownable, ReentrancyGuard {
    // --- Constants ---
    uint256 public constant BPS = 10000;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant WINDOW_DAYS = 30;
    uint256 public constant MAX_CYCLE_DEPTH = 10;

    // --- Core Config ---
    uint256 public numLevels;
    address[] public genesisWallets;
    
    uint256[] public levelBps;
    uint256 public platformBps;
    address public platformWallet;

    // --- Thresholds & Multipliers ---
    uint256 public activationThreshold;   // lifetime volume to activate (native wei)
    uint256 public baseActivityThreshold; // base rolling 30-day volume to stay active (e.g. 100 KAS)
    uint256 public minVolumePerCall;      // minimum tx value to count toward activity (anti-spam)
    uint256 public krexMinVolumeFloor;    // floor volume required even with max KREX discount

    uint256[] public levelVolumeMultipliers; // e.g. [1, 2, 5, 10, 20]
    
    IERC20 public krexToken; // address(0) = disabled
    uint256[] public krexTiersHoldings;  // e.g. [1000e18, 5000e18, 10000e18, 50000e18]
    uint256[] public krexTiersDiscounts; // in BPS. e.g. [2500, 5000, 7500, 9000]

    // --- State ---
    mapping(address => bool) public authorizedCallers;
    mapping(address => address) public referrerOf;
    mapping(address => uint256) public lifetimeVolume;
    mapping(address => uint256) public activatedAt;           // 0 = not activated
    mapping(address => address[]) public upline;              // frozen snapshot at activation
    mapping(address => mapping(uint256 => uint256)) public volumeByDay; // [user][dayIndex] -> volume
    
    mapping(address => uint256) public totalReceived;         // on-chain earnings accumulator
    mapping(address => uint256) public pendingWithdrawals;    // pull payment system for platform

    // --- Events ---
    event ReferrerSet(address indexed user, address indexed referrer);
    event Activated(address indexed user, address[] uplineSnapshot);
    event RevenueDistributed(address indexed payer, uint256 amount, uint256 level, address indexed recipient, bool isGenesis);
    event PlatformFeePending(address indexed platform, uint256 amount);
    event Withdrawal(address indexed recipient, uint256 amount);
    event AuthorizedCallerSet(address indexed caller, bool allowed);
    event ConfigUpdated();

    error InvalidAddress();
    error Unauthorized();
    error ReferrerAlreadySet();
    error TransferFailed();
    error CycleDetected();
    error InvalidConfiguration();

    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender]) revert Unauthorized();
        _;
    }

    /**
     * @param _genesisWallets Genesis addresses
     * @param _platformWallet Receives platform share remainder
     * @param _krexToken KREX token or address(0)
     * @param _activationThreshold Lifetime volume to activate (wei)
     * @param _baseActivityThreshold Base volume in last 30 days for activity
     * @param _minVolumePerCall Anti-spam volume floor per transaction
     * @param _krexMinVolumeFloor Absolute minimum volume required with max KREX discount
     */
    constructor(
        address[] memory _genesisWallets,
        address _platformWallet,
        address _krexToken,
        uint256 _activationThreshold,
        uint256 _baseActivityThreshold,
        uint256 _minVolumePerCall,
        uint256 _krexMinVolumeFloor
    ) Ownable(msg.sender) {
        if (_platformWallet == address(0)) revert InvalidAddress();

        numLevels = 5;
        if (_genesisWallets.length < numLevels) revert InvalidConfiguration();
        genesisWallets = _genesisWallets;

        platformWallet = _platformWallet;
        krexToken = IERC20(_krexToken);

        activationThreshold = _activationThreshold;
        baseActivityThreshold = _baseActivityThreshold;
        minVolumePerCall = _minVolumePerCall;
        krexMinVolumeFloor = _krexMinVolumeFloor;

        levelBps = new uint256[](5);
        levelBps[0] = 200; // L1 2%
        levelBps[1] = 500; // L2 5%
        levelBps[2] = 1000; // L3 10%
        levelBps[3] = 2000; // L4 20%
        levelBps[4] = 4500; // L5 45%

        platformBps = 1800; // 18% remainder

        levelVolumeMultipliers = new uint256[](5);
        levelVolumeMultipliers[0] = 1;
        levelVolumeMultipliers[1] = 2;
        levelVolumeMultipliers[2] = 5;
        levelVolumeMultipliers[3] = 10;
        levelVolumeMultipliers[4] = 20;
    }

    /**
     * @dev Set referrer once per user. Prevents circular references.
     */
    function setReferrer(address referrer) external {
        if (referrer == address(0) || referrer == msg.sender) revert InvalidAddress();
        if (referrerOf[msg.sender] != address(0)) revert ReferrerAlreadySet();
        if (_wouldCreateCycle(msg.sender, referrer)) revert CycleDetected();
        
        referrerOf[msg.sender] = referrer;
        emit ReferrerSet(msg.sender, referrer);
    }

    function _wouldCreateCycle(address user, address candidate) internal view returns (bool) {
        address cursor = candidate;
        for (uint256 i = 0; i < MAX_CYCLE_DEPTH; i++) {
            if (cursor == address(0)) return false;
            if (cursor == user) return true;
            cursor = referrerOf[cursor];
        }
        return false;
    }

    /**
     * @dev Distribute msg.value to payer's upline (Push-up). Platform gets pull-payout.
     * @param totalVolume The full transactional value processed (e.g. 10 iKAS), used for tier maintenance. msg.value is only the tree's split (e.g. 5 iKAS).
     */
    function distributeToUpline(address payer, uint256 totalVolume) external payable onlyAuthorized nonReentrant {
        if (payer == address(0) || msg.value == 0) return;

        uint256 dayIndex = block.timestamp / SECONDS_PER_DAY;
        
        // Anti-spam volume rule
        if (totalVolume >= minVolumePerCall) {
            lifetimeVolume[payer] += totalVolume;
            volumeByDay[payer][dayIndex] += totalVolume;
        }

        // Activate if crossing threshold
        if (activatedAt[payer] == 0 && lifetimeVolume[payer] >= activationThreshold) {
            _activate(payer);
        }

        address[] memory recipients = upline[payer];
        uint256 activeLength = activatedAt[payer] == 0 ? 0 : recipients.length;

        uint256 sent = 0;
        for (uint256 i = 0; i < numLevels; i++) {
            uint256 amount = (msg.value * levelBps[i]) / BPS;
            if (amount == 0) continue;

            address to = address(0);
            if (i < activeLength) {
                to = recipients[i];
            }
            
            bool isGenesis = false;
            if (to == address(0) || to == genesisWallets[i] || !_isActive(to, i)) {
                to = genesisWallets[i];
                isGenesis = true;
            }

            totalReceived[to] += amount;
            (bool ok, ) = payable(to).call{value: amount}("");
            if (!ok) revert TransferFailed();
            
            sent += amount;
            emit RevenueDistributed(payer, amount, i + 1, to, isGenesis);
        }

        uint256 platformAmount = msg.value - sent;
        if (platformAmount > 0) {
            pendingWithdrawals[platformWallet] += platformAmount;
            emit PlatformFeePending(platformWallet, platformAmount);
        }
    }

    /**
     * @dev Push-up Rule: inherit referrer's frozen upline shifted by 1. L1 = direct referrer. 
     */
    function _activate(address user) internal {
        address ref = referrerOf[user];
        address[] memory newUpline = new address[](numLevels);
        
        newUpline[0] = ref; // L1 = direct referrer
        
        if (ref != address(0)) {
            address[] memory refUpline = upline[ref];
            for (uint256 i = 1; i < numLevels; i++) {
                if (i - 1 < refUpline.length) {
                    newUpline[i] = refUpline[i - 1];
                } else {
                    newUpline[i] = address(0);
                }
            }
        }
        
        upline[user] = newUpline;
        activatedAt[user] = block.timestamp;
        emit Activated(user, newUpline);
    }

    /**
     * @dev Tiered activity check: user must have volume >= (base * levelMultiplier) - KREX discount
     */
    function _isActive(address user, uint256 level) internal view returns (bool) {
        if (user == address(0)) return false;
        if (level >= levelVolumeMultipliers.length) return false;
        
        uint256 baseReq = baseActivityThreshold * levelVolumeMultipliers[level];
        uint256 discountBps = 0;
        
        if (address(krexToken) != address(0) && krexTiersHoldings.length > 0) {
            uint256 balance = krexToken.balanceOf(user);
            uint256 highestDiscount = 0;
            for (uint256 i = 0; i < krexTiersHoldings.length; i++) {
                if (balance >= krexTiersHoldings[i]) {
                    if (i < krexTiersDiscounts.length && krexTiersDiscounts[i] > highestDiscount) {
                        highestDiscount = krexTiersDiscounts[i];
                    }
                }
            }
            discountBps = highestDiscount;
        }

        uint256 discountAmount = (baseReq * discountBps) / BPS;
        uint256 req = baseReq > discountAmount ? baseReq - discountAmount : 0;
        
        // Floor protection
        if (req < krexMinVolumeFloor) {
            req = krexMinVolumeFloor;
        }

        uint256 vol30 = getVolumeLast30Days(user);
        return vol30 >= req;
    }

    function getVolumeLast30Days(address user) public view returns (uint256) {
        uint256 today = block.timestamp / SECONDS_PER_DAY;
        uint256 sum = 0;
        for (uint256 d = 0; d < WINDOW_DAYS; d++) {
            uint256 day = today - d;
            sum += volumeByDay[user][day];
        }
        return sum;
    }

    function isActiveAtLevel(address user, uint256 level) external view returns (bool) {
        return _isActive(user, level);
    }

    function getUpline(address user) external view returns (address[] memory) {
        if (activatedAt[user] == 0) {
            address[] memory out = new address[](numLevels);
            for (uint256 i = 0; i < numLevels; i++) {
                out[i] = genesisWallets[i];
            }
            return out;
        }
        return upline[user];
    }

    function getActivationStatus(address user) external view returns (bool activated, address[] memory uplineSnapshot) {
        activated = activatedAt[user] != 0;
        if (activated) {
            uplineSnapshot = upline[user];
        } else {
            uplineSnapshot = new address[](numLevels);
            for (uint256 i = 0; i < numLevels; i++) {
                uplineSnapshot[i] = genesisWallets[i];
            }
        }
        return (activated, uplineSnapshot);
    }
    
    // --- Pull Payment Withdraw ---
    function withdraw() external nonReentrant {
        uint256 amount = pendingWithdrawals[msg.sender];
        if (amount == 0) revert TransferFailed();
        pendingWithdrawals[msg.sender] = 0;
        
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        if (!ok) revert TransferFailed();
        
        emit Withdrawal(msg.sender, amount);
    }

    // --- Admin Functions ---

    function setAuthorizedCaller(address caller, bool allowed) external onlyOwner {
        authorizedCallers[caller] = allowed;
        emit AuthorizedCallerSet(caller, allowed);
    }

    function setGenesisWallets(address[] calldata _genesisWallets) external onlyOwner {
        if (_genesisWallets.length < numLevels) revert InvalidConfiguration();
        genesisWallets = _genesisWallets;
        emit ConfigUpdated();
    }

    function setKrexToken(address _krexToken) external onlyOwner {
        krexToken = IERC20(_krexToken);
        emit ConfigUpdated();
    }

    function setPlatformWallet(address _platformWallet) external onlyOwner {
        if (_platformWallet == address(0)) revert InvalidAddress();
        platformWallet = _platformWallet;
        emit ConfigUpdated();
    }
    
    function setActivationThreshold(uint256 _threshold) external onlyOwner {
        activationThreshold = _threshold;
        emit ConfigUpdated();
    }
    
    function setBaseActivityThreshold(uint256 _threshold) external onlyOwner {
        baseActivityThreshold = _threshold;
        emit ConfigUpdated();
    }
    
    function setMinVolumePerCall(uint256 _minVol) external onlyOwner {
        minVolumePerCall = _minVol;
        emit ConfigUpdated();
    }
    
    function setKrexMinVolumeFloor(uint256 _floor) external onlyOwner {
        krexMinVolumeFloor = _floor;
        emit ConfigUpdated();
    }
    
    function setNumLevels(uint256 _num) external onlyOwner {
        if (_num == 0 || _num > genesisWallets.length) revert InvalidConfiguration();
        numLevels = _num;
        emit ConfigUpdated();
    }
    
    function setLevelBps(uint256[] calldata _bps, uint256 _platformBps) external onlyOwner {
        if (_bps.length != numLevels) revert InvalidConfiguration();
        uint256 sum = 0;
        for (uint256 i = 0; i < _bps.length; i++) {
            sum += _bps[i];
        }
        if (sum + _platformBps != BPS) revert InvalidConfiguration();
        levelBps = _bps;
        platformBps = _platformBps;
        emit ConfigUpdated();
    }
    
    function setLevelVolumeMultipliers(uint256[] calldata _multipliers) external onlyOwner {
        if (_multipliers.length != numLevels) revert InvalidConfiguration();
        levelVolumeMultipliers = _multipliers;
        emit ConfigUpdated();
    }
    
    function setKrexTiers(uint256[] calldata holds, uint256[] calldata discounts) external onlyOwner {
        if (holds.length != discounts.length) revert InvalidConfiguration();
        krexTiersHoldings = holds;
        krexTiersDiscounts = discounts;
        emit ConfigUpdated();
    }

    receive() external payable {}
}
