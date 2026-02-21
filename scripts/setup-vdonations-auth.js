/**
 * Register DonationEscrow with FeeRouter and LoyaltyPoints (IGRA Galleon Testnet).
 * Run after deploying DonationEscrow so L2 donations and L1 record work.
 *
 * Usage:
 *   npx hardhat run scripts/setup-vdonations-auth.js --network igraGalleonTestnet
 *
 * Env:
 *   PRIVATE_KEY - must be owner of FeeRouter and LoyaltyPoints (or deployer who did configure-igra-galleon-rewards)
 *   DONATION_ESCROW_ADDRESS - deployed DonationEscrow address (or set in deployments/donation-escrow-igra-galleon-testnet.json)
 *   FEE_ROUTER_ADDRESS - optional (default 38836)
 *   LOYALTY_POINTS_ADDRESS - optional (default 38836)
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const FEE_ROUTER_38836 = '0x37c98699eEe02Cb89da64C45B8c970174218A745';
const LOYALTY_POINTS_38836 = '0x1cF432A52A0f2D09c8E7450CC40E4FC1422E8936';

function getOverrides(chainId) {
  if (Number(chainId) === 38836 || Number(chainId) === 38837 || Number(chainId) === 19416) {
    return { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  }
  return {};
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;

  if (Number(chainId) !== 38836) {
    console.error('This script is for IGRA Galleon Testnet (chainId 38836) only.');
    process.exit(1);
  }

  let donationEscrowAddress = process.env.DONATION_ESCROW_ADDRESS?.trim();
  if (!donationEscrowAddress) {
    const deploymentsPath = path.join(__dirname, '..', 'deployments', 'donation-escrow-igra-galleon-testnet.json');
    if (fs.existsSync(deploymentsPath)) {
      const data = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
      donationEscrowAddress = data.DonationEscrow;
    }
  }
  if (!donationEscrowAddress) {
    console.error('Set DONATION_ESCROW_ADDRESS or run deploy-donation-escrow.js first (creates deployments/donation-escrow-igra-galleon-testnet.json).');
    process.exit(1);
  }

  const feeRouterAddress = (process.env.FEE_ROUTER_ADDRESS || FEE_ROUTER_38836).trim();
  const loyaltyPointsAddress = (process.env.LOYALTY_POINTS_ADDRESS || LOYALTY_POINTS_38836).trim();
  const overrides = getOverrides(chainId);

  console.log('vDonations auth setup on IGRA Galleon Testnet');
  console.log('Account:', deployer.address);
  console.log('DonationEscrow:', donationEscrowAddress);
  console.log('FeeRouter:', feeRouterAddress);
  console.log('LoyaltyPoints:', loyaltyPointsAddress);

  console.log('\n1. FeeRouter: setAuthorizedDApp(DonationEscrow, true)...');
  const feeRouter = await hre.ethers.getContractAt('FeeRouter', feeRouterAddress);
  const tx1 = await feeRouter.setAuthorizedDApp(donationEscrowAddress, true, overrides);
  await tx1.wait();
  console.log('   Tx:', tx1.hash);

  console.log('\n2. LoyaltyPoints: setAuthorizedCaller(DonationEscrow, true)...');
  const loyaltyPoints = await hre.ethers.getContractAt('LoyaltyPoints', loyaltyPointsAddress);
  const tx2 = await loyaltyPoints.setAuthorizedCaller(donationEscrowAddress, true, overrides);
  await tx2.wait();
  console.log('   Tx:', tx2.hash);

  console.log('\nDone. DonationEscrow is authorized on FeeRouter and LoyaltyPoints.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
