/**
 * Link KAST Token to KASTip dApp (Admin Method)
 * 
 * This script grants DEPLOYER_ROLE to the deployer account and then links the token.
 * 
 * Usage:
 *   npx hardhat run scripts/link-kastip-token-admin.js --network kasplexL2Testnet
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

    // Check if deployer has admin role
    const DEFAULT_ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const DEPLOYER_ROLE = hre.ethers.keccak256(hre.ethers.toUtf8Bytes('DEPLOYER_ROLE'));
    
    console.log('🔍 Checking roles...');
    const hasAdminRole = await dAppRegistry.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const hasDeployerRole = await dAppRegistry.hasRole(DEPLOYER_ROLE, deployer.address);
    
    console.log('   Has ADMIN_ROLE:', hasAdminRole);
    console.log('   Has DEPLOYER_ROLE:', hasDeployerRole, '\n');

    // Try to grant DEPLOYER_ROLE if we have admin
    if (!hasDeployerRole && hasAdminRole) {
      console.log('🔐 Granting DEPLOYER_ROLE...');
      const grantTx = await dAppRegistry.grantRole(DEPLOYER_ROLE, deployer.address);
      await grantTx.wait();
      console.log('   ✅ DEPLOYER_ROLE granted\n');
    } else if (!hasAdminRole && !hasDeployerRole) {
      console.log('   ⚠️  Account does not have required roles');
      console.log('   💡 You may need to use the admin account to grant roles\n');
    }

    // Check dApp status first
    console.log('🔍 Checking dApp status...');
    try {
      // Try to read dAppCount to verify dApp exists
      const dAppCount = await dAppRegistry.dAppCount();
      console.log('   Total dApps:', dAppCount.toString());
      console.log('   Requested dApp ID:', dAppId);
      
      if (dAppId > dAppCount) {
        throw new Error(`dApp ID ${dAppId} does not exist (max: ${dAppCount})`);
      }
    } catch (error) {
      console.log('   ⚠️  Could not verify dApp:', error.message);
    }

    // Try to link token
    console.log('\n🔗 Linking token to dApp...');
    try {
      // Estimate gas first to see if it would fail
      const gasEstimate = await dAppRegistry.linkDAppToToken.estimateGas(
        dAppId,
        tokenAddress,
        tokenSymbol,
        maxSupply
      );
      console.log('   Gas estimate:', gasEstimate.toString());
    } catch (estimateError) {
      console.error('   ❌ Gas estimation failed:', estimateError.message);
      if (estimateError.data) {
        console.error('   Error data:', estimateError.data);
      }
      throw estimateError;
    }
    
    const linkTx = await dAppRegistry.linkDAppToToken(
      dAppId,
      tokenAddress,
      tokenSymbol,
      maxSupply
    );
    console.log('   Transaction hash:', linkTx.hash);
    
    const receipt = await linkTx.wait();
    console.log('   ✅ Token linked successfully!');
    console.log('   Block:', receipt.blockNumber);
    console.log('   Gas used:', receipt.gasUsed.toString(), '\n');

    console.log('✅ Token linking complete!');
    console.log('   dApp ID:', dAppId);
    console.log('   Token:', tokenAddress);
    console.log('   Symbol:', tokenSymbol);

  } catch (error) {
    console.error('\n❌ Failed to link token:', error.message);
    
    if (error.message.includes('Not authorized')) {
      console.log('\n💡 Solution: You need to use an account with DEFAULT_ADMIN_ROLE');
      console.log('   Or grant DEPLOYER_ROLE to the deployer account');
      console.log('\n   To grant role, run in Hardhat console:');
      console.log('   const DAppRegistry = await ethers.getContractFactory("DAppRegistry");');
      console.log('   const dAppRegistry = DAppRegistry.attach("' + dAppRegistryAddress + '");');
      console.log('   const DEPLOYER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DEPLOYER_ROLE"));');
      console.log('   await dAppRegistry.grantRole(DEPLOYER_ROLE, "' + deployer.address + '");');
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

