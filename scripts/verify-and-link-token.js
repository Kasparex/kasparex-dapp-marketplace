/**
 * Verify Token Contract and Link
 * Checks token contract validity before linking
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const dAppRegistryAddress = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const dAppId = 4;
  const tokenAddress = '0x58f026dC9985a253620C5ceDE16EC6316E5085C1';
  const tokenSymbol = 'KAST';
  const maxSupply = hre.ethers.parseEther('1000000');

  console.log('🔍 Verifying Token Contract...\n');

  // Verify token contract exists
  try {
    const DAppToken = await hre.ethers.getContractFactory('DAppToken');
    const token = DAppToken.attach(tokenAddress);
    
    const name = await token.name();
    const symbol = await token.symbol();
    const maxSupplyFromContract = await token.MAX_SUPPLY();
    
    console.log('✅ Token Contract Verified:');
    console.log('   Name:', name);
    console.log('   Symbol:', symbol);
    console.log('   Max Supply:', maxSupplyFromContract.toString());
    console.log('   Matches expected:', symbol === tokenSymbol, '\n');
  } catch (error) {
    console.error('❌ Token contract verification failed:', error.message);
    return;
  }

  // Now try to link
  console.log('🔗 Attempting to Link Token...\n');
  
  const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
  const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);

  try {
    // Double-check we have admin role
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const hasAdmin = await dAppRegistry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    console.log('   Has ADMIN_ROLE:', hasAdmin);
    
    if (!hasAdmin) {
      console.log('   ❌ No admin role - cannot link');
      return;
    }

    // Check dApp is active
    // We'll try to update status just to be sure
    try {
      await dAppRegistry.updateDAppStatus(dAppId, true);
      console.log('   ✅ Ensured dApp is active');
    } catch (e) {
      console.log('   ⚠️  Could not update status (might already be active)');
    }

    // Try the link with explicit gas
    console.log('\n   Sending link transaction...');
    const tx = await dAppRegistry.linkDAppToToken(
      dAppId,
      tokenAddress,
      tokenSymbol,
      maxSupply,
      {
        gasLimit: 500000 // Explicit gas limit
      }
    );
    
    console.log('   Transaction hash:', tx.hash);
    console.log('   Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log('\n✅ Token linked successfully!');
    console.log('   Block:', receipt.blockNumber);
    console.log('   Gas used:', receipt.gasUsed.toString());
    
    // Check for the event
    const linkEvent = receipt.logs.find(log => {
      try {
        const parsed = dAppRegistry.interface.parseLog(log);
        return parsed.name === 'DAppLinkedToToken';
      } catch {
        return false;
      }
    });
    
    if (linkEvent) {
      const parsed = dAppRegistry.interface.parseLog(linkEvent);
      console.log('\n📋 Link Event:');
      console.log('   dApp ID:', parsed.args.dAppId.toString());
      console.log('   Token:', parsed.args.tokenAddress);
      console.log('   Ticker:', parsed.args.ticker);
      console.log('   Total Supply:', parsed.args.totalSupply.toString());
    }

  } catch (error) {
    console.error('\n❌ Failed to link token:', error.message);
    
    // Try to decode the revert reason
    if (error.data) {
      console.error('   Error data:', error.data);
    }
    
    if (error.reason) {
      console.error('   Reason:', error.reason);
    }
    
    // Check specific error types
    if (error.message.includes('Invalid dApp ID')) {
      console.log('   💡 dApp ID might be wrong');
    } else if (error.message.includes('Invalid token address')) {
      console.log('   💡 Token address might be wrong');
    } else if (error.message.includes('not active')) {
      console.log('   💡 dApp might not be active');
    } else if (error.message.includes('Not authorized')) {
      console.log('   💡 Authorization issue - check roles');
    } else {
      console.log('   💡 Unknown error - might be a contract state issue');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

