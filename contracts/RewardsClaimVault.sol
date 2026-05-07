// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title RewardsClaimVault
 * @notice Public ERC20 deposit; only hub-signed EIP-712 claims move tokens out. No owner withdraw.
 *         claimSigner is immutable (constructor only).
 */
contract RewardsClaimVault is EIP712 {
    using SafeERC20 for IERC20;

    bytes32 private constant CLAIM_TYPEHASH = keccak256(
        "Claim(address beneficiary,address token,uint256 amount,uint256 ptsConsumed,bytes32 requestId,uint256 nonce,uint256 deadline)"
    );

    address public immutable claimSigner;
    mapping(address => uint256) public nonces;

    event Deposited(address indexed token, address indexed from, uint256 amount);
    event Claimed(address indexed beneficiary, address indexed token, uint256 amount, bytes32 indexed requestId);

    constructor(address claimSigner_) EIP712("KasparexRewardsPool", "1") {
        require(claimSigner_ != address(0), "RewardsClaimVault: signer");
        claimSigner = claimSigner_;
    }

    function deposit(address token, uint256 amount) external {
        require(token != address(0), "RewardsClaimVault: token");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit Deposited(token, msg.sender, amount);
    }

    function claim(
        address beneficiary,
        address token,
        uint256 amount,
        uint256 ptsConsumed,
        bytes32 requestId,
        uint256 deadline,
        bytes calldata signature
    ) external {
        require(block.timestamp <= deadline, "RewardsClaimVault: expired");
        require(beneficiary != address(0) && token != address(0), "RewardsClaimVault: zero");
        uint256 nonce = nonces[beneficiary];
        bytes32 structHash = keccak256(
            abi.encode(
                CLAIM_TYPEHASH,
                beneficiary,
                token,
                amount,
                ptsConsumed,
                requestId,
                nonce,
                deadline
            )
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        require(recovered == claimSigner, "RewardsClaimVault: bad sig");
        nonces[beneficiary] = nonce + 1;
        IERC20(token).safeTransfer(beneficiary, amount);
        emit Claimed(beneficiary, token, amount, requestId);
    }
}
