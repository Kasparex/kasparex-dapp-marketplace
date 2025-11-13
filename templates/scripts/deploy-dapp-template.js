/**
 * Deployment Script Template for {{CONTRACT_NAME}}
 * 
 * This script deploys your dApp contract and registers it in the DAppRegistry.
 * 
 * Usage:
 *   # Deploy to Kasplex L2 Testnet (default)
 *   npx hardhat run scripts/deploy-dapp-template.js --network kasplexL2Testnet
 *   
 *   # Deploy to Igra Caravel Testnet
 *   npx hardhat run scripts/deploy-dapp-template.js --network igraCaravelTestnet
 * 
 * Prerequisites:
 *   1. Set up .env file with required environment variables
 *   2. Ensure you have test KAS in your wallet
 *   3. Deploy ecosystem contracts first (if using)
 * 
 * Default Configuration:
 *   - Fee Percentage: 1% (100 basis points)
 *   - Networks: Kasplex L2 Testnet (167012) and Igra Caravel Testnet (19416)
 */

const hre = require('hardhat');
const path = require('path');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Deploying contracts with account:', deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(balance), 'KAS');
  console.log('');

  // Get ecosystem contract addresses from environment variables
  // Default addresses for Kasplex L2 Testnet (update for other networks)
  const network = hre.network.name;
  const isIgra = network === 'igraCaravelTestnet';
  
  // Default addresses (Kasplex L2 Testnet)
  const defaultFeeCollector = '0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2';
  const defaultDAppRegistry = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const defaultProofOfUtility = '0x1aB97D324Ea68FF7c51A91689564377e433A77f6';
  
  // Igra Caravel Testnet addresses (update when available)
  const igraFeeCollector = process.env.FEE_COLLECTOR_ADDRESS_IGRA || '';
  const igraDAppRegistry = process.env.DAPP_REGISTRY_ADDRESS_IGRA || '';
  const igraProofOfUtility = process.env.PROOF_OF_UTILITY_ADDRESS_IGRA || '';
  
  // Required addresses (always needed)
  const dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || (isIgra ? igraDAppRegistry : defaultDAppRegistry);
  
  // Default integration addresses (connected by default)
  const feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS || (isIgra ? igraFeeCollector : defaultFeeCollector);
  const proofOfUtilityAddress = process.env.PROOF_OF_UTILITY_ADDRESS || (isIgra ? igraProofOfUtility : defaultProofOfUtility);
  
  // Optional addresses (only if selected/enabled)
  const feeHandlerAddress = process.env.FEE_HANDLER_ADDRESS || '';
  const affiliateManagerAddress = process.env.AFFILIATE_MANAGER_ADDRESS || '';
  const loyaltyPointsAddress = process.env.LOYALTY_POINTS_ADDRESS || '';
  const profileRegistryAddress = process.env.PROFILE_REGISTRY_ADDRESS || '';
  const authorizationRegistryAddress = process.env.AUTHORIZATION_REGISTRY_ADDRESS || '';
  const subscriptionManagerAddress = process.env.SUBSCRIPTION_MANAGER_ADDRESS || '';
  
  // Default fee percentage: 1% (100 basis points)
  const defaultFeePercentage = process.env.FEE_PERCENTAGE ? parseInt(process.env.FEE_PERCENTAGE) : 100;
  
  // Validate required addresses
  if (!dAppRegistryAddress) {
    console.error('\n❌ ERROR: Missing required contract address\n');
    console.log('Required environment variable:');
    console.log('   DAPP_REGISTRY_ADDRESS\n');
    console.log('💡 Find this in ECOSYSTEM_DEPLOYMENT_SUCCESS.md or src/lib/contracts/addresses.ts\n');
    process.exit(1);
  }
  
  console.log(`\n📋 Network: ${network}`);
  console.log(`   Chain ID: ${isIgra ? '19416' : '167012'}`);
  console.log(`\n🔗 Ecosystem Contracts:`);
  console.log(`   DApp Registry: ${dAppRegistryAddress} (Required)`);
  console.log(`   Fee Collector: ${feeCollectorAddress} (Default)`);
  console.log(`   Proof of Utility: ${proofOfUtilityAddress} (Default)`);
  if (feeHandlerAddress) console.log(`   Fee Handler: ${feeHandlerAddress} (Selected)`);
  if (affiliateManagerAddress) console.log(`   Affiliate Manager: ${affiliateManagerAddress} (Selected)`);
  if (loyaltyPointsAddress) console.log(`   Loyalty Points: ${loyaltyPointsAddress} (Selected)`);
  if (profileRegistryAddress) console.log(`   Profile Registry: ${profileRegistryAddress} (Selected)`);
  console.log(`\n⚙️  Configuration:`);
  console.log(`   Fee Percentage: ${defaultFeePercentage} basis points (${defaultFeePercentage / 100}%)\n`);

  try {
    // Step 1: Deploy your dApp contract
    console.log('1️⃣  Deploying {{CONTRACT_NAME}} Contract...');
    
    // Get contract factory and deploy with default fee percentage
    const {{CONTRACT_NAME}} = await hre.ethers.getContractFactory('{{CONTRACT_NAME}}');
    const {{contractName}} = await {{CONTRACT_NAME}}.deploy(
      feeCollectorAddress,
      defaultFeePercentage, // Default: 1% (100 basis points)
      // TODO: Add your additional constructor parameters
      // otherParams
    );
    await {{contractName}}.waitForDeployment();
    const dAppContractAddress = await {{contractName}}.getAddress();
    console.log('   ✅ {{CONTRACT_NAME}} deployed to:', dAppContractAddress);
    console.log(`   📝 Fee Percentage: ${defaultFeePercentage} basis points (${defaultFeePercentage / 100}%)`);

    // Step 2: Register dApp in DAppRegistry
    console.log('\n2️⃣  Registering dApp in DAppRegistry...');
    
    // TODO: Register your dApp
    // Example:
    // const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
    // const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);
    // 
    // const registerTx = await dAppRegistry.registerDApp(
    //   '{{DAPP_NAME}}',        // Name
    //   '{{VERSION}}',          // Version (e.g., '1.0.0')
    //   '{{CATEGORY}}',         // Category (e.g., 'payment', 'governance', 'social')
    //   dAppContractAddress     // Contract address
    // );
    // await registerTx.wait();
    // 
    // // Get the dApp ID from the event
    // const receipt = await registerTx.wait();
    // const event = receipt.logs.find(log => {
    //   try {
    //     const parsed = dAppRegistry.interface.parseLog(log);
    //     return parsed && parsed.name === 'DAppRegistered';
    //   } catch {
    //     return false;
    //   }
    // });
    // 
    // let dAppId = 0;
    // if (event) {
    //   const parsed = dAppRegistry.interface.parseLog(event);
    //   dAppId = parsed.args.dAppId;
    // }
    // 
    // console.log('   ✅ dApp registered with ID:', dAppId.toString());

    // Step 3: (Optional) Deploy and link token
    // TODO: Uncomment if you want to deploy a token
    // console.log('\n3️⃣  Deploying DAppToken (Optional)...');
    // 
    // const tokenName = '{{TOKEN_NAME}}';
    // const tokenSymbol = '{{TOKEN_SYMBOL}}';
    // const maxSupply = hre.ethers.parseEther('{{MAX_SUPPLY}}'); // e.g., '1000000'
    // 
    // // Get reward vault address
    // const rewardVaultAddress = process.env.REWARD_VAULT_ADDRESS || '';
    // if (!rewardVaultAddress) {
    //   console.log('   ⚠️  Skipping token deployment - REWARD_VAULT_ADDRESS not set');
    // } else {
    //   const DAppToken = await hre.ethers.getContractFactory('DAppToken');
    //   const dAppToken = await DAppToken.deploy(
    //     tokenName,
    //     tokenSymbol,
    //     maxSupply,
    //     rewardVaultAddress,
    //     // TODO: Add allocation percentages
    //     // liquidityReserve: 40%,
    //     // treasury: 30%,
    //     // dev: 20%,
    //     // airdrop: 10%
    //   );
    //   await dAppToken.waitForDeployment();
    //   const tokenAddress = await dAppToken.getAddress();
    //   console.log('   ✅ DAppToken deployed to:', tokenAddress);
    //   
    //   // Link token to dApp
    //   console.log('\n4️⃣  Linking token to dApp...');
    //   const linkTx = await dAppRegistry.linkDAppToToken(
    //     dAppId,
    //     tokenAddress,
    //     tokenSymbol,
    //     maxSupply
    //   );
    //   await linkTx.wait();
    //   console.log('   ✅ Token linked to dApp');
    // }

    // Step 4: (Optional) Set dApp ID in contract (if using ecosystem integration)
    // TODO: Uncomment if your contract needs dApp ID
    // if (dAppId > 0) {
    //   console.log('\n5️⃣  Setting dApp ID in contract...');
    //   const setDAppIdTx = await {{contractName}}.setDAppId(dAppId);
    //   await setDAppIdTx.wait();
    //   console.log('   ✅ dApp ID set in contract');
    // }

    // Summary
    console.log('\n✅ Deployment Summary:');
    console.log('   Network:', hre.network.name);
    console.log('   Deployer:', deployer.address);
    // console.log('   dApp Contract:', dAppContractAddress);
    // console.log('   dApp ID:', dAppId.toString());
    // console.log('   Token Address:', tokenAddress || 'Not deployed');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('   1. Update contract address in src/lib/contracts/addresses.ts');
    console.log('   2. Add contract ABI to src/lib/contracts/abis.ts');
    console.log('   3. Create custom hook in src/hooks/');
    console.log('   4. Create widget component in src/components/dapps/');
    console.log('   5. Add dApp entry to src/lib/dapps.ts');
    console.log('   6. Add widget rendering to src/components/DAppWidget.tsx');
    console.log('   7. Test the dApp thoroughly');
    console.log('');

  } catch (error) {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

