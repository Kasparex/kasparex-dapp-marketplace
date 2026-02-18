// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title tKREX
 * @dev Test KREX token for IGRA Galleon Testnet (38836). Mintable by owner.
 */
contract tKREX is ERC20, Ownable {
    constructor() ERC20("Test KREX", "tKREX") Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000_000 * 10**18); // 1B tKREX to deployer
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
