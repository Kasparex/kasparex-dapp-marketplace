/**
 * Update QuizToEarn defaultRewardAmount for sustainable GRID token rewards
 * 
 * Recommended Configuration (Option 1 - Moderate):
 * - Target: 0.01 GRID tokens per correct answer
 * - Reward rate: 100 basis points (1%)
 * - Required actionValue: 0.01 GRID Ă— 10000 / 100 = 1 KAS
 * 
 * Alternative Options:
 * - Option 2 (Balanced): REWARD_AMOUNT=10 â†’ 0.1 GRID tokens
 * - Option 3 (Generous): REWARD_AMOUNT=100 â†’ 1 GRID token
 * 
 * See docs/QUIZ_REWARD_RECOMMENDATIONS.md for detailed analysis
 * 
 * Usage:
 *   # Recommended (0.01 GRID per answer)
 *   npx hardhat run scripts/update-quiz-reward-amount.js --network kasplexL2Testnet
 * 
 *   # Alternative (0.1 GRID per answer)
 *   REWARD_AMOUNT=10 npx hardhat run scripts/update-quiz-reward-amount.js --network kasplexL2Testnet
 * 
 * Environment Variables:
 *   QUIZ_TO_EARN_ADDRESS - QuizToEarn contract address (default: deployed address)
 *   REWARD_AMOUNT - Reward amount in KAS (default: 1 = 1 KAS â†’ 0.01 GRID)
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\nđź’° Updating QuizToEarn defaultRewardAmount...\n');
  console.log('Using account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  const isIgra = network === 'igraMainnet';
  
  // Default addresses (Kasplex L2 Testnet)
  const defaultQuizToEarn = '0x7EF3E5215c722D7A3D41C2426e57b1B4A5bC4a05';
  
  // Igra Caravel Testnet addresses (update when available)
  const igraQuizToEarn = process.env.QUIZ_TO_EARN_ADDRESS_IGRA || '';
  
  const quizToEarnAddress = process.env.QUIZ_TO_EARN_ADDRESS || (isIgra ? igraQuizToEarn : defaultQuizToEarn);
  
  // Recommended: 1 KAS to get 0.01 GRID tokens at 1% rate
  // Calculation: 0.01 GRID = (actionValue Ă— 100) / 10000 â†’ actionValue = 1 KAS
  // Alternative: 10 KAS â†’ 0.1 GRID, 100 KAS â†’ 1 GRID
  const rewardAmountKAS = process.env.REWARD_AMOUNT ? parseFloat(process.env.REWARD_AMOUNT) : 1;
  const rewardAmountWei = hre.ethers.parseEther(rewardAmountKAS.toString());
  
  // Validate address
  if (!quizToEarnAddress) {
    console.error('\nâťŚ ERROR: Missing QuizToEarn contract address\n');
    console.log('Set QUIZ_TO_EARN_ADDRESS environment variable or update default address in script\n');
    process.exit(1);
  }
  
  const expectedGRID = (rewardAmountKAS * 100) / 10000;
  
  console.log(`đź“‹ Network: ${network}`);
  console.log(`   Chain ID: ${isIgra ? '38833' : '167012'}`);
  console.log(`   QuizToEarn: ${quizToEarnAddress}`);
  console.log(`   New Reward Amount: ${rewardAmountKAS.toLocaleString()} KAS`);
  console.log(`   Expected GRID Reward: ${expectedGRID} GRID tokens (at 1% rate)`);
  console.log(`   đź“Š This is ${expectedGRID >= 1 ? 'generous' : expectedGRID >= 0.1 ? 'balanced' : 'moderate'} reward level\n`);

  try {
    const QuizToEarn = await hre.ethers.getContractFactory('QuizToEarn');
    const quizToEarn = QuizToEarn.attach(quizToEarnAddress);

    // Check current defaultRewardAmount
    console.log('đź”Ť Checking current configuration...');
    const currentRewardAmount = await quizToEarn.defaultRewardAmount();
    console.log('   Current Default Reward:', hre.ethers.formatEther(currentRewardAmount), 'KAS');
    console.log('');

    // Update defaultRewardAmount
    if (currentRewardAmount.toString() !== rewardAmountWei.toString()) {
      console.log('1ď¸ŹâŁ  Updating defaultRewardAmount...');
      const setRewardTx = await quizToEarn.setDefaultRewardAmount(rewardAmountWei);
      console.log('   Transaction hash:', setRewardTx.hash);
      await setRewardTx.wait();
      console.log('   âś… Default reward amount updated to', rewardAmountKAS.toLocaleString(), 'KAS');
    } else {
      console.log('1ď¸ŹâŁ  Default reward amount already set correctly');
    }

    // Verify update
    console.log('\n2ď¸ŹâŁ  Verifying update...');
    const newRewardAmount = await quizToEarn.defaultRewardAmount();
    console.log('   New Default Reward:', hre.ethers.formatEther(newRewardAmount), 'KAS');
    
    if (newRewardAmount.toString() === rewardAmountWei.toString()) {
      console.log('   âś… Update verified successfully!');
    } else {
      console.log('   âš ď¸Ź  Warning: Reward amount mismatch');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('âś… UPDATE COMPLETE!');
    console.log('='.repeat(60));
    console.log('\nđź“¦ QuizToEarn Reward Configuration:');
    console.log('   Contract:', quizToEarnAddress);
    console.log('   Default Reward Amount:', rewardAmountKAS.toLocaleString(), 'KAS');
    console.log('   Expected GRID Reward:', expectedGRID, 'GRID tokens per correct answer');
    console.log('\nđź’ˇ Note:');
    console.log('   - Reward rate: 1% (100 basis points)');
    console.log('   - Reward type: GRID Token');
    console.log(`   - Calculation: ${rewardAmountKAS} KAS Ă— 1% = ${expectedGRID} GRID tokens`);
    console.log('   - Ensure RewardManager has sufficient GRID tokens');
    console.log('\nđź“š See docs/QUIZ_REWARD_RECOMMENDATIONS.md for reward options and sustainability analysis');
    console.log('');

  } catch (error) {
    console.error('\nâťŚ Update failed:', error.message);
    if (error.message.includes('onlyOwner')) {
      console.error('   âš ď¸Ź  Make sure you are using the QuizToEarn owner account');
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

