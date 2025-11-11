/**
 * Check if Token is Already Linked
 */

const hre = require('hardhat');

async function main() {
  const dAppRegistryAddress = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const dAppId = 4;
  const tokenAddress = '0x58f026dC9985a253620C5ceDE16EC6316E5085C1';

  const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
  const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);

  console.log('Checking token link status...\n');

  try {
    // Try to get token address for this dApp
    // Since getDApp has issues, let's try using the tokenToDApps mapping
    const tokenDApps = await dAppRegistry.tokenToDApps(tokenAddress);
    console.log('dApps linked to this token:', tokenDApps.length);
    
    if (tokenDApps.length > 0) {
      console.log('Token is already linked to dApp IDs:', tokenDApps.map(id => id.toString()));
      
      const isLinked = tokenDApps.some(id => id.toString() === dAppId.toString());
      if (isLinked) {
        console.log(`\n✅ Token is already linked to dApp ID ${dAppId}!`);
        console.log('   No need to link again.');
        return;
      }
    }
    
    // Try to check via contractToDAppId
    const contractAddress = '0x962d06f6c11A95CBc02D5f965135368492d37Fd3'; // KASTip contract
    const contractDAppId = await dAppRegistry.contractToDAppId(contractAddress);
    console.log('\nKASTip contract is registered as dApp ID:', contractDAppId.toString());
    
    if (contractDAppId.toString() === dAppId.toString()) {
      console.log('✅ Contract mapping is correct');
    }
    
    console.log('\n💡 Token does not appear to be linked yet.');
    console.log('   You can proceed with linking.');

  } catch (error) {
    console.error('Error checking:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

