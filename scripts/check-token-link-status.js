/**
 * Check if Token is Already Linked to dApp
 * Reads the DAppRegistry contract state directly
 */

const hre = require('hardhat');

async function main() {
  const dAppRegistryAddress = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const dAppId = 4;
  const tokenAddress = '0x58f026dC9985a253620C5ceDE16EC6316E5085C1';
  const kastipContractAddress = '0x962d06f6c11A95CBc02D5f965135368492d37Fd3';

  console.log('🔍 Checking Token Link Status...\n');

  const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
  const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);

  try {
    // Check dApp count
    const dAppCount = await dAppRegistry.dAppCount();
    console.log('📊 Registry Status:');
    console.log('   Total dApps:', dAppCount.toString());
    console.log('   Checking dApp ID:', dAppId, '\n');

    // Check contract to dApp ID mapping
    const contractDAppId = await dAppRegistry.contractToDAppId(kastipContractAddress);
    console.log('🔗 Contract Mapping:');
    console.log('   KASTip Contract:', kastipContractAddress);
    console.log('   Registered as dApp ID:', contractDAppId.toString());
    
    if (contractDAppId.toString() === dAppId.toString()) {
      console.log('   ✅ Contract is correctly registered\n');
    } else {
      console.log('   ⚠️  Contract mapping mismatch\n');
    }

    // Try to read dApp struct fields directly
    // DApp struct: (name, version, category, contractAddress, deployer, isActive, createdAt, tokenAddress, ticker, totalSupply, ipfsCID)
    console.log('📋 Reading dApp Data:');
    
    // Read individual fields from the struct
    // We'll use a workaround - call getDApp but handle the tuple decoding
    try {
      // Use a simple contract call to read the struct
      const dAppData = await dAppRegistry.getDApp(dAppId);
      
      // The tuple should be: (name, version, category, contractAddress, deployer, isActive, createdAt, tokenAddress, ticker, totalSupply, ipfsCID)
      const tokenAddressFromRegistry = dAppData[7];
      const tickerFromRegistry = dAppData[8];
      const totalSupplyFromRegistry = dAppData[9];
      
      console.log('   Token Address:', tokenAddressFromRegistry);
      console.log('   Token Ticker:', tickerFromRegistry);
      console.log('   Token Total Supply:', totalSupplyFromRegistry.toString());
      
      if (tokenAddressFromRegistry && tokenAddressFromRegistry !== '0x0000000000000000000000000000000000000000') {
        console.log('\n✅ Token IS already linked!');
        console.log('   Linked Token:', tokenAddressFromRegistry);
        console.log('   Ticker:', tickerFromRegistry);
        
        if (tokenAddressFromRegistry.toLowerCase() === tokenAddress.toLowerCase()) {
          console.log('   ✅ This matches the KAST token address');
        } else {
          console.log('   ⚠️  Different token address than expected');
          console.log('   Expected:', tokenAddress);
        }
      } else {
        console.log('\n❌ Token is NOT linked yet');
        console.log('   Token address is empty/zero');
      }
    } catch (error) {
      console.log('   ⚠️  Could not read dApp data:', error.message);
      console.log('   Trying alternative method...\n');
      
      // Alternative: Try to read the mapping directly using a view function
      // Since we can't directly access mappings, let's try calling linkDAppToToken with staticCall
      // to see what error we get
      try {
        await dAppRegistry.linkDAppToToken.staticCall(
          dAppId,
          tokenAddress,
          'KAST',
          hre.ethers.parseEther('1000000')
        );
        console.log('   ✅ Static call succeeded - token can be linked');
      } catch (staticError) {
        if (staticError.message.includes('already')) {
          console.log('   ✅ Token appears to be already linked (based on error)');
        } else {
          console.log('   Error:', staticError.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

