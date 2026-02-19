// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title tGRID
 * @dev Test GRID token for IGRA Galleon Testnet (38836). Same economics as GRID; mintable by owner for testnet use.
 * @notice Max supply 10B tGRID; pre-minted to reward vault; owner can mint more for testing.
 */
contract tGRID is ERC20, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**18;

    address public rewardVault;
    uint256 public totalBurned;

    event TokensBurned(address indexed from, uint256 amount);
    event RewardVaultUpdated(address indexed oldVault, address indexed newVault);
    event Minted(address indexed to, uint256 amount);

    constructor(address _rewardVault) ERC20("Test GRID Token", "tGRID") Ownable(msg.sender) {
        require(_rewardVault != address(0), "tGRID: Invalid reward vault");
        rewardVault = _rewardVault;
        _mint(_rewardVault, MAX_SUPPLY);
    }

    /**
     * @dev Mint additional tokens (testnet only; for reward distribution top-ups).
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit Minted(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        totalBurned += amount;
        emit TokensBurned(msg.sender, amount);
    }

    function burnFrom(address from, uint256 amount) external {
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        totalBurned += amount;
        emit TokensBurned(from, amount);
    }

    function setRewardVault(address _rewardVault) external onlyOwner {
        require(_rewardVault != address(0), "tGRID: Invalid reward vault");
        address oldVault = rewardVault;
        rewardVault = _rewardVault;
        emit RewardVaultUpdated(oldVault, _rewardVault);
    }

    function circulatingSupply() external view returns (uint256) {
        return totalSupply() - totalBurned;
    }

    function burnPercentage() external view returns (uint256) {
        if (MAX_SUPPLY == 0) return 0;
        return (totalBurned * 10000) / MAX_SUPPLY;
    }
}
