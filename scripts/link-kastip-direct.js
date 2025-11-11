/**
 * Link KAST Token - Direct Call with Error Details
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  const dAppRegistryAddress = '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const dAppId = 4;
  const tokenAddress = '0x58f026dC9985a253620C5ceDE16EC6316E5085C1';
  const tokenSymbol = 'KAST';
  const maxSupply = hre.ethers.parseEther('1000000');

  const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
  const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);

  console.log('Attempting direct call...\n');

  try {
    // Try to call with callStatic to get revert reason
    try {
      await dAppRegistry.linkDAppToToken.staticCall(
        dAppId,
        tokenAddress,
        tokenSymbol,
        maxSupply
      );
      console.log('✅ Static call succeeded - transaction should work');
    } catch (staticError) {
      console.error('❌ Static call failed:', staticError.message);
      if (staticError.reason) {
        console.error('   Reason:', staticError.reason);
      }
      if (staticError.data) {
        console.error('   Data:', staticError.data);
      }
    }

    // Actually send the transaction
    console.log('\nSending transaction...');
    const tx = await dAppRegistry.linkDAppToToken(
      dAppId,
      tokenAddress,
      tokenSymbol,
      maxSupply,
      { gasLimit: 500000 } // Set explicit gas limit
    );
    
    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('✅ Success! Block:', receipt.blockNumber);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    // Try to decode the error
    if (error.data) {
      console.error('Error data:', error.data);
    }
    
    // Check if it's a known error
    if (error.message.includes('Invalid dApp ID')) {
      console.log('💡 dApp ID might be wrong');
    } else if (error.message.includes('Invalid token address')) {
      console.log('💡 Token address might be wrong');
    } else if (error.message.includes('not active')) {
      console.log('💡 dApp might not be active');
    } else if (error.message.includes('Not authorized')) {
      console.log('💡 Authorization issue');
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

