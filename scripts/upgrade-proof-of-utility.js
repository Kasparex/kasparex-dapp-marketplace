/**
 * Upgrade ProofOfUtility Contract
 * 
 * Since Solidity contracts are immutable, we deploy a new version and update references.
 * 
 * This script:
 * 1. Deploys new ProofOfUtility contract with recordUsageAndReward() function
 * 2. Updates RewardManager to point to new ProofOfUtility
 * 3. Updates QuizToEarn to point to new ProofOfUtility
 * 4. Provides instructions for updating addresses.ts
 * 
 * Usage:
 *   npx hardhat run scripts/upgrade-proof-of-utility.js --network kasplexL2Testnet
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\nđź”„ Upgrading ProofOfUtility Contract...\n');
  console.log('Using account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  const isIgra = network === 'igraMainnet';
  
  // Current deployed addresses
  const currentProofOfUtilityAddress = isIgra 
    ? process.env.PROOF_OF_UTILITY_ADDRESS_IGRA || ''
    : '0x1aB97D324Ea68FF7c51A91689564377e433A77f6';
  
  const rewardManagerAddress = isIgra
    ? process.env.REWARD_MANAGER_ADDRESS_IGRA || ''
    : '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';
  
  const quizToEarnAddress = isIgra
    ? process.env.QUIZ_TO_EARN_ADDRESS_IGRA || ''
    : '0x7EF3E5215c722D7A3D41C2426e57b1B4A5bC4a05';

  if (!currentProofOfUtilityAddress || !rewardManagerAddress) {
    console.error('\nâťŚ ERROR: Missing required contract addresses\n');
    process.exit(1);
  }

  console.log(`đź“‹ Network: ${network}`);
  console.log(`   Current ProofOfUtility: ${currentProofOfUtilityAddress}`);
  console.log(`   RewardManager: ${rewardManagerAddress}`);
  console.log(`   QuizToEarn: ${quizToEarnAddress}\n`);

  try {
    // Step 1: Deploy new ProofOfUtility
    console.log('1ď¸ŹâŁ  Deploying new ProofOfUtility contract...');
    const ProofOfUtility = await hre.ethers.getContractFactory('ProofOfUtility');
    const newProofOfUtility = await ProofOfUtility.deploy(rewardManagerAddress);
    await newProofOfUtility.waitForDeployment();
    const newProofOfUtilityAddress = await newProofOfUtility.getAddress();
    console.log('   âś… New ProofOfUtility deployed to:', newProofOfUtilityAddress);

    // Verify the new function exists
    const hasFunction = newProofOfUtility.interface.hasFunction('recordUsageAndReward');
    console.log('   âś… recordUsageAndReward() function exists:', hasFunction);

    // Step 2: Update RewardManager to point to new ProofOfUtility
    console.log('\n2ď¸ŹâŁ  Updating RewardManager...');
    const RewardManager = await hre.ethers.getContractFactory('RewardManager');
    const rewardManager = RewardManager.attach(rewardManagerAddress);
    
    // Check if deployer is owner
    const rewardManagerOwner = await rewardManager.owner();
    if (rewardManagerOwner.toLowerCase() === deployer.address.toLowerCase()) {
      const updateTx = await rewardManager.setProofOfUtility(newProofOfUtilityAddress);
      await updateTx.wait();
      console.log('   âś… RewardManager updated to use new ProofOfUtility');
    } else {
      console.log('   âš ď¸Ź  Deployer is not RewardManager owner');
      console.log('   âš ď¸Ź  RewardManager owner:', rewardManagerOwner);
      console.log('   âš ď¸Ź  Manual update required:');
      console.log(`      rewardManager.setProofOfUtility("${newProofOfUtilityAddress}")`);
    }

    // Step 3: Update QuizToEarn to point to new ProofOfUtility
    if (quizToEarnAddress) {
      console.log('\n3ď¸ŹâŁ  Updating QuizToEarn...');
      const QuizToEarn = await hre.ethers.getContractFactory('QuizToEarn');
      const quizToEarn = QuizToEarn.attach(quizToEarnAddress);
      
      // Check if deployer is owner
      const quizToEarnOwner = await quizToEarn.owner();
      if (quizToEarnOwner.toLowerCase() === deployer.address.toLowerCase()) {
        const updateTx = await quizToEarn.setProofOfUtility(newProofOfUtilityAddress);
        await updateTx.wait();
        console.log('   âś… QuizToEarn updated to use new ProofOfUtility');
      } else {
        console.log('   âš ď¸Ź  Deployer is not QuizToEarn owner');
        console.log('   âš ď¸Ź  QuizToEarn owner:', quizToEarnOwner);
        console.log('   âš ď¸Ź  Manual update required:');
        console.log(`      quizToEarn.setProofOfUtility("${newProofOfUtilityAddress}")`);
      }
    }

    // Step 4: Check other dApps that might use ProofOfUtility
    console.log('\n4ď¸ŹâŁ  Checking other dApps...');
    console.log('   đź’ˇ Other dApps using ProofOfUtility may need manual updates');
    console.log('   đź’ˇ Check DAOVoting and other dApps if they use ProofOfUtility');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('âś… UPGRADE COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nđź“¦ New Contract Address:');
    console.log('   ProofOfUtility:', newProofOfUtilityAddress);
    console.log('\nđź“‹ Next Steps:');
    console.log('   1. Update src/lib/contracts/addresses.ts:');
    console.log(`      ProofOfUtility: "${newProofOfUtilityAddress}"`);
    console.log('   2. Update environment variables if used');
    console.log('   3. Test Quiz-to-Earn dApp');
    console.log('   4. Verify rewards are distributed correctly');
    console.log('   5. Update other dApps if they use ProofOfUtility');
    console.log('');

  } catch (error) {
    console.error('\nâťŚ Upgrade failed:', error.message);
    if (error.message.includes('nonce')) {
      console.error('   âš ď¸Ź  Nonce error - try again in a moment');
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

