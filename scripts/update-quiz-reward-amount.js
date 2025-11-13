/**
 * Update QuizToEarn defaultRewardAmount to distribute 1000 GRID tokens per correct answer
 * 
 * Calculation:
 * - Target: 1000 GRID tokens per correct answer
 * - Current reward rate: 100 basis points (1%)
 * - Required actionValue: 1000 GRID × 10000 / 100 = 100,000 KAS
 * 
 * Usage:
 *   npx hardhat run scripts/update-quiz-reward-amount.js --network kasplexL2Testnet
 * 
 * Environment Variables:
 *   QUIZ_TO_EARN_ADDRESS - QuizToEarn contract address (default: deployed address)
 *   REWARD_AMOUNT - Reward amount in KAS (default: 100000 = 100,000 KAS)
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\n💰 Updating QuizToEarn defaultRewardAmount...\n');
  console.log('Using account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  const isIgra = network === 'igraCaravelTestnet';
  
  // Default addresses (Kasplex L2 Testnet)
  const defaultQuizToEarn = '0x7EF3E5215c722D7A3D41C2426e57b1B4A5bC4a05';
  
  // Igra Caravel Testnet addresses (update when available)
  const igraQuizToEarn = process.env.QUIZ_TO_EARN_ADDRESS_IGRA || '';
  
  const quizToEarnAddress = process.env.QUIZ_TO_EARN_ADDRESS || (isIgra ? igraQuizToEarn : defaultQuizToEarn);
  
  // Reward amount: 100,000 KAS to get 1000 GRID tokens at 1% rate
  // Calculation: 1000 GRID = (actionValue × 100) / 10000 → actionValue = 100,000 KAS
  const rewardAmountKAS = process.env.REWARD_AMOUNT ? parseFloat(process.env.REWARD_AMOUNT) : 100000;
  const rewardAmountWei = hre.ethers.parseEther(rewardAmountKAS.toString());
  
  // Validate address
  if (!quizToEarnAddress) {
    console.error('\n❌ ERROR: Missing QuizToEarn contract address\n');
    console.log('Set QUIZ_TO_EARN_ADDRESS environment variable or update default address in script\n');
    process.exit(1);
  }
  
  console.log(`📋 Network: ${network}`);
  console.log(`   Chain ID: ${isIgra ? '19416' : '167012'}`);
  console.log(`   QuizToEarn: ${quizToEarnAddress}`);
  console.log(`   New Reward Amount: ${rewardAmountKAS.toLocaleString()} KAS`);
  console.log(`   Expected GRID Reward: 1000 GRID tokens (at 1% rate)\n`);

  try {
    const QuizToEarn = await hre.ethers.getContractFactory('QuizToEarn');
    const quizToEarn = QuizToEarn.attach(quizToEarnAddress);

    // Check current defaultRewardAmount
    console.log('🔍 Checking current configuration...');
    const currentRewardAmount = await quizToEarn.defaultRewardAmount();
    console.log('   Current Default Reward:', hre.ethers.formatEther(currentRewardAmount), 'KAS');
    console.log('');

    // Update defaultRewardAmount
    if (currentRewardAmount.toString() !== rewardAmountWei.toString()) {
      console.log('1️⃣  Updating defaultRewardAmount...');
      const setRewardTx = await quizToEarn.setDefaultRewardAmount(rewardAmountWei);
      console.log('   Transaction hash:', setRewardTx.hash);
      await setRewardTx.wait();
      console.log('   ✅ Default reward amount updated to', rewardAmountKAS.toLocaleString(), 'KAS');
    } else {
      console.log('1️⃣  Default reward amount already set correctly');
    }

    // Verify update
    console.log('\n2️⃣  Verifying update...');
    const newRewardAmount = await quizToEarn.defaultRewardAmount();
    console.log('   New Default Reward:', hre.ethers.formatEther(newRewardAmount), 'KAS');
    
    if (newRewardAmount.toString() === rewardAmountWei.toString()) {
      console.log('   ✅ Update verified successfully!');
    } else {
      console.log('   ⚠️  Warning: Reward amount mismatch');
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ UPDATE COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📦 QuizToEarn Reward Configuration:');
    console.log('   Contract:', quizToEarnAddress);
    console.log('   Default Reward Amount:', rewardAmountKAS.toLocaleString(), 'KAS');
    console.log('   Expected GRID Reward: 1000 GRID tokens per correct answer');
    console.log('\n💡 Note:');
    console.log('   - Reward rate: 1% (100 basis points)');
    console.log('   - Reward type: GRID Token');
    console.log('   - Calculation: 100,000 KAS × 1% = 1000 GRID tokens');
    console.log('   - Ensure RewardManager has sufficient GRID tokens');
    console.log('');

  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    if (error.message.includes('onlyOwner')) {
      console.error('   ⚠️  Make sure you are using the QuizToEarn owner account');
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

