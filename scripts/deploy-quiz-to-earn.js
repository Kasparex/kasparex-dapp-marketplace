/**
 * Deployment Script for QuizToEarn
 * 
 * This script deploys the QuizToEarn contract and registers it in the DAppRegistry.
 * 
 * Usage:
 *   # Deploy to Kasplex L2 Testnet (default)
 *   npx hardhat run scripts/deploy-quiz-to-earn.js --network kasplexL2Testnet
 *   
 *   # Deploy to Igra Galleon Testnet
 *   npx hardhat run scripts/deploy-quiz-to-earn.js --network igraGalleonTestnet
 * 
 * Prerequisites:
 *   1. Set up .env file with required environment variables
 *   2. Ensure you have test KAS in your wallet
 *   3. Deploy ecosystem contracts first (FeeCollector, ProofOfUtility, DAppRegistry)
 * 
 * Default Configuration:
 *   - Fee Percentage: 1% (100 basis points)
 *   - Default Reward: 0.01 KAS (10000000000000000 wei) per correct answer
 *   - Networks: Kasplex L2 Testnet (167012), Igra Galleon Testnet (38836), Igra Mainnet (38833)
 */

const hre = require('hardhat');
const path = require('path');
const fs = require('fs');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\nđźš€ Deploying QuizToEarn Contract...\n');
  console.log('Deploying with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  const isIgraChain = network === 'igraMainnet' || network === 'igraGalleonTestnet';
  const net = await hre.ethers.provider.getNetwork();

  // Default addresses (Kasplex L2 Testnet)
  const defaultFeeCollector = '0x002C7eeC68975d41f3f0F7bC8D900Aa45A131aE2';
  const defaultDAppRegistry = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const defaultProofOfUtility = '0x1aB97D324Ea68FF7c51A91689564377e433A77f6';

  // Igra (Galleon testnet / mainnet)  -  override with env when deploying
  const igraFeeCollector = process.env.FEE_COLLECTOR_ADDRESS_IGRA || '';
  const igraDAppRegistry = process.env.DAPP_REGISTRY_ADDRESS_IGRA || '';
  const igraProofOfUtility = process.env.PROOF_OF_UTILITY_ADDRESS_IGRA || '';

  const feeCollectorAddress = process.env.FEE_COLLECTOR_ADDRESS || (isIgraChain ? igraFeeCollector : defaultFeeCollector);
  const dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || (isIgraChain ? igraDAppRegistry : defaultDAppRegistry);
  const proofOfUtilityAddress = process.env.PROOF_OF_UTILITY_ADDRESS || (isIgraChain ? igraProofOfUtility : defaultProofOfUtility);
  
  // Default fee percentage: 1% (100 basis points)
  const defaultFeePercentage = process.env.FEE_PERCENTAGE ? parseInt(process.env.FEE_PERCENTAGE) : 100;
  
  // Default reward amount: 0.01 KAS (10000000000000000 wei) per correct answer
  const defaultRewardAmount = process.env.DEFAULT_REWARD_AMOUNT 
    ? hre.ethers.parseEther(process.env.DEFAULT_REWARD_AMOUNT)
    : hre.ethers.parseEther('0.01');
  
  // Validate required addresses
  if (!feeCollectorAddress || !dAppRegistryAddress || !proofOfUtilityAddress) {
    console.error('\nâťŚ ERROR: Missing required contract addresses\n');
    console.log('Required environment variables:');
    console.log('   FEE_COLLECTOR_ADDRESS');
    console.log('   DAPP_REGISTRY_ADDRESS');
    console.log('   PROOF_OF_UTILITY_ADDRESS\n');
    console.log('đź’ˇ Find these in ECOSYSTEM_DEPLOYMENT_SUCCESS.md or src/lib/contracts/addresses.ts\n');
    process.exit(1);
  }
  
  console.log(`đź“‹ Network: ${network}`);
  console.log(`   Chain ID: ${net.chainId}`);
  console.log(`   Fee Collector: ${feeCollectorAddress}`);
  console.log(`   DApp Registry: ${dAppRegistryAddress}`);
  console.log(`   Proof of Utility: ${proofOfUtilityAddress}`);
  console.log(`   Fee Percentage: ${defaultFeePercentage} basis points (${defaultFeePercentage / 100}%)`);
  console.log(`   Default Reward: ${hre.ethers.formatEther(defaultRewardAmount)} KAS per correct answer\n`);

  try {
    // Step 1: Deploy QuizToEarn contract
    console.log('1ď¸ŹâŁ  Deploying QuizToEarn Contract...');
    
    const QuizToEarn = await hre.ethers.getContractFactory('QuizToEarn');
    const quizToEarn = await QuizToEarn.deploy(
      feeCollectorAddress,
      proofOfUtilityAddress,
      defaultFeePercentage,
      defaultRewardAmount
    );
    await quizToEarn.waitForDeployment();
    const quizToEarnAddress = await quizToEarn.getAddress();
    console.log('   âś… QuizToEarn deployed to:', quizToEarnAddress);
    console.log(`   đź“ť Fee Percentage: ${defaultFeePercentage} basis points (${defaultFeePercentage / 100}%)`);
    console.log(`   đź“ť Default Reward: ${hre.ethers.formatEther(defaultRewardAmount)} KAS`);

    // Step 2: Register dApp in DAppRegistry
    console.log('\n2ď¸ŹâŁ  Registering dApp in DAppRegistry...');
    
    const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
    const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);
    
    const dAppName = 'Quiz-to-Earn';
    const dAppVersion = '1.0.0';
    const dAppCategory = 'social';
    
    const registerTx = await dAppRegistry.registerDApp(
      dAppName,
      dAppVersion,
      dAppCategory,
      quizToEarnAddress
    );
    await registerTx.wait();
    console.log('   âś… dApp registered in DAppRegistry');
    
    // Get the dApp ID
    const dAppId = await dAppRegistry.dAppCount();
    console.log('   đź“ť dApp ID:', dAppId.toString());

    // Step 3: Set dApp ID in QuizToEarn contract
    console.log(`\n3ď¸ŹâŁ  Setting dApp ID in QuizToEarn contract...`);
    const setDAppIdTx = await quizToEarn.setDAppId(dAppId);
    await setDAppIdTx.wait();
    console.log(`   âś… dApp ID set in QuizToEarn contract`);

    // Step 4: Save deployment info
    const deploymentInfo = {
      network,
      deployedAt: new Date().toISOString(),
      deployer: deployer.address,
      dApp: {
        id: dAppId.toString(),
        name: dAppName,
        version: dAppVersion,
        category: dAppCategory,
        contractAddress: quizToEarnAddress,
      },
      contracts: {
        quizToEarn: quizToEarnAddress,
        feeCollector: feeCollectorAddress,
        proofOfUtility: proofOfUtilityAddress,
        dAppRegistry: dAppRegistryAddress,
      },
      configuration: {
        feePercentage: defaultFeePercentage,
        defaultRewardAmount: hre.ethers.formatEther(defaultRewardAmount),
      },
    };

    // Save to deployments directory
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `quiz-to-earn-${network}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log('\nđź’ľ Deployment info saved to:', deploymentFile);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('âś… DEPLOYMENT SUCCESSFUL!');
    console.log('='.repeat(60));
    console.log('\nđź“¦ QuizToEarn Details:');
    console.log('   Name:', dAppName);
    console.log('   ID:', dAppId.toString());
    console.log('   Contract:', quizToEarnAddress);
    console.log('   Fee Percentage:', defaultFeePercentage, 'basis points (' + (defaultFeePercentage / 100) + '%)');
    console.log('   Default Reward:', hre.ethers.formatEther(defaultRewardAmount), 'KAS per correct answer');
    console.log('\n- View on Explorer:');
    console.log(`   Contract: https://explorer.kasplex.org/address/${quizToEarnAddress}`);
    console.log('\nđź“‹ Next Steps:');
    console.log('   1. Update src/lib/contracts/addresses.ts with the contract address');
    console.log('   2. Add questions to the contract using addQuestion() function');
    console.log('   3. Test the dApp on the frontend');
    console.log('   4. Configure RewardManager to distribute rewards for correct answers');
    console.log('');

  } catch (error) {
    console.error('\nâťŚ Deployment failed:', error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

