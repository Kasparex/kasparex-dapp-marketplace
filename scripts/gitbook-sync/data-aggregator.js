/**
 * Data Aggregator
 * 
 * Collects dApp data from multiple sources:
 * - DAppRegistry contract (on-chain)
 * - Frontend config (src/lib/dapps.ts)
 * - Contract ABIs (src/lib/contracts/abis.ts)
 * - Contract addresses (src/lib/contracts/addresses.ts)
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config();

class DataAggregator {
  constructor() {
    this.dappsConfig = null;
    this.contractABIs = null;
    this.contractAddresses = null;
  }

  /**
   * Load frontend dApp configuration
   */
  loadDAppsConfig() {
    try {
      const dappsPath = path.join(__dirname, '../../src/lib/dapps.ts');
      const content = fs.readFileSync(dappsPath, 'utf-8');
      this.dappsConfig = { raw: content };
      
      // Parse dApps from the TypeScript file (simple regex-based parsing)
      const dApps = this.parseDAppsFromContent(content);
      this.dappsConfig.parsed = dApps;
      return dApps;
    } catch (error) {
      console.warn('Could not load dApps config:', error.message);
      return [];
    }
  }

  /**
   * Parse dApps from TypeScript content (simple approach)
   */
  parseDAppsFromContent(content) {
    const dApps = [];
    
    // Find the placeholderDApps array
    const arrayMatch = content.match(/export const placeholderDApps[^=]*=\s*\[([\s\S]*?)\];/);
    if (!arrayMatch) return dApps;
    
    const arrayContent = arrayMatch[1];
    
    // Split by object boundaries (simple approach)
    const objectRegex = /\{[\s\S]*?\}(?=\s*,\s*\{|\s*,\s*$|$)/g;
    let match;
    let index = 0;
    
    while ((match = objectRegex.exec(arrayContent)) !== null) {
      const objContent = match[0];
      
      // Extract basic fields
      const nameMatch = objContent.match(/name:\s*['"]([^'"]+)['"]/);
      const idMatch = objContent.match(/id:\s*['"]([^'"]+)['"]/);
      const categoryMatch = objContent.match(/category:\s*['"]([^'"]+)['"]/);
      const utilityMatch = objContent.match(/utility:\s*['"]([^'"]+)['"]/);
      const processMatch = objContent.match(/process:\s*['"]([^'"]+)['"]/);
      const benefitsMatch = objContent.match(/benefits:\s*['"]([^'"]+)['"]/);
      const developerMatch = objContent.match(/developer:\s*['"]([^'"]+)['"]/);
      const statusMatch = objContent.match(/status:\s*['"]([^'"]+)['"]/);
      const networkMatch = objContent.match(/network:\s*['"]([^'"]+)['"]/);
      const versionMatch = objContent.match(/version:\s*['"]([^'"]+)['"]/);
      const descriptionMatch = objContent.match(/description:\s*['"]([^'"]+)['"]/);
      
      // Extract developer links array
      const developerLinksMatch = objContent.match(/developerLinks:\s*\[([\s\S]*?)\]/);
      const developerLinks = [];
      if (developerLinksMatch) {
        const linksContent = developerLinksMatch[1];
        const linkRegex = /\{[\s\S]*?\}/g;
        let linkMatch;
        while ((linkMatch = linkRegex.exec(linksContent)) !== null) {
          const linkObj = linkMatch[0];
          const labelMatch = linkObj.match(/label:\s*['"]([^'"]+)['"]/);
          const urlMatch = linkObj.match(/url:\s*['"]([^'"]+)['"]/);
          if (labelMatch && urlMatch) {
            developerLinks.push({
              label: labelMatch[1],
              url: urlMatch[1],
            });
          }
        }
      }
      
      if (nameMatch && idMatch) {
        dApps.push({
          id: idMatch[1],
          name: nameMatch[1],
          category: categoryMatch ? categoryMatch[1] : 'general',
          utility: utilityMatch ? utilityMatch[1] : '',
          process: processMatch ? processMatch[1] : '',
          benefits: benefitsMatch ? benefitsMatch[1] : '',
          developer: developerMatch ? developerMatch[1] : 'Kasparex',
          developerLinks: developerLinks.length > 0 ? developerLinks : [],
          status: statusMatch ? statusMatch[1] : 'Testnet',
          network: networkMatch ? networkMatch[1] : 'Testnet',
          version: versionMatch ? versionMatch[1] : '1.0',
          description: descriptionMatch ? descriptionMatch[1] : '',
        });
      }
    }
    
    return dApps;
  }

  /**
   * Load contract ABIs
   */
  loadContractABIs() {
    try {
      const abisPath = path.join(__dirname, '../../src/lib/contracts/abis.ts');
      const content = fs.readFileSync(abisPath, 'utf-8');
      this.contractABIs = { raw: content };
    } catch (error) {
      console.warn('Could not load contract ABIs:', error.message);
    }
  }

  /**
   * Load contract addresses
   */
  loadContractAddresses() {
    try {
      const addressesPath = path.join(__dirname, '../../src/lib/contracts/addresses.ts');
      const content = fs.readFileSync(addressesPath, 'utf-8');
      this.contractAddresses = { raw: content };
    } catch (error) {
      console.warn('Could not load contract addresses:', error.message);
    }
  }

  /**
   * Get dApp data from DAppRegistry contract
   */
  async getDAppFromContract(dAppId, networkName = 'kasplexL2Testnet') {
    try {
      // Get provider for the network
      let provider;
      let registryAddress;
      
      if (networkName === 'kasplexL2Testnet') {
        registryAddress = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
        const rpcUrl = process.env.KASPLEX_L2_TESTNET_RPC || 'https://rpc.kasplextest.xyz';
        provider = new ethers.JsonRpcProvider(rpcUrl);
      } else if (networkName === 'kasplexL2Mainnet') {
        registryAddress = '0xDC88585B22f11f4d2b7bbbf0e134E606629C1C40';
        const rpcUrl = process.env.KASPLEX_L2_MAINNET_RPC || 'https://evmrpc.kasplex.org';
        provider = new ethers.JsonRpcProvider(rpcUrl);
      } else if (networkName === 'igraGalleonTestnet') {
        registryAddress = '0x0530c962A17fB4602418087689e762e5989f1D43';
        const rpcUrl =
          process.env.IGRA_GALLEON_TESTNET_RPC || 'https://galleon-testnet.igralabs.com:8545';
        provider = new ethers.JsonRpcProvider(rpcUrl, {
          name: 'igra-galleon-testnet',
          chainId: 38836,
        });
      } else {
        throw new Error(`Unknown network: ${networkName}`);
      }

      // DAppRegistry ABI (minimal for getDApp function)
      const registryABI = [
        'function getDApp(uint256 _dAppId) external view returns (tuple(string name, string version, string category, address deployer, address contractAddress, bool isActive, uint256 createdAt, address tokenAddress, string ticker, uint256 totalSupply, string ipfsCID))',
        'function dAppCount() external view returns (uint256)',
      ];

      const registry = new ethers.Contract(registryAddress, registryABI, provider);
      const dAppData = await registry.getDApp(dAppId);

      return {
        id: dAppId,
        name: dAppData.name,
        version: dAppData.version,
        category: dAppData.category,
        deployer: dAppData.deployer,
        contractAddress: dAppData.contractAddress,
        isActive: dAppData.isActive,
        createdAt: dAppData.createdAt.toString(),
        tokenAddress: dAppData.tokenAddress,
        ticker: dAppData.ticker,
        totalSupply: dAppData.totalSupply.toString(),
        ipfsCID: dAppData.ipfsCID,
      };
    } catch (error) {
      console.error(`Error fetching dApp ${dAppId} from contract:`, error.message);
      return null;
    }
  }

  /**
   * Get all dApps from contract
   */
  async getAllDAppsFromContract(networkName = 'kasplexL2Testnet') {
    try {
      // Get provider for the network
      let provider;
      let registryAddress;
      
      if (networkName === 'kasplexL2Testnet') {
        registryAddress = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
        // Try multiple RPC URLs
        const rpcUrls = [
          process.env.KASPLEX_L2_TESTNET_RPC,
          'https://rpc.kasplextest.xyz',
          'https://evmrpc-testnet.kasplex.org',
        ].filter(Boolean);
        
        let lastError;
        for (const rpcUrl of rpcUrls) {
          try {
            provider = new ethers.JsonRpcProvider(rpcUrl, { name: 'kasplex-testnet', chainId: 167012 });
            // Test connection
            await provider.getBlockNumber();
            console.log(`   ✅ Connected to RPC: ${rpcUrl}`);
            break;
          } catch (error) {
            lastError = error;
            console.warn(`   ⚠️  Failed to connect to ${rpcUrl}: ${error.message}`);
            continue;
          }
        }
        
        if (!provider) {
          throw new Error(`Could not connect to any RPC endpoint. Last error: ${lastError?.message}`);
        }
      } else if (networkName === 'kasplexL2Mainnet') {
        registryAddress = '0xDC88585B22f11f4d2b7bbbf0e134E606629C1C40';
        const rpcUrl = process.env.KASPLEX_L2_MAINNET_RPC || 'https://evmrpc.kasplex.org';
        provider = new ethers.JsonRpcProvider(rpcUrl, { name: 'kasplex-mainnet', chainId: 202555 });
      } else if (networkName === 'igraGalleonTestnet') {
        registryAddress = '0x0530c962A17fB4602418087689e762e5989f1D43';
        const rpcUrl =
          process.env.IGRA_GALLEON_TESTNET_RPC || 'https://galleon-testnet.igralabs.com:8545';
        provider = new ethers.JsonRpcProvider(rpcUrl, {
          name: 'igra-galleon-testnet',
          chainId: 38836,
        });
      } else {
        throw new Error(`Unknown network: ${networkName}`);
      }

      // DAppRegistry ABI
      const registryABI = [
        'function getDApp(uint256 _dAppId) external view returns (tuple(string name, string version, string category, address deployer, address contractAddress, bool isActive, uint256 createdAt, address tokenAddress, string ticker, uint256 totalSupply, string ipfsCID))',
        'function dAppCount() external view returns (uint256)',
      ];

      const registry = new ethers.Contract(registryAddress, registryABI, provider);
      const dAppCount = await registry.dAppCount();
      
      console.log(`   Found ${dAppCount.toString()} dApp(s) in registry`);
      
      const dApps = [];
      for (let i = 1; i <= dAppCount; i++) {
        const dApp = await this.getDAppFromContract(i, networkName);
        if (dApp) {
          dApps.push(dApp);
        }
      }

      return dApps;
    } catch (error) {
      console.error('Error fetching all dApps:', error.message);
      console.log('   💡 Tip: If no dApps are registered on-chain, you can still sync from frontend config');
      return [];
    }
  }

  /**
   * Get contract ABI by name
   */
  getContractABI(contractName) {
    // This is a simplified version - in production, parse the TypeScript file properly
    // For now, we'll try to read from artifacts
    try {
      const artifactPath = path.join(
        __dirname,
        `../../artifacts/contracts/${contractName}.sol/${contractName}.json`
      );
      if (fs.existsSync(artifactPath)) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf-8'));
        return artifact.abi;
      }
    } catch (error) {
      console.warn(`Could not load ABI for ${contractName}:`, error.message);
    }
    return null;
  }

  /**
   * Get contract address for a network
   */
  getContractAddress(contractName, networkName = 'kasplexL2Testnet') {
    // Simplified - would need proper TypeScript parsing in production
    // For now, use hardcoded addresses from addresses.ts
    const addresses = {
      kasplexL2Testnet: {
        DAppRegistry: '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd',
        QuizToEarn: '0x7EF3E5215c722D7A3D41C2426e57b1B4A5bC4a05',
        DAOVoting: '0xf5b2a43A626116690675676C00f4b2c4c86020D3',
        SimplePayment: '0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85',
      },
      kasplexL2Mainnet: {
        DAOVoting: '0x97004140704097e122CB7B9808330c80464ab69d',
      },
      igraGalleonTestnet: {
        DAppRegistry: '0x0530c962A17fB4602418087689e762e5989f1D43',
        SimplePayment: '0xe9f4A74E979080E3788711A11FC9F33c7a19eF82',
      },
    };

    return addresses[networkName]?.[contractName] || '';
  }

  /**
   * Aggregate all data for a dApp
   */
  async aggregateDAppData(dAppId, networkName = 'kasplexL2Testnet') {
    const contractData = await this.getDAppFromContract(dAppId, networkName);
    if (!contractData) {
      return null;
    }

    const contractName = this.inferContractName(contractData.name);
    const abi = this.getContractABI(contractName);
    const address = this.getContractAddress(contractName, networkName) || contractData.contractAddress;

    return {
      ...contractData,
      contractName,
      abi,
      address,
      networkName,
    };
  }

  /**
   * Infer contract name from dApp name
   */
  inferContractName(dAppName) {
    // Map common dApp names to contract names
    const mapping = {
      'Quiz to Earn': 'QuizToEarn',
      'DAO Voting': 'DAOVoting',
      'Simple Payment': 'SimplePayment',
      'Subscription Checker': 'DAppSubscription',
    };

    return mapping[dAppName] || dAppName.replace(/\s+/g, '');
  }

  /**
   * Initialize - load all configs
   */
  initialize() {
    this.loadDAppsConfig();
    this.loadContractABIs();
    this.loadContractAddresses();
  }
}

module.exports = { DataAggregator };

