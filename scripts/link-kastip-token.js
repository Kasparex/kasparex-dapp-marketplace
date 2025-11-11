/**
 * Link KAST Token to KASTip dApp
 * 
 * This script links the deployed KAST token to the KASTip dApp in DAppRegistry.
 * 
 * Usage:
 *   npx hardhat run scripts/link-kastip-token.js --network kasplexL2Testnet
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('Linking token with account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || '0x1c2c21fFe7AE1fCb031eCabE69BCdeb9a10c04Dd';
  const dAppId = 4; // From deployment
  const tokenAddress = '0x58f026dC9985a253620C5ceDE16EC6316E5085C1'; // KAST token
  const tokenSymbol = 'KAST';
  const maxSupply = hre.ethers.parseEther('1000000'); // 1M tokens

  console.log('📋 Configuration:');
  console.log('   DAppRegistry:', dAppRegistryAddress);
  console.log('   dApp ID:', dAppId);
  console.log('   Token Address:', tokenAddress);
  console.log('   Token Symbol:', tokenSymbol);
  console.log('   Max Supply:', maxSupply.toString(), '\n');

  try {
    const DAppRegistry = await hre.ethers.getContractFactory('DAppRegistry');
    const dAppRegistry = DAppRegistry.attach(dAppRegistryAddress);

    // Check if deployer has permission
    console.log('🔍 Checking permissions...');
    try {
      const dAppData = await dAppRegistry.getDApp(dAppId);
      // getDApp returns a tuple: (name, version, category, contractAddress, deployer, isActive, createdAt, tokenAddress, ticker, totalSupply, ipfsCID)
      const deployerAddress = dAppData[4];
      console.log('   dApp Deployer:', deployerAddress);
      console.log('   Current Account:', deployer.address);
      console.log('   Match:', deployerAddress.toLowerCase() === deployer.address.toLowerCase(), '\n');
    } catch (error) {
      console.log('   ⚠️  Could not check permissions (continuing anyway):', error.message, '\n');
    }

    // Try to link token
    console.log('🔗 Linking token to dApp...');
    const linkTx = await dAppRegistry.linkDAppToToken(
      dAppId,
      tokenAddress,
      tokenSymbol,
      maxSupply
    );
    console.log('   Transaction hash:', linkTx.hash);
    
    await linkTx.wait();
    console.log('   ✅ Token linked successfully!\n');

    // Verify
    console.log('✅ Verification:');
    try {
      const updatedDAppData = await dAppRegistry.getDApp(dAppId);
      // getDApp returns a tuple: (name, version, category, contractAddress, deployer, isActive, createdAt, tokenAddress, ticker, totalSupply, ipfsCID)
      console.log('   Token Address:', updatedDAppData[7]);
      console.log('   Token Symbol:', updatedDAppData[8]);
      console.log('   Total Supply:', updatedDAppData[9].toString());
    } catch (error) {
      console.log('   ⚠️  Could not verify (but transaction succeeded):', error.message);
    }

  } catch (error) {
    console.error('\n❌ Failed to link token:', error.message);
    
    if (error.message.includes('Not authorized')) {
      console.log('\n💡 Solution: Grant DEPLOYER_ROLE to the deployer account');
      console.log('   Run this in Hardhat console:');
      console.log('   const DEPLOYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPLOYER_ROLE"));');
      console.log('   await dAppRegistry.grantRole(DEPLOYER_ROLE, "0x658420Fd88dbd610249a88384f9B1aD387F797c7");');
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

