/**
 * Check Deployer Balance
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log('📋 Account Information:');
  console.log('   Address:', deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const balanceKAS = hre.ethers.formatEther(balance);
  
  console.log('   Balance:', balanceKAS, 'KAS');
  console.log('   Balance (wei):', balance.toString());
  
  if (parseFloat(balanceKAS) < 0.1) {
    console.log('\n⚠️  WARNING: Low balance! You may need more KAS for gas.');
  } else {
    console.log('\n✅ Balance looks sufficient for gas fees.');
  }
  
  console.log('\n💡 If you need to send KAS, send it to:');
  console.log('   ' + deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

