/**
 * List All Registered dApps
 * 
 * Lists all dApps registered in the DAppRegistry with their details.
 * 
 * Usage:
 *   npx hardhat run scripts/list-dapps.js --network kasplexL2Testnet
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Listing dApps with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const network = hre.network.name;
  console.log(`Network: ${network}\n`);

  const dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';

  console.log('📋 DAppRegistry:', dAppRegistryAddress);
  console.log('');

  try {
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

    // List all dApps
    console.log('='.repeat(80));
    console.log('Registered dApps:');
    console.log('='.repeat(80));
    console.log('');

    for (let i = 1; i <= Number(dAppCount); i++) {
      try {
        const dAppData = await dAppRegistry.getDApp(i);
        
        // Parse the tuple response
        // getDApp returns: (string name, string version, string category, address contractAddress,
        // address deployer, bool isActive, uint256 createdAt, address tokenAddress,
        // string ticker, uint256 totalSupply, string ipfsCID)
        const name = dAppData[0];
        const version = dAppData[1];
        const category = dAppData[2];
        const contractAddress = dAppData[3];
        const deployerAddress = dAppData[4];
        const isActive = dAppData[5];
        const createdAt = dAppData[6];
        const tokenAddress = dAppData[7] && dAppData[7] !== '0x0000000000000000000000000000000000000000'
          ? dAppData[7]
          : null;
        const ticker = dAppData[8] && String(dAppData[8]).trim() !== ''
          ? String(dAppData[8])
          : null;
        const totalSupply = dAppData[9] && dAppData[9] !== BigInt(0)
          ? dAppData[9]
          : null;
        const ipfsCID = dAppData[10] && String(dAppData[10]).trim() !== ''
          ? String(dAppData[10])
          : null;

        console.log(`📱 dApp #${i}: ${name}`);
        console.log('   Version:', version);
        console.log('   Category:', category);
        console.log('   Contract:', contractAddress);
        console.log('   Deployer:', deployerAddress);
        console.log('   Status:', isActive ? '✅ Active' : '❌ Inactive');
        console.log('   Created:', new Date(Number(createdAt) * 1000).toLocaleString());
        
        if (tokenAddress) {
          console.log('   Token:', tokenAddress);
          if (ticker) {
            console.log('   Ticker:', ticker);
          }
          if (totalSupply) {
            console.log('   Total Supply:', hre.ethers.formatEther(totalSupply), ticker || 'tokens');
          }
        } else {
          console.log('   Token: Not linked');
        }
        
        if (ipfsCID) {
          console.log('   IPFS CID:', ipfsCID);
        }
        
        console.log('');
      } catch (error) {
        console.log(`⚠️  Error reading dApp #${i}:`, error.message);
        console.log('');
      }
    }

    console.log('='.repeat(80));
    console.log('');

  } catch (error) {
    console.error('\n❌ Failed to list dApps:', error.message);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

