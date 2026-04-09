/**
 * Register DonationEscrow with FeeRouter and LoyaltyPoints (IGRA Galleon Testnet).
 * Run after deploying DonationEscrow so L2 donations and L1 record work.
 *
 * Usage:
 *   npx hardhat run scripts/setup-vdonations-auth.js --network igraMainnet
 *
 * Env:
 *   PRIVATE_KEY - must be owner of FeeRouter and LoyaltyPoints (or deployer who did configure-igra-galleon-rewards)
 *   DONATION_ESCROW_ADDRESS - deployed DonationEscrow address (or set in deployments/donation-escrow-igra-galleon-testnet.json)
 *   FEE_ROUTER_ADDRESS - required on Igra Mainnet
 *   LOYALTY_POINTS_ADDRESS - required on Igra Mainnet
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

function getOverrides(chainId) {
  if (Number(chainId) === 38833) {
    return { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  }
  return {};
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  if (Number(chainId) !== 38833) {
    console.error('This script is for Igra Mainnet (chainId 38833) only.');
    process.exit(1);
  }

  let donationEscrowAddress = process.env.DONATION_ESCROW_ADDRESS?.trim();
  if (!donationEscrowAddress) {
    const deploymentsPath = path.join(__dirname, '..', 'deployments', 'donation-escrow-igraMainnet.json');
    if (fs.existsSync(deploymentsPath)) {
      const data = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
      donationEscrowAddress = data.DonationEscrow;
    }
  }
  if (!donationEscrowAddress) {
    console.error('Set DONATION_ESCROW_ADDRESS or run deploy-donation-escrow.js first (creates deployments/donation-escrow-igraMainnet.json).');
    process.exit(1);
  }

  const feeRouterAddress = (process.env.FEE_ROUTER_ADDRESS || '').trim();
  const loyaltyPointsAddress = (process.env.LOYALTY_POINTS_ADDRESS || '').trim();
  if (!feeRouterAddress || !loyaltyPointsAddress) {
    console.error('Set FEE_ROUTER_ADDRESS and LOYALTY_POINTS_ADDRESS for Igra Mainnet.');
    process.exit(1);
  }
  const overrides = getOverrides(chainId);

  console.log('CrowdKAS auth setup on Igra Mainnet');
  console.log('Account:', deployer.address);
  console.log('DonationEscrow:', donationEscrowAddress);
  console.log('FeeRouter:', feeRouterAddress);
  console.log('LoyaltyPoints:', loyaltyPointsAddress);

  console.log('\n1. FeeRouter: setAuthorizedDApp(DonationEscrow, true)...');
  const feeRouter = await hre.ethers.getContractAt('FeeRouter', feeRouterAddress);
  const tx1 = await feeRouter.setAuthorizedDApp(donationEscrowAddress, true, overrides);
  await tx1.wait();
  console.log('   Tx:', tx1.hash);

  console.log('\n2. FeeRouter: setTreeBpsByType("donation", 10000) so 100% of donation fees go to Revenue Tree...');
  try {
    const tx1b = await feeRouter.setTreeBpsByType('donation', 10000, overrides);
    await tx1b.wait();
    console.log('   Tx:', tx1b.hash);
  } catch (err) {
    console.warn('   Skipped (FeeRouter does not have setTreeBpsByType â€” deploy upgraded FeeRouter and call setTreeBpsByType("donation", 10000) manually).');
  }

  console.log('\n3. LoyaltyPoints: setAuthorizedCaller(DonationEscrow, true)...');
  const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
  const tx2 = await loyaltyPoints.setAuthorizedCaller(donationEscrowAddress, true, overrides);
  await tx2.wait();
  console.log('   Tx:', tx2.hash);

  console.log('\nDone. DonationEscrow is authorized on FeeRouter and LoyaltyPoints; donation fees (10% of donation) go 100% to Revenue Tree.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
