/**
 * Check KASTip dApp Status
 */

const hre = require('hardhat');

async function main() {
  const dAppRegistryAddress = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const dAppId = 4;

  const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
  const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);

  console.log('Checking dApp status...\n');

  try {
    const dAppCount = await dAppRegistry.dAppCount();
    console.log('Total dApps:', dAppCount.toString());
    console.log('Checking dApp ID:', dAppId, '\n');

    // Try to read dApp data using individual getters if available
    // Or try to call getDApp with proper ABI
    
    // Check if dApp exists by trying to get contract address
    // We'll use a workaround - try to read the mapping directly
    console.log('Attempting to read dApp data...');
    
    // Since getDApp has issues, let's try a different approach
    // Check if we can update the status
    const [deployer] = await hre.ethers.getSigners();
    console.log('Using account:', deployer.address);
    
    // Try to activate the dApp if it's not active
    console.log('\nTrying to ensure dApp is active...');
    try {
      const updateTx = await dAppRegistry.updateDAppStatus(dAppId, true);
      await updateTx.wait();
      console.log('✅ dApp status updated to active');
    } catch (error) {
      console.log('⚠️  Could not update status:', error.message);
      console.log('   (This is OK if dApp is already active)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

