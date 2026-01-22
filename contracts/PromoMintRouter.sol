// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./DAppToken.sol";

/**
 * @title PromoMintRouter
 * @dev Mint router for Kasparex token + promotion engine.
 *
 * Responsibilities:
 * - Hold per-token mint configuration (price, tokens per mint, mintable supply, creator/platform wallets).
 * - Enforce percentage-based revenue sharing across creator, platform, and 5 promo slots.
 * - Enforce basic on-chain security for fairness and bot resistance:
 *   - Per-wallet cooldown between mints.
 *   - Daily mint limits per wallet.
 *   - Maximum mints per transaction.
 *   - Optional lifetime mint cap per wallet.
 *
 * Notes:
 * - Slot addresses are provided by the caller based on off-chain promo page state.
 *   Off-chain (Cloudflare Worker + D1) remains canonical for page ownership and rotation.
 * - This contract focuses on transparent, deterministic revenue sharing and basic rate limiting.
 */
contract PromoMintRouter is Ownable, ReentrancyGuard {
    // -------------------------
    // Token configuration
    // -------------------------

    struct TokenConfig {
        address token;          // DAppToken ERC-20 contract
        uint256 mintPrice;      // Price per mint in native token units
        uint256 tokensPerMint;  // Number of tokens minted per mint
        uint256 mintableSupply; // Total mintable amount tracked by router
        uint256 mintedSoFar;    // Amount minted so far (router-side view)
        address creator;        // Token creator wallet
        address platform;       // Kasparex platform wallet
        bool active;            // Whether minting is active
        // Percentages in basis points (10000 = 100%)
        uint16 creatorBps;
        uint16 platformBps;
        uint16[5] slotBps;      // Slot1..Slot5 basis points
    }

    // tokenId (keccak256 of an external identifier, e.g. ticker or registry ID) -> config
    mapping(bytes32 => TokenConfig) public tokenConfigs;

    // -------------------------
    // On-chain security config
    // -------------------------

    struct WalletSecurity {
        uint64 lastMintDay;     // UTC day index (timestamp / 1 days)
        uint64 mintsToday;      // Mints performed in the current day
        uint64 lastMintTime;    // Last mint timestamp (seconds)
        uint256 totalMints;     // Lifetime mints through this router
    }

    // Per-wallet mint security tracking (across all tokens)
    mapping(address => WalletSecurity) public walletSecurity;

    // Cooldown: minimum seconds between mints per wallet
    uint256 public cooldownSeconds = 60;

    // Maximum mints allowed per wallet per day (across all tokens)
    uint256 public maxMintsPerDay = 10;

    // Maximum mints allowed per transaction
    uint256 public maxMintsPerTx = 5;

    // Optional lifetime mint cap per wallet (0 = disabled / unlimited)
    uint256 public maxMintsPerWallet = 0;

    // -------------------------
    // Events
    // -------------------------

    event TokenRegistered(
        bytes32 indexed tokenId,
        address indexed token,
        uint256 mintPrice,
        uint256 tokensPerMint,
        uint256 mintableSupply,
        address indexed creator,
        address platform
    );

    event TokenPercentagesUpdated(
        bytes32 indexed tokenId,
        uint16 creatorBps,
        uint16 platformBps,
        uint16[5] slotBps
    );

    event SecurityParamsUpdated(
        uint256 cooldownSeconds,
        uint256 maxMintsPerDay,
        uint256 maxMintsPerTx,
        uint256 maxMintsPerWallet
    );

    event MintExecuted(
        bytes32 indexed tokenId,
        bytes32 indexed pageId,
        address indexed minter,
        uint256 mintCount,
        uint256 mintPrice,
        uint256 totalPaid,
        address creator,
        address platform,
        address[5] slotsBefore,
        uint256 creatorAmount,
        uint256 platformAmount,
        uint256[5] slotAmounts,
        uint256 timestamp
    );

    event MintBlocked(
        address indexed wallet,
        bytes32 indexed tokenId,
        string reason
    );

    // -------------------------
    // Constructor
    // -------------------------

    constructor(address initialOwner) Ownable(initialOwner) {}

    // -------------------------
    // Admin functions
    // -------------------------

    /**
     * @dev Register a new token configuration.
     * @param tokenId External identifier for this token (e.g. keccak256 of ticker or registry ID).
     * @param token Address of the DAppToken contract.
     * @param mintPrice Mint price in native token units.
     * @param tokensPerMint Amount of tokens minted per mint.
     * @param mintableSupply Total mintable amount tracked by the router.
     * @param creator Creator wallet address.
     * @param platform Platform wallet address.
     * @param creatorBps Creator percentage in basis points.
     * @param platformBps Platform percentage in basis points.
     * @param slotBps Slot percentages (5 entries) in basis points.
     */
    function registerToken(
        bytes32 tokenId,
        address token,
        uint256 mintPrice,
        uint256 tokensPerMint,
        uint256 mintableSupply,
        address creator,
        address platform,
        uint16 creatorBps,
        uint16 platformBps,
        uint16[5] calldata slotBps
    ) external onlyOwner {
        require(tokenId != bytes32(0), "PromoMintRouter: invalid tokenId");
        require(token != address(0), "PromoMintRouter: invalid token");
        require(mintPrice > 0, "PromoMintRouter: mint price must be > 0");
        require(tokensPerMint > 0, "PromoMintRouter: tokensPerMint must be > 0");
        require(mintableSupply > 0, "PromoMintRouter: mintableSupply must be > 0");
        require(creator != address(0), "PromoMintRouter: invalid creator");
        require(platform != address(0), "PromoMintRouter: invalid platform");

        // Ensure percentages sum to 100%
        uint256 totalBps = uint256(creatorBps) + uint256(platformBps);
        for (uint256 i = 0; i < 5; i++) {
            totalBps += uint256(slotBps[i]);
        }
        require(totalBps == 10000, "PromoMintRouter: percentages must sum to 10000");

        TokenConfig storage cfg = tokenConfigs[tokenId];
        require(cfg.token == address(0), "PromoMintRouter: token already registered");

        cfg.token = token;
        cfg.mintPrice = mintPrice;
        cfg.tokensPerMint = tokensPerMint;
        cfg.mintableSupply = mintableSupply;
        cfg.mintedSoFar = 0;
        cfg.creator = creator;
        cfg.platform = platform;
        cfg.active = true;
        cfg.creatorBps = creatorBps;
        cfg.platformBps = platformBps;
        cfg.slotBps = slotBps;

        emit TokenRegistered(
            tokenId,
            token,
            mintPrice,
            tokensPerMint,
            mintableSupply,
            creator,
            platform
        );

        emit TokenPercentagesUpdated(tokenId, creatorBps, platformBps, slotBps);
    }

    /**
     * @dev Update percentages for an existing token.
     */
    function setPercentages(
        bytes32 tokenId,
        uint16 creatorBps,
        uint16 platformBps,
        uint16[5] calldata slotBps
    ) external onlyOwner {
        TokenConfig storage cfg = tokenConfigs[tokenId];
        require(cfg.token != address(0), "PromoMintRouter: unknown token");

        uint256 totalBps = uint256(creatorBps) + uint256(platformBps);
        for (uint256 i = 0; i < 5; i++) {
            totalBps += uint256(slotBps[i]);
        }
        require(totalBps == 10000, "PromoMintRouter: percentages must sum to 10000");

        cfg.creatorBps = creatorBps;
        cfg.platformBps = platformBps;
        cfg.slotBps = slotBps;

        emit TokenPercentagesUpdated(tokenId, creatorBps, platformBps, slotBps);
    }

    /**
     * @dev Update mint price for an existing token.
     */
    function setMintPrice(bytes32 tokenId, uint256 mintPrice) external onlyOwner {
        TokenConfig storage cfg = tokenConfigs[tokenId];
        require(cfg.token != address(0), "PromoMintRouter: unknown token");
        require(mintPrice > 0, "PromoMintRouter: mint price must be > 0");
        cfg.mintPrice = mintPrice;
        emit TokenPercentagesUpdated(tokenId, cfg.creatorBps, cfg.platformBps, cfg.slotBps);
    }

    /**
     * @dev Set active status for a token.
     */
    function setActive(bytes32 tokenId, bool active) external onlyOwner {
        TokenConfig storage cfg = tokenConfigs[tokenId];
        require(cfg.token != address(0), "PromoMintRouter: unknown token");
        cfg.active = active;
    }

    /**
     * @dev Mark a token as completed, disabling further minting.
     */
    function completeMinting(bytes32 tokenId) external onlyOwner {
        TokenConfig storage cfg = tokenConfigs[tokenId];
        require(cfg.token != address(0), "PromoMintRouter: unknown token");
        cfg.active = false;
    }

    /**
     * @dev Configure global security parameters.
     */
    function setSecurityParams(
        uint256 _cooldownSeconds,
        uint256 _maxMintsPerDay,
        uint256 _maxMintsPerTx,
        uint256 _maxMintsPerWallet
    ) external onlyOwner {
        require(_maxMintsPerTx > 0, "PromoMintRouter: maxMintsPerTx must be > 0");
        cooldownSeconds = _cooldownSeconds;
        maxMintsPerDay = _maxMintsPerDay;
        maxMintsPerTx = _maxMintsPerTx;
        maxMintsPerWallet = _maxMintsPerWallet;

        emit SecurityParamsUpdated(
            _cooldownSeconds,
            _maxMintsPerDay,
            _maxMintsPerTx,
            _maxMintsPerWallet
        );
    }

    /**
     * @dev Admin helper to reset a wallet's daily mint count (e.g. manual intervention).
     */
    function resetDailyMintCount(address wallet) external onlyOwner {
        WalletSecurity storage ws = walletSecurity[wallet];
        ws.mintsToday = 0;
    }

    // -------------------------
    // Public view helpers
    // -------------------------

    function getTokenConfig(bytes32 tokenId) external view returns (TokenConfig memory) {
        return tokenConfigs[tokenId];
    }

    function getWalletSecurity(address wallet) external view returns (WalletSecurity memory) {
        return walletSecurity[wallet];
    }

    // -------------------------
    // Internal helpers
    // -------------------------

    function _currentDay() internal view returns (uint64) {
        return uint64(block.timestamp / 1 days);
    }

    function _updateWalletDailyLimits(address wallet, uint256 count) internal returns (bool, string memory) {
        WalletSecurity storage ws = walletSecurity[wallet];
        uint64 today = _currentDay();

        if (ws.lastMintDay != today) {
            ws.lastMintDay = today;
            ws.mintsToday = 0;
        }

        // Cooldown check
        if (cooldownSeconds > 0 && ws.lastMintTime != 0) {
            if (block.timestamp < ws.lastMintTime + cooldownSeconds) {
                return (false, "cooldown active");
            }
        }

        // Daily limit check
        if (maxMintsPerDay > 0) {
            if (uint256(ws.mintsToday) + count > maxMintsPerDay) {
                return (false, "daily mint limit exceeded");
            }
        }

        // Lifetime limit check
        if (maxMintsPerWallet > 0) {
            if (ws.totalMints + count > maxMintsPerWallet) {
                return (false, "lifetime mint limit exceeded");
            }
        }

        // All checks passed, update counters
        ws.mintsToday += uint64(count);
        ws.totalMints += count;
        ws.lastMintTime = uint64(block.timestamp);

        return (true, "");
    }

    // -------------------------
    // Mint function
    // -------------------------

    /**
     * @dev Mint tokens for a specific tokenId via a promo page.
     *
     * @param tokenId Identifier for the token configuration.
     * @param pageId Identifier for the promo page (off-chain context).
     * @param count Number of mints to perform in this transaction.
     * @param pageSlots Slot wallets (slot1..slot5) at the moment of mint.
     */
    function mint(
        bytes32 tokenId,
        bytes32 pageId,
        uint256 count,
        address[5] calldata pageSlots
    ) external payable nonReentrant {
        TokenConfig storage cfg = tokenConfigs[tokenId];
        if (cfg.token == address(0)) {
            emit MintBlocked(msg.sender, tokenId, "unknown token");
            revert("PromoMintRouter: unknown token");
        }
        if (!cfg.active) {
            emit MintBlocked(msg.sender, tokenId, "token inactive");
            revert("PromoMintRouter: minting is not active for this token");
        }

        require(count > 0, "PromoMintRouter: count must be > 0");
        require(count <= maxMintsPerTx, "PromoMintRouter: exceeds maxMintsPerTx");

        // Basic slot validation (no zero addresses)
        for (uint256 i = 0; i < 5; i++) {
            require(pageSlots[i] != address(0), "PromoMintRouter: invalid slot wallet");
        }

        uint256 totalTokensToMint = cfg.tokensPerMint * count;
        require(
            cfg.mintedSoFar + totalTokensToMint <= cfg.mintableSupply,
            "PromoMintRouter: exceeds mintable supply"
        );

        uint256 expectedValue = cfg.mintPrice * count;
        require(msg.value == expectedValue, "PromoMintRouter: incorrect payment amount");

        // On-chain wallet-level security checks
        (bool ok, string memory reason) = _updateWalletDailyLimits(msg.sender, count);
        if (!ok) {
            emit MintBlocked(msg.sender, tokenId, reason);
            revert(reason);
        }

        // Compute payouts
        uint256 totalPaid = msg.value;
        uint256 remaining = totalPaid;

        uint256 creatorAmount = (totalPaid * cfg.creatorBps) / 10000;
        uint256 platformAmount = (totalPaid * cfg.platformBps) / 10000;
        uint256[5] memory slotAmounts;

        for (uint256 i = 0; i < 5; i++) {
            slotAmounts[i] = (totalPaid * cfg.slotBps[i]) / 10000;
        }

        // Adjust remaining to avoid dust
        remaining -= creatorAmount;
        remaining -= platformAmount;
        for (uint256 i = 0; i < 5; i++) {
            remaining -= slotAmounts[i];
        }

        // Send payouts
        // Creator
        if (creatorAmount > 0) {
            (bool cs, ) = payable(cfg.creator).call{value: creatorAmount}("");
            require(cs, "PromoMintRouter: creator payout failed");
        }

        // Platform (includes any rounding dust)
        uint256 platformTotal = platformAmount + remaining;
        if (platformTotal > 0) {
            (bool ps, ) = payable(cfg.platform).call{value: platformTotal}("");
            require(ps, "PromoMintRouter: platform payout failed");
        }

        // Slots
        for (uint256 i = 0; i < 5; i++) {
            uint256 amount = slotAmounts[i];
            if (amount > 0) {
                (bool ss, ) = payable(pageSlots[i]).call{value: amount}("");
                require(ss, "PromoMintRouter: slot payout failed");
            }
        }

        // Mint tokens to user
        DAppToken(cfg.token).mint(msg.sender, totalTokensToMint);

        // Update supply tracking
        cfg.mintedSoFar += totalTokensToMint;
        if (cfg.mintedSoFar >= cfg.mintableSupply) {
            cfg.active = false;
        }

        emit MintExecuted(
            tokenId,
            pageId,
            msg.sender,
            count,
            cfg.mintPrice,
            totalPaid,
            cfg.creator,
            cfg.platform,
            pageSlots,
            creatorAmount,
            platformAmount,
            slotAmounts,
            block.timestamp
        );
    }
}

