/**
 * Deploy DonationEscrow (Kasparex vDonations) on IGRA Galleon Testnet.
 * Usage: npx hardhat run scripts/deploy-donation-escrow.js --network igraMainnet
 * Env: PRIVATE_KEY, FEE_ROUTER_ADDRESS, LOYALTY_POINTS_ADDRESS, (optional) RECORDER_ADDRESS (defaults to deployer)
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const FEE_ROUTER_38836 = '0xd556624Cd557cb4fA3a23964Ced4838e1ffA6E5A';
const LOYALTY_POINTS_38836 = '0x1cF432A52A0f2D09c8E7450CC40E4FC1422E8936';
const FEE_BPS = 1000; // 10% â€” goes to FeeRouter; set FeeRouter.setTreeBpsByType("donation", 10000) so 100% of this goes to Revenue Tree

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

  const feeRouterAddress = (process.env.FEE_ROUTER_ADDRESS || FEE_ROUTER_38836).trim();
  const loyaltyPointsAddress = (process.env.LOYALTY_POINTS_ADDRESS || LOYALTY_POINTS_38836).trim();
  const recorderAddress = (process.env.RECORDER_ADDRESS || deployer.address).trim();
  const overrides = getOverrides(chainId);

  console.log('Deploying DonationEscrow (vDonations) on IGRA Galleon Testnet');
  console.log('Deployer:', deployer.address);
  console.log('FeeRouter:', feeRouterAddress);
  console.log('LoyaltyPoints:', loyaltyPointsAddress);
  console.log('Recorder (for L1 record):', recorderAddress);

  const DonationEscrow = await hre.ethers.getContractFactory('DonationEscrow');
  const txReq = await DonationEscrow.getDeployTransaction(
    feeRouterAddress,
    loyaltyPointsAddress,
    FEE_BPS,
    recorderAddress
  );
  if (!txReq.gasLimit) txReq.gasLimit = 8_000_000n;
  const sent = await deployer.sendTransaction({ ...txReq, ...overrides });
  const receipt = await sent.wait();
  const address = receipt.contractAddress;
  if (!address) throw new Error('No contractAddress in receipt');
  console.log('DonationEscrow deployed at:', address);

  const out = {
    network: 'igraMainnet',
    chainId: 38833,
    DonationEscrow: address,
    FeeRouter: feeRouterAddress,
    LoyaltyPoints: loyaltyPointsAddress,
    Recorder: recorderAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  const outDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'donation-escrow-igra-galleon-testnet.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote:', outPath);
  console.log('\nNext: 1) Add DonationEscrow to FeeRouter (setAuthorizedDApp). 2) On FeeRouter call setTreeBpsByType("donation", 10000) so 100% of donation fees go to Revenue Tree. 3) Add DonationEscrow to LoyaltyPoints (setAuthorizedCaller). 4) Set baseReward and pointsPer1iKAS for "donation" and "vdonation-l1".');
  console.log('NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_IGRA_MAINNET=' + address);
  console.log('NEXT_PUBLIC_DONATION_ESCROW_ADDRESS_38833=' + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
