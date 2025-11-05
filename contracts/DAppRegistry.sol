// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DAppRegistry
 * @dev Registry for tracking deployed dApps and their metadata
 * @notice This contract manages dApp registration and links them to tokens for future Token Builder
 */
contract DAppRegistry is AccessControl {
    // Role for dApp deployers
    bytes32 public constant DEPLOYER_ROLE = keccak256("DEPLOYER_ROLE");

    // dApp structure
    struct DApp {
        string name;
        string version;
        string category;
        address deployer;
        address contractAddress;
        bool isActive;
        uint256 createdAt;
        address linkedToken; // For future Token Builder integration
    }

    // Mapping from dApp ID to dApp info
    mapping(uint256 => DApp) public dApps;
    
    // Mapping from contract address to dApp ID
    mapping(address => uint256) public contractToDAppId;
    
    // Mapping from token address to array of dApp IDs
    mapping(address => uint256[]) public tokenToDApps;

    // Counter for dApp IDs
    uint256 public dAppCount;

    // Events
    event DAppRegistered(
        uint256 indexed dAppId,
        string name,
        string version,
        address indexed deployer,
        address indexed contractAddress,
        uint256 timestamp
    );
    event DAppLinkedToToken(
        uint256 indexed dAppId,
        address indexed tokenAddress,
        uint256 timestamp
    );
    event DAppStatusUpdated(uint256 indexed dAppId, bool isActive);
    event TokenDAppsUpdated(address indexed tokenAddress, uint256[] dAppIds);

    /**
     * @dev Constructor sets up default admin role
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(DEPLOYER_ROLE, msg.sender);
    }

    /**
     * @dev Register a new dApp
     * @param _name Name of the dApp
     * @param _version Version of the dApp
     * @param _category Category of the dApp
     * @param _contractAddress Address of the dApp contract
     * @return dAppId The ID of the registered dApp
     */
    function registerDApp(
        string memory _name,
        string memory _version,
        string memory _category,
        address _contractAddress
    ) external onlyRole(DEPLOYER_ROLE) returns (uint256) {
        require(_contractAddress != address(0), "DAppRegistry: Invalid contract address");
        require(bytes(_name).length > 0, "DAppRegistry: Name cannot be empty");
        
        // Check if contract is already registered
        require(
            contractToDAppId[_contractAddress] == 0,
            "DAppRegistry: Contract already registered"
        );

        dAppCount++;
        uint256 dAppId = dAppCount;

        dApps[dAppId] = DApp({
            name: _name,
            version: _version,
            category: _category,
            deployer: msg.sender,
            contractAddress: _contractAddress,
            isActive: true,
            createdAt: block.timestamp,
            linkedToken: address(0)
        });

        contractToDAppId[_contractAddress] = dAppId;

        emit DAppRegistered(
            dAppId,
            _name,
            _version,
            msg.sender,
            _contractAddress,
            block.timestamp
        );

        return dAppId;
    }

    /**
     * @dev Link a dApp to a token (for Token Builder)
     * @param _dAppId ID of the dApp
     * @param _tokenAddress Address of the token
     */
    function linkDAppToToken(uint256 _dAppId, address _tokenAddress) external {
        require(_dAppId > 0 && _dAppId <= dAppCount, "DAppRegistry: Invalid dApp ID");
        require(_tokenAddress != address(0), "DAppRegistry: Invalid token address");
        require(dApps[_dAppId].isActive, "DAppRegistry: dApp is not active");
        
        // Only deployer or admin can link
        require(
            dApps[_dAppId].deployer == msg.sender ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "DAppRegistry: Not authorized"
        );

        dApps[_dAppId].linkedToken = _tokenAddress;
        
        // Add to token's dApp list if not already present
        uint256[] storage tokenDApps = tokenToDApps[_tokenAddress];
        bool exists = false;
        for (uint256 i = 0; i < tokenDApps.length; i++) {
            if (tokenDApps[i] == _dAppId) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            tokenDApps.push(_dAppId);
        }

        emit DAppLinkedToToken(_dAppId, _tokenAddress, block.timestamp);
        emit TokenDAppsUpdated(_tokenAddress, tokenToDApps[_tokenAddress]);
    }

    /**
     * @dev Update dApp status (active/inactive)
     * @param _dAppId ID of the dApp
     * @param _isActive New status
     */
    function updateDAppStatus(uint256 _dAppId, bool _isActive) external {
        require(_dAppId > 0 && _dAppId <= dAppCount, "DAppRegistry: Invalid dApp ID");
        require(
            dApps[_dAppId].deployer == msg.sender ||
                hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "DAppRegistry: Not authorized"
        );
        dApps[_dAppId].isActive = _isActive;
        emit DAppStatusUpdated(_dAppId, _isActive);
    }

    /**
     * @dev Get dApp information
     * @param _dAppId ID of the dApp
     * @return DApp struct with all information
     */
    function getDApp(uint256 _dAppId) external view returns (DApp memory) {
        require(_dAppId > 0 && _dAppId <= dAppCount, "DAppRegistry: Invalid dApp ID");
        return dApps[_dAppId];
    }

    /**
     * @dev Get all dApp IDs linked to a token
     * @param _tokenAddress Address of the token
     * @return Array of dApp IDs
     */
    function getTokenDApps(address _tokenAddress)
        external
        view
        returns (uint256[] memory)
    {
        return tokenToDApps[_tokenAddress];
    }

    /**
     * @dev Get dApp ID by contract address
     * @param _contractAddress Address of the dApp contract
     * @return dAppId The ID of the dApp, 0 if not found
     */
    function getDAppIdByContract(address _contractAddress)
        external
        view
        returns (uint256)
    {
        return contractToDAppId[_contractAddress];
    }
}


