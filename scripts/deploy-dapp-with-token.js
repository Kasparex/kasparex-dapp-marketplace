/**
 * Deploy dApp with Automatic Token Deployment
 * 
 * This script deploys a new dApp and automatically creates a token for it.
 * Perfect for quick dApp creation through Cursor/command line.
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-dapp-with-token.js --network kasplexL2Testnet
 * 
 * Environment variables (optional, will use defaults if not set):
 *   DAPP_NAME="My Awesome dApp"
 *   DAPP_VERSION="1.0.0"
 *   DAPP_CATEGORY="general"
 *   CONTRACT_NAME="MyContract"  // Name of your contract (must exist in contracts/)
 *   TOKEN_NAME="My Awesome dApp Token"
 *   TOKEN_SYMBOL="MADT"
 *   TOKEN_MAX_SUPPLY="1000000"  // In tokens (will be converted to wei)
 *   
 *   // For ecosystem integration (optional):
 *   PROOF_OF_UTILITY_ADDRESS="0x..."
 *   AFFILIATE_MANAGER_ADDRESS="0x..."
 *   FEE_HANDLER_ADDRESS="0x..."
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\n🚀 Deploying dApp with Automatic Token...\n');
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  console.log(`Network: ${network}\n`);

  // Get required addresses from environment or use defaults
  const treasuryAddress = process.env.TREASURY_ADDRESS || '0x305B4ee627aD8b12bFCF6427453964771aA30622';
  const dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const rewardVaultAddress = process.env.REWARD_VAULT_ADDRESS || '0x59e49E4f60397CC1C2F0eB3d7ebcF9C9c8AACCAD';
  
  // Get dApp configuration
  const dAppName = process.env.DAPP_NAME || 'My Awesome dApp';
  const dAppVersion = process.env.DAPP_VERSION || '1.0.0';
  const dAppCategory = process.env.DAPP_CATEGORY || 'general';
  const contractName = process.env.CONTRACT_NAME || '';
  
  // Get token configuration
  const tokenName = process.env.TOKEN_NAME || `${dAppName} Token`;
  const tokenSymbol = process.env.TOKEN_SYMBOL || 'TOKEN';
  const tokenMaxSupply = process.env.TOKEN_MAX_SUPPLY || '1000000'; // 1M tokens
  
  // Validate contract name
  if (!contractName) {
    console.error('\n❌ ERROR: CONTRACT_NAME environment variable is required\n');
    console.log('Please set CONTRACT_NAME to the name of your contract (e.g., "MyContract")');
    console.log('The contract must exist in the contracts/ directory\n');
    process.exit(1);
  }
  
  console.log('📋 Configuration:');
  console.log('   dApp Name:', dAppName);
  console.log('   Contract Name:', contractName);
  console.log('   dApp Version:', dAppVersion);
  console.log('   dApp Category:', dAppCategory);
  console.log('   Token Name:', tokenName);
  console.log('   Token Symbol:', tokenSymbol);
  console.log('   Token Max Supply:', tokenMaxSupply, 'tokens\n');

  // Validate addresses
  if (!hre.ethers.isAddress(treasuryAddress)) {
    throw new Error(`Invalid treasury address: ${treasuryAddress}`);
  }
  if (!hre.ethers.isAddress(dAppRegistryAddress)) {
    throw new Error(`Invalid DAppRegistry address: ${dAppRegistryAddress}`);
  }
  if (!hre.ethers.isAddress(rewardVaultAddress)) {
    throw new Error(`Invalid RewardVault address: ${rewardVaultAddress}`);
  }

  // Convert max supply to wei
  const maxSupplyWei = hre.ethers.parseEther(tokenMaxSupply);
  console.log('   Token Max Supply (wei):', maxSupplyWei.toString(), '\n');

  // Calculate allocation addresses
  // For simplicity, we'll use the deployer address for liquidity, dev, and airdrop
  // In production, you'd want separate addresses
  const liquidityReserve = deployer.address; // TODO: Set to actual liquidity reserve
  const devAddress = deployer.address;
  const airdropAddress = deployer.address;

  console.log('💰 Allocation addresses:');
  console.log('   Reward Vault (80%):', rewardVaultAddress);
  console.log('   Liquidity Reserve (10%):', liquidityReserve);
  console.log('   Treasury (5%):', treasuryAddress);
  console.log('   Dev Address (3%):', devAddress);
  console.log('   Airdrop Address (2%):', airdropAddress);
  console.log('');

  try {
    // Step 1: Deploy DAppToken
    console.log('1️⃣  Deploying DAppToken...');
    const DAppToken = await hre.ethers.getContractFactory('DAppToken');
    const dAppToken = await DAppToken.deploy(
      tokenName,
      tokenSymbol,
      maxSupplyWei,
      rewardVaultAddress,
      liquidityReserve,
      treasuryAddress,
      devAddress,
      airdropAddress
    );
    await dAppToken.waitForDeployment();
    const tokenAddress = await dAppToken.getAddress();
    console.log('   ✅ DAppToken deployed to:', tokenAddress);

    // Step 2: Deploy dApp contract
    console.log(`\n2️⃣  Deploying ${contractName} Contract...`);
    
    // Get ecosystem contract addresses (optional, depends on your contract)
    const proofOfUtilityAddress = process.env.PROOF_OF_UTILITY_ADDRESS || '';
    const affiliateManagerAddress = process.env.AFFILIATE_MANAGER_ADDRESS || '';
    const feeHandlerAddress = process.env.FEE_HANDLER_ADDRESS || '';
    const feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS || '';
    
    // Deploy contract - adjust constructor parameters based on your contract
    const ContractFactory = await hre.ethers.getContractFactory(contractName);
    
    // TODO: Adjust constructor parameters based on your contract
    // Example for simple contract with FeeCollector:
    let dAppContract;
    if (feeCollectorAddress) {
      dAppContract = await ContractFactory.deploy(feeCollectorAddress);
    } else if (proofOfUtilityAddress && affiliateManagerAddress && feeHandlerAddress) {
      // Example for contract with full ecosystem integration:
      dAppContract = await ContractFactory.deploy(
        proofOfUtilityAddress,
        affiliateManagerAddress,
        feeHandlerAddress,
        dAppRegistryAddress
      );
    } else {
      // Fallback: try deploying with just dAppRegistry
      console.log('   ⚠️  No ecosystem addresses provided, deploying with minimal parameters');
      dAppContract = await ContractFactory.deploy(dAppRegistryAddress);
    }
    
    await dAppContract.waitForDeployment();
    const dAppContractAddress = await dAppContract.getAddress();
    console.log(`   ✅ ${contractName} deployed to:`, dAppContractAddress);

    // Step 3: Register dApp in DAppRegistry
    console.log('\n3️⃣  Registering dApp in DAppRegistry...');
    const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
    const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);
    
    const registerTx = await dAppRegistry.registerDApp(
      dAppName,
      dAppVersion,
      dAppCategory,
      dAppContractAddress
    );
    await registerTx.wait();
    console.log('   ✅ dApp registered in DAppRegistry');
    
    // Get the dApp ID (dAppCount is a public variable, not a function)
    const dAppId = await dAppRegistry.dAppCount();
    console.log('   📝 dApp ID:', dAppId.toString());

    // Step 3.5: Set dApp ID in contract (if contract has setDAppId function)
    try {
      console.log(`\n3️⃣.5 Setting dApp ID in ${contractName}...`);
      if (typeof dAppContract.setDAppId === 'function') {
        const setDAppIdTx = await dAppContract.setDAppId(dAppId);
        await setDAppIdTx.wait();
        console.log(`   ✅ dApp ID set in ${contractName} contract`);
      } else {
        console.log(`   ⚠️  ${contractName} does not have setDAppId function, skipping`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not set dApp ID: ${error.message}`);
      console.log('   💡 This is optional if your contract does not need dApp ID');
    }

    // Step 4: Link token to dApp in DAppRegistry
    console.log('\n4️⃣  Linking token to dApp...');
    try {
      // Check if deployer has admin role (if not, we'll need to grant it or use deployer account)
      const linkTokenTx = await dAppRegistry.linkDAppToToken(
        dAppId, // dApp IDs are 1-indexed
        tokenAddress,
        tokenSymbol,
        maxSupplyWei
      );
      await linkTokenTx.wait();
      console.log('   ✅ Token linked to dApp');
    } catch (error) {
      console.error('   ⚠️  Failed to link token:', error.message);
      console.log('   💡 You may need to link the token manually using the deployer account');
      console.log('   💡 Or grant DEPLOYER_ROLE to the deployer account in DAppRegistry');
      console.log('   📝 Token address:', tokenAddress);
      console.log('   📝 dApp ID:', dAppId.toString());
      console.log('   📝 Token Symbol:', tokenSymbol);
      console.log('   📝 Max Supply:', maxSupplyWei.toString());
    }

    // Step 5: Save deployment info
    const deploymentInfo = {
      network,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      dApp: {
        id: dAppId.toString(),
        name: dAppName,
        version: dAppVersion,
        category: dAppCategory,
        contractAddress: dAppContractAddress,
        tokenAddress: tokenAddress,
        tokenSymbol: tokenSymbol,
        tokenMaxSupply: tokenMaxSupply,
      },
      contracts: {
        dAppContract: dAppContractAddress,
        token: tokenAddress,
        dAppRegistry: dAppRegistryAddress,
        rewardVault: rewardVaultAddress,
        treasury: treasuryAddress,
        proofOfUtility: proofOfUtilityAddress,
        affiliateManager: affiliateManagerAddress,
        feeHandler: feeHandlerAddress,
      },
      allocation: {
        rewardVault: rewardVaultAddress,
        liquidityReserve: liquidityReserve,
        treasury: treasuryAddress,
        devAddress: devAddress,
        airdropAddress: airdropAddress,
      },
    };

    // Save to deployments directory
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `dapp-${dAppId}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\n💾 Deployment info saved to:', deploymentFile);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ DEPLOYMENT SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('\n📦 dApp Details:');
    console.log('   Name:', dAppName);
    console.log('   ID:', dAppId.toString());
    console.log('   Contract:', dAppContractAddress);
    console.log('   Token:', tokenAddress);
    console.log('   Token Symbol:', tokenSymbol);
    console.log('   Max Supply:', tokenMaxSupply, 'tokens');
    console.log('\n🔗 View on Explorer:');
    console.log(`   dApp: https://explorer.kasplex.org/address/${dAppContractAddress}`);
    console.log(`   Token: https://explorer.kasplex.org/address/${tokenAddress}`);
    console.log('\n📋 Next Steps:');
    console.log('   1. Update src/lib/dapps/placeholderDApps.ts with your new dApp');
    console.log('   2. Test the dApp on the frontend');
    console.log('   3. Test token functionality');
    console.log('');

  } catch (error) {
    console.error('\n❌ Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

