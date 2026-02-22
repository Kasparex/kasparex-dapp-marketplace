// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./IFeeRouter.sol";

interface ILoyaltyPoints {
    function awardPointsForPayment(address user, string calldata actionType, uint256 paymentAmountWei) external;
}

/**
 * @title DonationEscrow
 * @dev Kasparex vDonations: verification, one campaign per verified wallet, L2 escrow with automatic claim/refund. L1 donations recorded for points via recordL1Donation.
 */
contract DonationEscrow is Ownable, ReentrancyGuard {
    uint256 public constant BPS = 10000;
    uint256 public constant MIN_VERIFY_WEI = 1;
    uint256 public constant MIN_DONATION_WEI = 100 * 1e18; // 100 iKAS

    struct Campaign {
        address creator;
        uint256 targetWei;
        uint256 deadline;
        uint256 raisedWei;
        uint256 donorCount;
        string ipfsHash;
        string l1Address;
        bool active;
    }

    mapping(address => bool) public verified;
    mapping(address => Campaign) public campaigns;
    mapping(address => mapping(address => uint256)) public contributions; // creator => donor => amount
    address[] public creatorList;

    mapping(bytes32 => bool) public l1TxRecorded;

    IFeeRouter public feeRouter;
    ILoyaltyPoints public loyaltyPoints;
    uint256 public feeBps; // e.g. 100 = 1%
    address public recorder; // only recorder can call recordL1Donation (API backend)

    event Verified(address indexed user);
    event CampaignCreated(address indexed creator, uint256 targetWei, uint256 deadline, string ipfsHash, string l1Address);
    event Donated(address indexed creator, address indexed donor, uint256 amountWei, uint256 feeWei);
    event Claimed(address indexed creator, uint256 amountWei);
    event Refunded(address indexed creator, address indexed donor, uint256 amountWei);
    event L1DonationRecorded(bytes32 indexed txHash, address indexed donorL2, uint256 amountWei);
    event RecorderSet(address indexed oldRecorder, address indexed newRecorder);
    event FeeRouterSet(address indexed oldRouter, address indexed newRouter);
    event LoyaltyPointsSet(address indexed oldLp, address indexed newLp);
    event FeeBpsSet(uint256 oldBps, uint256 newBps);

    error NotVerified();
    error CampaignExists();
    error NoCampaign();
    error CampaignInactive();
    error DeadlineNotReached();
    error DeadlineNotPassed();
    error TargetNotReached();
    error TargetReached();
    error AmountTooLow();
    error AlreadyRecorded();
    error UnauthorizedRecorder();
    error TransferFailed();

    modifier onlyRecorder() {
        if (msg.sender != recorder && msg.sender != owner()) revert UnauthorizedRecorder();
        _;
    }

    constructor(
        address _feeRouter,
        address _loyaltyPoints,
        uint256 _feeBps,
        address _recorder
    ) Ownable(msg.sender) {
        require(_feeRouter != address(0), "DonationEscrow: Invalid FeeRouter");
        require(_loyaltyPoints != address(0), "DonationEscrow: Invalid LoyaltyPoints");
        require(_feeBps <= 1000, "DonationEscrow: Fee cannot exceed 10%");
        require(_recorder != address(0), "DonationEscrow: Invalid recorder");
        feeRouter = IFeeRouter(payable(_feeRouter));
        loyaltyPoints = ILoyaltyPoints(_loyaltyPoints);
        feeBps = _feeBps;
        recorder = _recorder;
    }

    /**
     * @dev Verify wallet with a tiny payment. Only verified can create a campaign.
     */
    function verify() external payable {
        require(msg.value >= MIN_VERIFY_WEI, "DonationEscrow: Min verify amount");
        require(!verified[msg.sender], "DonationEscrow: Already verified");
        verified[msg.sender] = true;
        emit Verified(msg.sender);
        // Optional: forward verify payment to treasury; for simplicity we keep in contract (owner can withdraw)
    }

    /**
     * @dev Create campaign (one per verified wallet). l1Address = Kaspa L1 address for L1 donations.
     */
    function createCampaign(
        string calldata _ipfsHash,
        uint256 _targetWei,
        uint256 _deadline,
        string calldata _l1Address
    ) external nonReentrant {
        if (!verified[msg.sender]) revert NotVerified();
        if (campaigns[msg.sender].creator != address(0)) revert CampaignExists();
        require(_targetWei > 0, "DonationEscrow: Target must be > 0");
        require(_deadline > block.timestamp, "DonationEscrow: Deadline must be in future");

        campaigns[msg.sender] = Campaign({
            creator: msg.sender,
            targetWei: _targetWei,
            deadline: _deadline,
            raisedWei: 0,
            donorCount: 0,
            ipfsHash: _ipfsHash,
            l1Address: _l1Address,
            active: true
        });
        creatorList.push(msg.sender);
        emit CampaignCreated(msg.sender, _targetWei, _deadline, _ipfsHash, _l1Address);
    }

    /**
     * @dev Update campaign metadata (goals, description, social links via new IPFS hash), target, deadline, or L1 address. Creator only.
     */
    function updateCampaign(
        string calldata _ipfsHash,
        uint256 _targetWei,
        uint256 _deadline,
        string calldata _l1Address
    ) external nonReentrant {
        Campaign storage c = campaigns[msg.sender];
        if (c.creator == address(0)) revert NoCampaign();
        require(_targetWei > 0, "DonationEscrow: Target must be > 0");
        require(_deadline > block.timestamp, "DonationEscrow: Deadline must be in future");
        c.ipfsHash = _ipfsHash;
        c.targetWei = _targetWei;
        c.deadline = _deadline;
        c.l1Address = _l1Address;
    }

    /**
     * @dev Donate to a campaign. Fee goes to FeeRouter (Revenue Tree + tGRID/GRID + points); rest escrowed.
     */
    function donate(address _creator) external payable nonReentrant {
        if (msg.value < MIN_DONATION_WEI) revert AmountTooLow();
        Campaign storage c = campaigns[_creator];
        if (c.creator == address(0)) revert NoCampaign();
        if (!c.active) revert CampaignInactive();
        if (block.timestamp >= c.deadline) revert DeadlineNotReached();

        uint256 feeWei = (msg.value * feeBps) / BPS;
        uint256 netWei = msg.value - feeWei;

        if (feeWei > 0) {
            feeRouter.forwardFeeAndRevenueWithRewards{value: feeWei}(msg.sender, "donation", msg.value);
        }

        c.raisedWei += netWei;
        c.donorCount += 1;
        contributions[_creator][msg.sender] += netWei;

        emit Donated(_creator, msg.sender, netWei, feeWei);
    }

    /**
     * @dev Creator claims escrowed funds when target reached and deadline passed.
     */
    function claim() external nonReentrant {
        Campaign storage c = campaigns[msg.sender];
        if (c.creator == address(0)) revert NoCampaign();
        if (block.timestamp < c.deadline) revert DeadlineNotReached();
        if (c.raisedWei < c.targetWei) revert TargetNotReached();

        uint256 amount = c.raisedWei;
        c.raisedWei = 0;
        c.active = false;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit Claimed(msg.sender, amount);
    }

    /**
     * @dev Donor claims refund when deadline passed and target not reached.
     */
    function claimRefund(address _creator) external nonReentrant {
        Campaign storage c = campaigns[_creator];
        if (c.creator == address(0)) revert NoCampaign();
        if (block.timestamp < c.deadline) revert DeadlineNotReached();
        if (c.raisedWei >= c.targetWei) revert TargetReached();

        uint256 amount = contributions[_creator][msg.sender];
        if (amount == 0) return;
        contributions[_creator][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) revert TransferFailed();
        emit Refunded(_creator, msg.sender, amount);
    }

    /**
     * @dev Record L1 donation (called by API/recorder after verifying L1 tx). Awards points to donorL2.
     */
    function recordL1Donation(
        address _creator,
        bytes32 _txHash,
        address _donorL2,
        uint256 _amountWei
    ) external onlyRecorder nonReentrant {
        if (l1TxRecorded[_txHash]) revert AlreadyRecorded();
        Campaign storage c = campaigns[_creator];
        if (c.creator == address(0)) revert NoCampaign();

        l1TxRecorded[_txHash] = true;
        loyaltyPoints.awardPointsForPayment(_donorL2, "vdonation-l1", _amountWei);
        emit L1DonationRecorded(_txHash, _donorL2, _amountWei);
    }

    function getCreatorCount() external view returns (uint256) {
        return creatorList.length;
    }

    function creatorAt(uint256 index) external view returns (address) {
        return creatorList[index];
    }

    function setRecorder(address _recorder) external onlyOwner {
        require(_recorder != address(0), "DonationEscrow: Invalid recorder");
        address old = recorder;
        recorder = _recorder;
        emit RecorderSet(old, _recorder);
    }

    function setFeeRouter(address _feeRouter) external onlyOwner {
        require(_feeRouter != address(0), "DonationEscrow: Invalid FeeRouter");
        address old = address(feeRouter);
        feeRouter = IFeeRouter(payable(_feeRouter));
        emit FeeRouterSet(old, _feeRouter);
    }

    function setLoyaltyPoints(address _loyaltyPoints) external onlyOwner {
        require(_loyaltyPoints != address(0), "DonationEscrow: Invalid LoyaltyPoints");
        address old = address(loyaltyPoints);
        loyaltyPoints = ILoyaltyPoints(_loyaltyPoints);
        emit LoyaltyPointsSet(old, _loyaltyPoints);
    }

    function setFeeBps(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "DonationEscrow: Fee cannot exceed 10%");
        uint256 old = feeBps;
        feeBps = _feeBps;
        emit FeeBpsSet(old, _feeBps);
    }

    receive() external payable {}
}
