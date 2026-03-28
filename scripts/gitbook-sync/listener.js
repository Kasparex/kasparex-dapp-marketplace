/**
 * Event Listener
 * 
 * Monitors DAppRegistry contract events and automatically syncs documentation
 */

const { ethers } = require('ethers');
const { SyncService } = require('./sync-service');
const fs = require('fs');
const path = require('path');
// Load .env.local first, then .env
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });
require('dotenv').config();

class EventListener {
  constructor(config, syncService) {
    this.config = config;
    this.syncService = syncService;
    this.provider = null;
    this.contract = null;
    this.isListening = false;
  }

  /**
   * Initialize provider and contract
   */
  async initialize(networkName = 'kasplexL2Testnet') {
    // Get RPC URL from network
    const rpcUrls = {
      kasplexL2Testnet: process.env.RPC_URL_TESTNET || 'https://evmrpc-testnet.kasplex.org',
      kasplexL2Mainnet: process.env.RPC_URL_MAINNET || 'https://evmrpc.kasplex.org',
      igraMainnet: process.env.IGRA_MAINNET_RPC || 'https://rpc.igralabs.com:8545',
    };

    const rpcUrl = rpcUrls[networkName];
    if (!rpcUrl) {
      throw new Error(`Unknown network: ${networkName}`);
    }

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // DAppRegistry contract address
    const registryAddresses = {
      kasplexL2Testnet: '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd',
      kasplexL2Mainnet: '0xDC88585B22f11f4d2b7bbbf0e134E606629C1C40',
    };

    const registryAddress = registryAddresses[networkName];
    if (!registryAddress) {
      throw new Error(`DAppRegistry not deployed on ${networkName}`);
    }

    // DAppRegistry ABI (minimal for events)
    const registryABI = [
      'event DAppRegistered(uint256 indexed dAppId, string name, string version, address indexed deployer, address indexed contractAddress, uint256 timestamp)',
      'event DAppMetadataUpdated(uint256 indexed dAppId, string ipfsCID, uint256 timestamp)',
      'event DAppStatusUpdated(uint256 indexed dAppId, bool isActive)',
      'function dAppCount() view returns (uint256)',
    ];

    this.contract = new ethers.Contract(registryAddress, registryABI, this.provider);
    this.networkName = networkName;

    console.log(`âś… Initialized event listener for ${networkName}`);
    console.log(`   Contract: ${registryAddress}`);
  }

  /**
   * Start listening for events
   */
  async start() {
    if (this.isListening) {
      console.log('âš ď¸Ź  Listener is already running');
      return;
    }

    if (!this.contract) {
      throw new Error('Listener not initialized. Call initialize() first.');
    }

    this.isListening = true;
    console.log('\nđź‘‚ Starting event listener...');
    console.log('   Listening for DAppRegistered, DAppMetadataUpdated, and DAppStatusUpdated events');
    console.log('   Press Ctrl+C to stop\n');

    // Listen for DAppRegistered events
    this.contract.on('DAppRegistered', async (dAppId, name, version, deployer, contractAddress, timestamp) => {
      console.log(`\nđź“˘ New dApp registered: ${name} (ID: ${dAppId})`);
      console.log(`   Deployer: ${deployer}`);
      console.log(`   Contract: ${contractAddress}`);
      
      try {
        await this.syncService.syncDApp(Number(dAppId), this.networkName);
        console.log(`   âś… Documentation synced for ${name}\n`);
      } catch (error) {
        console.error(`   âťŚ Error syncing documentation: ${error.message}\n`);
      }
    });

    // Listen for DAppMetadataUpdated events
    this.contract.on('DAppMetadataUpdated', async (dAppId, ipfsCID) => {
      console.log(`\nđź“˘ dApp metadata updated: ID ${dAppId}`);
      console.log(`   IPFS CID: ${ipfsCID}`);
      
      try {
        await this.syncService.syncDApp(Number(dAppId), this.networkName);
        console.log(`   âś… Documentation synced for dApp ID ${dAppId}\n`);
      } catch (error) {
        console.error(`   âťŚ Error syncing documentation: ${error.message}\n`);
      }
    });

    // Listen for DAppStatusUpdated events
    this.contract.on('DAppStatusUpdated', async (dAppId, isActive) => {
      console.log(`\nđź“˘ dApp status updated: ID ${dAppId}, Active: ${isActive}`);
      
      try {
        await this.syncService.syncDApp(Number(dAppId), this.networkName);
        console.log(`   âś… Documentation synced for dApp ID ${dAppId}\n`);
      } catch (error) {
        console.error(`   âťŚ Error syncing documentation: ${error.message}\n`);
      }
    });

    // Keep process alive
    process.on('SIGINT', () => {
      console.log('\n\nđź›‘ Stopping event listener...');
      this.stop();
      process.exit(0);
    });
  }

  /**
   * Stop listening for events
   */
  stop() {
    if (!this.isListening) {
      return;
    }

    if (this.contract) {
      this.contract.removeAllListeners();
    }

    this.isListening = false;
    console.log('âś… Event listener stopped');
  }

  /**
   * Sync all existing dApps (useful for initial setup)
   */
  async syncExisting() {
    console.log('\nđź”„ Syncing existing dApps...');
    await this.syncService.syncAllDApps(this.networkName);
  }
}

/**
 * Main function for running listener
 */
async function main() {
  const args = process.argv.slice(2);
  const networkName = args[0] || 'kasplexL2Testnet';
  const syncExistingFlag = args.includes('--sync-existing');

  try {
    // Load config
    const config = {
      apiToken: process.env.GITBOOK_API_TOKEN,
      spaceId: process.env.GITBOOK_SPACE_ID,
      organizationId: process.env.GITBOOK_ORGANIZATION_ID,
    };

    if (!config.apiToken || !config.spaceId) {
      throw new Error('GITBOOK_API_TOKEN and GITBOOK_SPACE_ID must be set in environment');
    }

    // Initialize sync service
    const syncService = new SyncService(config);
    await syncService.initialize();

    // Initialize and start listener
    const listener = new EventListener(config, syncService);
    await listener.initialize(networkName);

    // Sync existing dApps if flag is set
    if (syncExistingFlag) {
      await listener.syncExisting();
    }

    // Start listening
    await listener.start();
  } catch (error) {
    console.error('âťŚ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { EventListener };

