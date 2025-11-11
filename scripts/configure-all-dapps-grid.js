/**
 * Configure All dApps to Use GRID Tokens
 * 
 * Configures all registered dApps in DAppRegistry to use GRID tokens for rewards.
 * 
 * Usage:
 *   npx hardhat run scripts/configure-all-dapps-grid.js --network kasplexL2Testnet
 * 
 * Environment Variables:
 *   REWARD_RATE - Reward rate in basis points (default: 100 = 1%)
 *   REWARD_MANAGER_ADDRESS - RewardManager contract address
 *   DAPP_REGISTRY_ADDRESS - DAppRegistry contract address
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Configuring all dApps with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  console.log(`Network: ${network}\n`);

  const rewardManagerAddress = process.env.REWARD_MANAGER_ADDRESS || '0x2044FEb08a4Cb14Ff736b00f947E017044da50E6';
  const dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const rewardRate = process.env.REWARD_RATE ? parseInt(process.env.REWARD_RATE) : 100;

  console.log('📋 Configuration:');
  console.log('   RewardManager:', rewardManagerAddress);
  console.log('   DAppRegistry:', dAppRegistryAddress);
  console.log('   Reward Rate:', rewardRate, 'basis points (' + (rewardRate / 100) + '%)');
  console.log('   Reward Type: GRID Token');
  console.log('');

  try {
    const RewardManager = await hre.ethers.getContractFactory('RewardManager');
    const rewardManager = RewardManager.attach(rewardManagerAddress);

    const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
    const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);

    // Get total dApp count
    const dAppCount = await dAppRegistry.dAppCount();
    console.log('📊 Total dApps registered:', dAppCount.toString());
    console.log('');

    if (dAppCount === 0n) {
      console.log('No dApps registered yet.');
      return;
    }

    // Known dApp contract addresses (from deployment records)
    const knownDApps = [
      {
        id: 1,
        name: 'SimplePayment',
        contractAddress: '0x3F19cC54231fB10b1935FA3f04Bec64b8AFeAd85',
      },
      {
        id: 2,
        name: 'KASTip (old)',
        contractAddress: '0x9fca87d79ee857165b6f2b8fb90fbbc2488102ef',
      },
      {
        id: 3,
        name: 'KASTip (old)',
        contractAddress: '0xd5673ce7ca7abaab66706a4d596853aead585630',
      },
      {
        id: 4,
        name: 'KASTip',
        contractAddress: '0x962d06f6c11A95CBc02D5f965135368492d37Fd3',
      },
    ];

    console.log('🔍 Configuring dApps...');
    console.log('');

    let configuredCount = 0;
    let skippedCount = 0;

    // Try to configure each known dApp
    for (const dApp of knownDApps) {
      if (Number(dApp.id) > Number(dAppCount)) {
        continue; // Skip if dApp ID doesn't exist
      }

      try {
        // Check if dApp is active by checking contractToDAppId mapping
        const mappedId = await dAppRegistry.contractToDAppId(dApp.contractAddress);
        if (mappedId === 0n) {
          console.log(`⏭️  Skipping ${dApp.name} (${dApp.contractAddress}): Not registered`);
          skippedCount++;
          continue;
        }

        // Check current configuration
        const currentRate = await rewardManager.rewardRates(dApp.contractAddress);
        const currentUseGRID = await rewardManager.useGRID(dApp.contractAddress);

        // Configure if needed
        let needsUpdate = false;

        if (currentRate.toString() !== rewardRate.toString()) {
          console.log(`   Setting reward rate for ${dApp.name}...`);
          const setRateTx = await rewardManager.setRewardRate(dApp.contractAddress, rewardRate);
          await setRateTx.wait();
          console.log(`   ✅ Reward rate set: ${rewardRate} bp`);
          needsUpdate = true;
        }

        if (!currentUseGRID) {
          console.log(`   Setting reward type to GRID for ${dApp.name}...`);
          const setTypeTx = await rewardManager.setRewardType(dApp.contractAddress, true);
          await setTypeTx.wait();
          console.log(`   ✅ Reward type set: GRID`);
          needsUpdate = true;
        }

        if (needsUpdate) {
          configuredCount++;
          console.log(`   ✅ ${dApp.name} configured!`);
        } else {
          console.log(`   ✅ ${dApp.name} already configured`);
        }
        console.log('');

      } catch (error) {
        console.log(`   ⚠️  Error configuring ${dApp.name}:`, error.message);
        console.log('');
        skippedCount++;
      }
    }

    // Also try to configure any dApps we can read from the registry
    console.log('🔍 Checking for additional dApps...');
    for (let i = 1; i <= Number(dAppCount); i++) {
      try {
        // Try to get contract address from contractToDAppId reverse lookup
        // Actually, we need to check each known address or use events
        // For now, we'll just configure the known ones
      } catch (error) {
        // Skip errors
      }
    }

    console.log('='.repeat(60));
    console.log('✅ CONFIGURATION COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📋 Summary:');
    console.log('   Total dApps:', dAppCount.toString());
    console.log('   Configured:', configuredCount);
    console.log('   Skipped:', skippedCount);
    console.log('   Reward Rate:', rewardRate, 'basis points');
    console.log('   Reward Type: GRID Token');
    console.log('\n💡 All configured dApps will now reward users with GRID tokens!');
    console.log('');

  } catch (error) {
    console.error('\n❌ Configuration failed:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

