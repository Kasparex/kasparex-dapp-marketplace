// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RevenueTreeManager
 * @dev Unified Revenue Tree per wallet per chain: referrer, volume, activation, upline snapshot, revenue distribution.
 * @notice One tree per wallet; upline immutable at activation; revenue to upline or same-level Genesis when inactive.
 */
contract RevenueTreeManager is Ownable, ReentrancyGuard {
    // --- Config (basis points 10000 = 100%) ---
    uint256 public constant BPS = 10000;
    uint256 public constant LEVELS = 5;
    uint256 public constant SECONDS_PER_DAY = 86400;
    uint256 public constant WINDOW_DAYS = 30;

    // Genesis wallets (L1..L5); used when level missing or inactive
    address[LEVELS] public genesisWallets;
    address public platformWallet; // remainder (platform share)

    // KREX path: hold >= krexThreshold and volumeLast30 >= krexMinVolume
    IERC20 public krexToken; // address(0) = disabled
    uint256 public krexThreshold;   // min balance (token units)
    uint256 public krexMinVolume;   // min volume in last 30 days (native wei)

    uint256 public activationThreshold;  // lifetime volume to activate (native wei, e.g. 100e18)
    uint256 public activityThreshold;    // volume in last 30 days to stay active (e.g. 1000e18)

    // Level share in basis points: L1=200, L2=500, L3=1000, L4=2000, L5=4500 => 8200; platform 1800
    uint256[LEVELS] public levelBps;

    mapping(address => bool) public authorizedCallers;

    // --- Per-user state ---
    mapping(address => address) public referrerOf;
    mapping(address => uint256) public lifetimeVolume;
    mapping(address => uint256) public activatedAt; // 0 = not activated
    mapping(address => address[LEVELS]) public upline; // 1-indexed: upline[user][0]=L1, [1]=L2, ...

    // volumeByDay[user][dayIndex] where dayIndex = timestamp / 86400
    mapping(address => mapping(uint256 => uint256)) public volumeByDay;

    // --- Events ---
    event ReferrerSet(address indexed user, address indexed referrer);
    event Activated(address indexed user, address l1, address l2, address l3, address l4, address l5);
    event RevenueDistributed(address indexed payer, uint256 amount, uint256 level, address indexed recipient, bool toGenesis);
    event AuthorizedCallerSet(address indexed caller, bool allowed);
    event ConfigUpdated();

    error InvalidAddress();
    error Unauthorized();
    error ReferrerAlreadySet();
    error TransferFailed();

    modifier onlyAuthorized() {
        if (!authorizedCallers[msg.sender]) revert Unauthorized();
        _;
    }

    /**
     * @param _genesisWallets Five Genesis addresses (L1..L5)
     * @param _platformWallet Receives platform share remainder
     * @param _krexToken KREX token or address(0) to disable KREX path
     * @param _activationThreshold Lifetime volume to activate (wei, e.g. 100e18)
     * @param _activityThreshold Volume in last 30 days for activity path (e.g. 1000e18)
     * @param _krexThreshold Min KREX balance for KREX path (token units, e.g. 10e6 * 1e18)
     * @param _krexMinVolume Min volume in last 30 days when using KREX path (e.g. 100e18)
     */
    constructor(
        address[LEVELS] memory _genesisWallets,
        address _platformWallet,
        address _krexToken,
        uint256 _activationThreshold,
        uint256 _activityThreshold,
        uint256 _krexThreshold,
        uint256 _krexMinVolume
    ) Ownable(msg.sender) {
        for (uint256 i = 0; i < LEVELS; i++) {
            if (_genesisWallets[i] == address(0)) revert InvalidAddress();
            genesisWallets[i] = _genesisWallets[i];
        }
        if (_platformWallet == address(0)) revert InvalidAddress();
        platformWallet = _platformWallet;

        krexToken = IERC20(_krexToken); // can be address(0)
        activationThreshold = _activationThreshold;
        activityThreshold = _activityThreshold;
        krexThreshold = _krexThreshold;
        krexMinVolume = _krexMinVolume;

        levelBps[0] = 200;  // L1 2%
        levelBps[1] = 500;  // L2 5%
        levelBps[2] = 1000; // L3 10%
        levelBps[3] = 2000; // L4 20%
        levelBps[4] = 4500; // L5 45%
        // remainder to platform
    }

    /**
     * @dev Set referrer once per user (first touch).
     */
    function setReferrer(address referrer) external {
        if (referrer == address(0) || referrer == msg.sender) revert InvalidAddress();
        if (referrerOf[msg.sender] != address(0)) revert ReferrerAlreadySet();
        referrerOf[msg.sender] = referrer;
        emit ReferrerSet(msg.sender, referrer);
    }

    /**
     * @dev Distribute msg.value to payer's upline (or Genesis for inactive/empty). Only authorized callers.
     */
    function distributeToUpline(address payer) external payable onlyAuthorized nonReentrant {
        if (payer == address(0) || msg.value == 0) return;

        uint256 dayIndex = block.timestamp / SECONDS_PER_DAY;
        lifetimeVolume[payer] += msg.value;
        volumeByDay[payer][dayIndex] += msg.value;

        // Activate if first time crossing threshold
        if (activatedAt[payer] == 0 && lifetimeVolume[payer] >= activationThreshold) {
            _activate(payer);
        }

        address[LEVELS] memory recipients = upline[payer];
        // If not yet activated, use genesis for all 5 levels
        if (activatedAt[payer] == 0) {
            for (uint256 i = 0; i < LEVELS; i++) {
                recipients[i] = genesisWallets[i];
            }
        }

        uint256 sent;
        for (uint256 i = 0; i < LEVELS; i++) {
            uint256 amount = (msg.value * levelBps[i]) / BPS;
            if (amount == 0) continue;
            address to = recipients[i];
            if (to == address(0)) to = genesisWallets[i];
            bool active = to != genesisWallets[i] && _isActive(to);
            if (!active) to = genesisWallets[i];
            (bool ok, ) = payable(to).call{value: amount}("");
            if (!ok) revert TransferFailed();
            sent += amount;
            emit RevenueDistributed(payer, amount, i + 1, to, to == genesisWallets[i]);
        }
        uint256 platformAmount = msg.value - sent;
        if (platformAmount > 0) {
            (bool ok, ) = payable(platformWallet).call{value: platformAmount}("");
            if (!ok) revert TransferFailed();
        }
    }

    function _activate(address user) internal {
        address ref = referrerOf[user];
        address[LEVELS] memory up;
        up[0] = user; // L1 = self
        if (ref != address(0)) {
            up[1] = ref;
            address r2 = referrerOf[ref];
            if (r2 != address(0)) {
                up[2] = r2;
                address r3 = referrerOf[r2];
                if (r3 != address(0)) {
                    up[3] = r3;
                    address r4 = referrerOf[r3];
                    if (r4 != address(0)) up[4] = r4;
                }
            }
        }
        for (uint256 i = 0; i < LEVELS; i++) {
            if (up[i] == address(0)) up[i] = genesisWallets[i];
            upline[user][i] = up[i];
        }
        activatedAt[user] = block.timestamp;
        emit Activated(user, up[0], up[1], up[2], up[3], up[4]);
    }

    function _isActive(address account) internal view returns (bool) {
        uint256 vol30 = getVolumeLast30Days(account);
        if (vol30 >= activityThreshold) return true;
        if (address(krexToken) == address(0)) return false;
        if (krexToken.balanceOf(account) < krexThreshold) return false;
        return vol30 >= krexMinVolume;
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

    function isActive(address user) external view returns (bool) {
        return _isActive(user);
    }

    function getUpline(address user) external view returns (address[LEVELS] memory) {
        address[LEVELS] memory out = upline[user];
        if (activatedAt[user] == 0) {
            for (uint256 i = 0; i < LEVELS; i++) {
                out[i] = genesisWallets[i];
            }
        }
        return out;
    }

    function getActivationStatus(address user) external view returns (bool activated, address[LEVELS] memory uplineSnapshot) {
        activated = activatedAt[user] != 0;
        uplineSnapshot = upline[user];
        if (!activated) {
            for (uint256 i = 0; i < LEVELS; i++) uplineSnapshot[i] = genesisWallets[i];
        }
        return (activated, uplineSnapshot);
    }

    function setAuthorizedCaller(address caller, bool allowed) external onlyOwner {
        authorizedCallers[caller] = allowed;
        emit AuthorizedCallerSet(caller, allowed);
    }

    function setGenesisWallets(address[LEVELS] calldata _genesisWallets) external onlyOwner {
        for (uint256 i = 0; i < LEVELS; i++) {
            if (_genesisWallets[i] != address(0)) genesisWallets[i] = _genesisWallets[i];
        }
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

    receive() external payable {}
}
