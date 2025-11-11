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
 *   TOKEN_NAME="My Awesome dApp Token"
 *   TOKEN_SYMBOL="MADT"
 *   TOKEN_MAX_SUPPLY="1000000"  // In tokens (will be converted to wei)
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
  const dAppName = process.env.DAPP_NAME || 'KAS Tipping System';
  const dAppVersion = process.env.DAPP_VERSION || '1.0.0';
  const dAppCategory = process.env.DAPP_CATEGORY || 'social';
  
  // Get token configuration
  const tokenName = process.env.TOKEN_NAME || `${dAppName} Token`;
  const tokenSymbol = process.env.TOKEN_SYMBOL || 'KAST';
  const tokenMaxSupply = process.env.TOKEN_MAX_SUPPLY || '1000000'; // 1M tokens
  
  console.log('📋 Configuration:');
  console.log('   dApp Name:', dAppName);
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

    // Step 2: Deploy KASTip dApp contract
    console.log('\n2️⃣  Deploying KASTip Contract...');
    
    // Get ecosystem contract addresses
    const proofOfUtilityAddress = process.env.PROOF_OF_UTILITY_ADDRESS || '';
    const affiliateManagerAddress = process.env.AFFILIATE_MANAGER_ADDRESS || '';
    const feeHandlerAddress = process.env.FEE_HANDLER_ADDRESS || '';
    
    if (!proofOfUtilityAddress || !affiliateManagerAddress || !feeHandlerAddress) {
      console.error('\n❌ ERROR: Missing ecosystem contract addresses\n');
      console.log('Required environment variables:');
      console.log('   PROOF_OF_UTILITY_ADDRESS');
      console.log('   AFFILIATE_MANAGER_ADDRESS');
      console.log('   FEE_HANDLER_ADDRESS\n');
      console.log('💡 Find these in ECOSYSTEM_DEPLOYMENT_SUCCESS.md or src/lib/contracts/addresses.ts\n');
      process.exit(1);
    }
    
    const KASTip = await hre.ethers.getContractFactory('KASTip');
    const kasTip = await KASTip.deploy(
      proofOfUtilityAddress,
      affiliateManagerAddress,
      feeHandlerAddress,
      dAppRegistryAddress
    );
    await kasTip.waitForDeployment();
    const dAppContractAddress = await kasTip.getAddress();
    console.log('   ✅ KASTip deployed to:', dAppContractAddress);

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
    
    // Get the dApp ID
    const dAppId = await dAppRegistry.getDAppCount();
    console.log('   📝 dApp ID:', dAppId.toString());

    // Step 3.5: Set dApp ID in KASTip contract
    console.log('\n3️⃣.5 Setting dApp ID in KASTip...');
    const setDAppIdTx = await kasTip.setDAppId(dAppId);
    await setDAppIdTx.wait();
    console.log('   ✅ dApp ID set in KASTip contract');

    // Step 4: Link token to dApp in DAppRegistry
    console.log('\n4️⃣  Linking token to dApp...');
    const linkTokenTx = await dAppRegistry.linkDAppToToken(
      dAppId, // dApp IDs are 1-indexed
      tokenAddress,
      tokenSymbol,
      maxSupplyWei
    );
    await linkTokenTx.wait();
    console.log('   ✅ Token linked to dApp');

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

