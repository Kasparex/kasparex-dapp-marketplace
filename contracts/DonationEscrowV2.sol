// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./IFeeRouter.sol";

interface ILoyaltyPointsV2 {
    function awardPointsForPayment(address user, string calldata actionType, uint256 paymentAmountWei) external;
}

/**
 * @title DonationEscrowV2
 * @dev Multi-campaign CrowdKAS escrow with explicit campaign method:
 *  - L2_escrow: EVM escrow with goal-based claim/refund
 *  - L1_direct: no escrow custody; optional record of L1 donations for points/UI
 *
 * Notes:
 *  - Refunds are donor-initiated (claimRefund). The contract does not push refunds to all donors.
 *  - Campaign listing is enumerable via campaignIdAt(index).
 */
contract DonationEscrowV2 is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    uint256 public constant BPS = 10000;
    uint256 public constant MIN_VERIFY_WEI = 1;
    uint256 public constant MIN_DONATION_WEI = 10 * 1e18; // 10 iKAS

    enum DonationMethod {
        L2_ESCROW,
        L1_DIRECT
    }

    struct Campaign {
        uint256 id;
        address creator;
        DonationMethod method;
        uint256 targetWei;
        uint256 deadline;
        uint256 raisedWei; // escrowed net amount (L2_ESCROW only)
        uint256 donorCount; // donations count (L2_ESCROW only)
        string ipfsHash;
        string l1Address; // optional: destination for L1_direct, or informational for L2_ESCROW
        bool active;
    }

    mapping(address => bool) public verified;

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaignsById;
    uint256[] private _campaignIds;
    mapping(address => uint256[]) private _creatorCampaignIds;

    mapping(uint256 => mapping(address => uint256)) public contributions; // campaignId => donor => amount (L2_ESCROW only)

    mapping(bytes32 => bool) public l1TxRecorded;
    mapping(uint256 => uint256) public l1RecordedTotalWei; // campaignId => total recorded
    mapping(uint256 => uint256) public l1RecordedDonationCount; // campaignId => count

    IFeeRouter public feeRouter;
    ILoyaltyPointsV2 public loyaltyPoints;
    uint256 public feeBps; // e.g. 100 = 1%
    address public recorder; // only recorder can record L1 donations

    // Paid modules entitlements (e.g. Featured placement)
    mapping(uint256 => mapping(bytes32 => bool)) public moduleUnlocked; // campaignId => moduleId => unlocked
    address public moduleSigner; // backend signer for unlock attestations
    mapping(bytes32 => bool) public moduleUnlockTxUsed; // prevent signature replay per L1 tx id

    event Verified(address indexed user);
    event CampaignCreated(uint256 indexed campaignId, address indexed creator, uint8 method, uint256 targetWei, uint256 deadline, string ipfsHash, string l1Address);
    event CampaignUpdated(uint256 indexed campaignId, string ipfsHash, uint256 targetWei, uint256 deadline, string l1Address);
    event Donated(uint256 indexed campaignId, address indexed creator, address indexed donor, uint256 amountWei, uint256 feeWei);
    event Claimed(uint256 indexed campaignId, address indexed creator, uint256 amountWei);
    event Refunded(uint256 indexed campaignId, address indexed creator, address indexed donor, uint256 amountWei);
    event L1DonationRecorded(uint256 indexed campaignId, address indexed creator, bytes32 indexed txHash, address donorL2, uint256 amountWei);
    event RecorderSet(address indexed oldRecorder, address indexed newRecorder);
    event FeeRouterSet(address indexed oldRouter, address indexed newRouter);
    event LoyaltyPointsSet(address indexed oldLp, address indexed newLp);
    event FeeBpsSet(uint256 oldBps, uint256 newBps);
    event ModuleSignerSet(address indexed oldSigner, address indexed newSigner);
    event ModuleUnlocked(uint256 indexed campaignId, bytes32 indexed moduleId, bytes32 indexed l1TxId, address creator);

    error NotVerified();
    error NoCampaign();
    error NotCreator();
    error CampaignInactive();
    error DeadlineNotReached();
    error TargetNotReached();
    error TargetReached();
    error AmountTooLow();
    error UnauthorizedRecorder();
    error AlreadyRecorded();
    error TransferFailed();
    error WrongMethod();
    error InvalidSignature();
    error AlreadyUsed();

    modifier onlyRecorder() {
        if (msg.sender != recorder && msg.sender != owner()) revert UnauthorizedRecorder();
        _;
    }

    constructor(
        address _feeRouter,
        address _loyaltyPoints,
        uint256 _feeBps,
        address _recorder,
        address _moduleSigner
    ) Ownable(msg.sender) {
        require(_feeRouter != address(0), "DonationEscrowV2: Invalid FeeRouter");
        require(_loyaltyPoints != address(0), "DonationEscrowV2: Invalid LoyaltyPoints");
        require(_feeBps <= 1000, "DonationEscrowV2: Fee cannot exceed 10%");
        require(_recorder != address(0), "DonationEscrowV2: Invalid recorder");
        require(_moduleSigner != address(0), "DonationEscrowV2: Invalid module signer");
        feeRouter = IFeeRouter(payable(_feeRouter));
        loyaltyPoints = ILoyaltyPointsV2(_loyaltyPoints);
        feeBps = _feeBps;
        recorder = _recorder;
        moduleSigner = _moduleSigner;
    }

    function verify() external payable {
        require(msg.value >= MIN_VERIFY_WEI, "DonationEscrowV2: Min verify amount");
        require(!verified[msg.sender], "DonationEscrowV2: Already verified");
        verified[msg.sender] = true;
        emit Verified(msg.sender);
    }

    function createCampaign(
        uint8 _method,
        string calldata _ipfsHash,
        uint256 _targetWei,
        uint256 _deadline,
        string calldata _l1Address
    ) external nonReentrant returns (uint256) {
        if (!verified[msg.sender]) revert NotVerified();
        require(_targetWei > 0, "DonationEscrowV2: Target must be > 0");
        require(_deadline > block.timestamp, "DonationEscrowV2: Deadline must be in future");
        require(_method <= uint8(DonationMethod.L1_DIRECT), "DonationEscrowV2: Invalid method");

        campaignCount += 1;
        uint256 id = campaignCount;

        Campaign memory c = Campaign({
            id: id,
            creator: msg.sender,
            method: DonationMethod(_method),
            targetWei: _targetWei,
            deadline: _deadline,
            raisedWei: 0,
            donorCount: 0,
            ipfsHash: _ipfsHash,
            l1Address: _l1Address,
            active: true
        });

        campaignsById[id] = c;
        _campaignIds.push(id);
        _creatorCampaignIds[msg.sender].push(id);

        emit CampaignCreated(id, msg.sender, _method, _targetWei, _deadline, _ipfsHash, _l1Address);
        return id;
    }

    function updateCampaign(
        uint256 campaignId,
        string calldata _ipfsHash,
        uint256 _targetWei,
        uint256 _deadline,
        string calldata _l1Address
    ) external nonReentrant {
        Campaign storage c = campaignsById[campaignId];
        if (c.creator == address(0)) revert NoCampaign();
        if (c.creator != msg.sender) revert NotCreator();
        require(_targetWei > 0, "DonationEscrowV2: Target must be > 0");
        require(_deadline > block.timestamp, "DonationEscrowV2: Deadline must be in future");
        c.ipfsHash = _ipfsHash;
        c.targetWei = _targetWei;
        c.deadline = _deadline;
        c.l1Address = _l1Address;
        emit CampaignUpdated(campaignId, _ipfsHash, _targetWei, _deadline, _l1Address);
    }

    function donate(uint256 campaignId) external payable nonReentrant {
        if (msg.value < MIN_DONATION_WEI) revert AmountTooLow();
        Campaign storage c = campaignsById[campaignId];
        if (c.creator == address(0)) revert NoCampaign();
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.deadline) revert DeadlineNotReached();
        if (c.method != DonationMethod.L2_ESCROW) revert WrongMethod();

        uint256 feeWei = (msg.value * feeBps) / BPS;
        uint256 netWei = msg.value - feeWei;

        if (feeWei > 0) {
            feeRouter.forwardFeeAndRevenueWithRewards{value: feeWei}(msg.sender, "donation", msg.value);
        }

        c.raisedWei += netWei;
        c.donorCount += 1;
        contributions[campaignId][msg.sender] += netWei;

        emit Donated(campaignId, c.creator, msg.sender, netWei, feeWei);
    }

    function claim(uint256 campaignId) external nonReentrant {
        Campaign storage c = campaignsById[campaignId];
        if (c.creator == address(0)) revert NoCampaign();
        if (c.creator != msg.sender) revert NotCreator();
        if (c.method != DonationMethod.L2_ESCROW) revert WrongMethod();
        if (block.timestamp < c.deadline) revert DeadlineNotReached();
        if (c.raisedWei < c.targetWei) revert TargetNotReached();

        uint256 amount = c.raisedWei;
        c.raisedWei = 0;
        c.active = false;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit Claimed(campaignId, msg.sender, amount);
    }

    function claimRefund(uint256 campaignId) external nonReentrant {
        Campaign storage c = campaignsById[campaignId];
        if (c.creator == address(0)) revert NoCampaign();
        if (c.method != DonationMethod.L2_ESCROW) revert WrongMethod();
        if (block.timestamp < c.deadline) revert DeadlineNotReached();
        if (c.raisedWei >= c.targetWei) revert TargetReached();

        uint256 amount = contributions[campaignId][msg.sender];
        if (amount == 0) return;
        contributions[campaignId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit Refunded(campaignId, c.creator, msg.sender, amount);
    }

    function recordL1Donation(
        uint256 campaignId,
        bytes32 _txHash,
        address _donorL2,
        uint256 _amountWei
    ) external onlyRecorder nonReentrant {
        if (l1TxRecorded[_txHash]) revert AlreadyRecorded();
        Campaign storage c = campaignsById[campaignId];
        if (c.creator == address(0)) revert NoCampaign();

        l1TxRecorded[_txHash] = true;
        l1RecordedTotalWei[campaignId] += _amountWei;
        l1RecordedDonationCount[campaignId] += 1;
        loyaltyPoints.awardPointsForPayment(_donorL2, "vdonation-l1", _amountWei);
        emit L1DonationRecorded(campaignId, c.creator, _txHash, _donorL2, _amountWei);
    }

    function unlockModule(
        uint256 campaignId,
        bytes32 moduleId,
        bytes32 l1TxId,
        uint256 paidAmountWei,
        bytes calldata signature
    ) external nonReentrant {
        Campaign storage c = campaignsById[campaignId];
        if (c.creator == address(0)) revert NoCampaign();
        if (c.creator != msg.sender) revert NotCreator();
        if (moduleUnlockTxUsed[l1TxId]) revert AlreadyUsed();

        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(
            keccak256(abi.encodePacked(address(this), campaignId, moduleId, l1TxId, paidAmountWei, msg.sender))
        );

        address recovered = digest.recover(signature);
        if (recovered != moduleSigner) revert InvalidSignature();

        moduleUnlockTxUsed[l1TxId] = true;
        moduleUnlocked[campaignId][moduleId] = true;
        emit ModuleUnlocked(campaignId, moduleId, l1TxId, msg.sender);
    }

    // Enumerable listing
    function getCampaignCount() external view returns (uint256) {
        return _campaignIds.length;
    }

    function campaignIdAt(uint256 index) external view returns (uint256) {
        return _campaignIds[index];
    }

    // Creator listing
    function getCreatorCampaignCount(address creator) external view returns (uint256) {
        return _creatorCampaignIds[creator].length;
    }

    function creatorCampaignIdAt(address creator, uint256 index) external view returns (uint256) {
        return _creatorCampaignIds[creator][index];
    }

    // Admin/ops
    function setRecorder(address _recorder) external onlyOwner {
        require(_recorder != address(0), "DonationEscrowV2: Invalid recorder");
        address old = recorder;
        recorder = _recorder;
        emit RecorderSet(old, _recorder);
    }

    function setFeeRouter(address _feeRouter) external onlyOwner {
        require(_feeRouter != address(0), "DonationEscrowV2: Invalid FeeRouter");
        address old = address(feeRouter);
        feeRouter = IFeeRouter(payable(_feeRouter));
        emit FeeRouterSet(old, _feeRouter);
    }

    function setLoyaltyPoints(address _loyaltyPoints) external onlyOwner {
        require(_loyaltyPoints != address(0), "DonationEscrowV2: Invalid LoyaltyPoints");
        address old = address(loyaltyPoints);
        loyaltyPoints = ILoyaltyPointsV2(_loyaltyPoints);
        emit LoyaltyPointsSet(old, _loyaltyPoints);
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "DonationEscrowV2: Fee cannot exceed 10%");
        uint256 old = feeBps;
        feeBps = _feeBps;
        emit FeeBpsSet(old, _feeBps);
    }

    function setModuleSigner(address _signer) external onlyOwner {
        require(_signer != address(0), "DonationEscrowV2: Invalid signer");
        address old = moduleSigner;
        moduleSigner = _signer;
        emit ModuleSignerSet(old, _signer);
    }

    receive() external payable {}
}

