/**
 * Update ProofOfUtility Contract
 * 
 * This script updates the deployed ProofOfUtility contract to add the new
 * recordUsageAndReward() function. Since Solidity doesn't support upgrading
 * existing contracts directly, we need to:
 * 
 * Option 1: If contract is upgradeable, use upgrade pattern
 * Option 2: Deploy new version and update references
 * Option 3: If contract owner, we can add the function via a proxy pattern
 * 
 * For now, we'll check if we can call setRewardManager to verify ownership,
 * then we'll need to deploy a new version and update all references.
 * 
 * Usage:
 *   npx hardhat run scripts/update-proof-of-utility.js --network kasplexL2Testnet
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\n🔄 Updating ProofOfUtility Contract...\n');
  console.log('Using account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  const isIgra = network === 'igraCaravelTestnet';
  
  // Current deployed addresses
  const currentProofOfUtilityAddress = isIgra 
    ? process.env.PROOF_OF_UTILITY_ADDRESS_IGRA || '0x1aB97D324Ea68FF7c51A91689564377e433A77f6'
    : '0x1aB97D324Ea68FF7c51A91689564377e433A77f6';
  
  const rewardManagerAddress = isIgra
    ? process.env.REWARD_MANAGER_ADDRESS_IGRA || '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6'
    : '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';

  console.log(`📋 Network: ${network}`);
  console.log(`   Current ProofOfUtility: ${currentProofOfUtilityAddress}`);
  console.log(`   RewardManager: ${rewardManagerAddress}\n`);

  try {
    // Check current contract
    const ProofOfUtility = await hre.ethers.getContractFactory('ProofOfUtility');
    const currentContract = ProofOfUtility.attach(currentProofOfUtilityAddress);
    
    console.log('1️⃣  Checking current contract...');
    
    // Check if deployer is owner
    try {
      const owner = await currentContract.owner();
      console.log(`   Current owner: ${owner}`);
      console.log(`   Deployer: ${deployer.address}`);
      
      if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
        console.log('\n⚠️  WARNING: Deployer is not the owner of the contract!');
        console.log('   You cannot update this contract directly.');
        console.log('   Options:');
        console.log('   1. Deploy a new ProofOfUtility contract');
        console.log('   2. Ask the owner to update the contract');
        console.log('   3. Use a proxy pattern if available\n');
        process.exit(1);
      }
    } catch (error) {
      console.log('   ⚠️  Could not verify ownership:', error.message);
    }

    // Since Solidity contracts are immutable, we need to deploy a new version
    console.log('\n2️⃣  Deploying new ProofOfUtility contract with recordUsageAndReward()...');
    
    const newProofOfUtility = await ProofOfUtility.deploy(rewardManagerAddress);
    await newProofOfUtility.waitForDeployment();
    const newProofOfUtilityAddress = await newProofOfUtility.getAddress();
    
    console.log('   ✅ New ProofOfUtility deployed to:', newProofOfUtilityAddress);
    
    // Verify the new function exists
    console.log('\n3️⃣  Verifying new function exists...');
    try {
      // Try to get the function signature
      const hasRecordUsageAndReward = newProofOfUtility.interface.hasFunction('recordUsageAndReward');
      console.log('   ✅ recordUsageAndReward() function exists:', hasRecordUsageAndReward);
    } catch (error) {
      console.log('   ⚠️  Could not verify function:', error.message);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ NEW PROOF OF UTILITY CONTRACT DEPLOYED!');
    console.log('='.repeat(60));
    console.log('\n📦 Contract Details:');
    console.log('   Old Address:', currentProofOfUtilityAddress);
    console.log('   New Address:', newProofOfUtilityAddress);
    console.log('   Network:', network);
    console.log('\n⚠️  IMPORTANT NEXT STEPS:');
    console.log('   1. Update RewardManager to point to new ProofOfUtility:');
    console.log('      (This may require RewardManager owner)');
    console.log('   2. Update all dApp contracts to use new ProofOfUtility address');
    console.log('   3. Update src/lib/contracts/addresses.ts with new address');
    console.log('   4. Update environment variables');
    console.log('   5. Test all integrations');
    console.log('\n💡 Note: Since contracts are immutable, updating requires:');
    console.log('   - Deploying new ProofOfUtility');
    console.log('   - Updating RewardManager reference');
    console.log('   - Updating all dApp contracts that use ProofOfUtility');
    console.log('   - Or using a proxy pattern for future upgrades');
    console.log('');

  } catch (error) {
    console.error('\n❌ Update failed:', error.message);
    if (error.message.includes('nonce')) {
      console.error('   ⚠️  Nonce error - try again in a moment');
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

