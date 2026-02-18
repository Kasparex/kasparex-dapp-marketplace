// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./FeeCollector.sol";
import "./RevenueTreeManager.sol";

/**
 * @title FeeRouter
 * @dev Splits incoming fee between RevenueTreeManager (upline distribution) and FeeCollector (treasury).
 * @notice dApps call forwardFeeAndRevenue(payer) with value; only whitelisted dApp contracts may call.
 */
contract FeeRouter is Ownable {
    uint256 public constant BPS = 10000;

    RevenueTreeManager public revenueTreeManager;
    FeeCollector public feeCollector;
    uint256 public treeBps; // basis points to Revenue Tree (e.g. 8200 = 82%)

    mapping(address => bool) public authorizedDApps;

    event Forwarded(address indexed payer, uint256 total, uint256 toTree, uint256 toTreasury);
    event TreeBpsUpdated(uint256 oldBps, uint256 newBps);
    event AuthorizedDAppSet(address indexed dapp, bool allowed);

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
     * @dev Receive fee and split: treeBps to RevenueTreeManager.distributeToUpline(payer), rest to FeeCollector.
     */
    function forwardFeeAndRevenue(address payer) external payable onlyAuthorizedDApp {
        if (msg.value == 0) return;

        uint256 toTree = (msg.value * treeBps) / BPS;
        uint256 toTreasury = msg.value - toTree;

        if (toTree > 0) {
            revenueTreeManager.distributeToUpline{value: toTree}(payer);
        }
        if (toTreasury > 0) {
            feeCollector.forwardFee{value: toTreasury}();
        }

        emit Forwarded(payer, msg.value, toTree, toTreasury);
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

    receive() external payable {}
}
