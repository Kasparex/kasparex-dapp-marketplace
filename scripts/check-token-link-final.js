/**
 * Check Token Link Status - Final Method
 * Uses direct contract calls and event checking
 */

const hre = require('hardhat');

async function main() {
  const dAppRegistryAddress = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const dAppId = 4;
  const tokenAddress = '0x58f026dC9985a253620C5ceDE16EC6316E5085C1';

  console.log('🔍 Checking Token Link Status (Final Method)...\n');

  const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
  const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);

  try {
    // Method 1: Check events for DAppLinkedToToken
    console.log('📋 Method 1: Checking Events...');
    const filter = dAppRegistry.filters.DAppLinkedToToken(dAppId);
    const events = await dAppRegistry.queryFilter(filter);
    
    if (events.length > 0) {
      console.log(`   Found ${events.length} link event(s)`);
      events.forEach((event, index) => {
        console.log(`   Event ${index + 1}:`);
        console.log(`     Token: ${event.args.tokenAddress}`);
        console.log(`     Ticker: ${event.args.ticker}`);
        console.log(`     Total Supply: ${event.args.totalSupply.toString()}`);
        console.log(`     Block: ${event.blockNumber}`);
        
        if (event.args.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()) {
          console.log(`     ✅ This matches the KAST token!`);
        }
      });
      console.log('\n✅ Token IS linked (found in events)');
      return;
    } else {
      console.log('   No link events found\n');
    }

    // Method 2: Try to read the struct fields using a custom interface
    console.log('📋 Method 2: Reading Struct Fields...');
    try {
      // Create a minimal interface to read just the token address
      const tokenAddressAbi = [
        "function dApps(uint256) external view returns (address tokenAddress)"
      ];
      
      // Actually, let's use the full ABI but call it differently
      // The issue is getDApp returns a tuple that's hard to decode
      // Let's try reading via a low-level call
      
      // Try calling the public mapping directly
      // dApps is a public mapping, so we can call dApps(dAppId) but it returns the whole struct
      // Let's try a different approach - use a view function that returns just what we need
      
      console.log('   Attempting to read via contract interface...');
      
      // Since the struct decoding is failing, let's check if we can at least verify
      // the contract is registered and try linking to see what error we get
      const contractAddress = '0x962d06f6c11A95CBc02D5f965135368492d37Fd3';
      const registeredId = await dAppRegistry.contractToDAppId(contractAddress);
      console.log(`   Contract registered as dApp ID: ${registeredId.toString()}`);
      
      if (registeredId.toString() === dAppId.toString()) {
        console.log('   ✅ Contract registration is correct');
      }
      
    } catch (error) {
      console.log('   ⚠️  Could not read struct:', error.message);
    }

    // Method 3: Try linking and see what happens
    console.log('\n📋 Method 3: Testing Link Operation...');
    console.log('   Attempting static call to linkDAppToToken...');
    
    try {
      const [deployer] = await hre.ethers.getSigners();
      const result = await dAppRegistry.linkDAppToToken.staticCall(
        dAppId,
        tokenAddress,
        'KAST',
        hre.ethers.parseEther('1000000'),
        { from: deployer.address }
      );
      console.log('   ✅ Static call succeeded - token can be linked');
      console.log('   ❌ Token is NOT linked yet');
    } catch (error) {
      if (error.message.includes('already') || error.message.includes('duplicate')) {
        console.log('   ✅ Token appears to be already linked');
      } else if (error.message.includes('Not authorized')) {
        console.log('   ⚠️  Authorization issue (but token might not be linked)');
      } else {
        console.log('   Error:', error.message);
        console.log('   ❌ Token is likely NOT linked (transaction would revert)');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n💡 Summary:');
  console.log('   - Check events above to see if token was linked');
  console.log('   - If no events found, token is likely NOT linked');
  console.log('   - You can try linking manually if needed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

