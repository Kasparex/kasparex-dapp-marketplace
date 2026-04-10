/**
 * Deploy DonationEscrowV2 (Kasparex CrowdKAS V2) on Igra Mainnet (38833).
 * Usage: npx hardhat run scripts/deploy-donation-escrow-v2.js --network igraMainnet
 * Env: PRIVATE_KEY, FEE_ROUTER_ADDRESS, LOYALTY_POINTS_ADDRESS, MODULE_SIGNER_ADDRESS, (optional) RECORDER_ADDRESS (defaults to deployer)
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const FEE_BPS = 1000; // 10% goes to FeeRouter

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

  const feeRouterAddress = (process.env.FEE_ROUTER_ADDRESS || '').trim();
  const loyaltyPointsAddress = (process.env.LOYALTY_POINTS_ADDRESS || '').trim();
  const moduleSignerAddress = (process.env.MODULE_SIGNER_ADDRESS || '').trim();
  if (!feeRouterAddress || !loyaltyPointsAddress || !moduleSignerAddress) {
    console.error('Set FEE_ROUTER_ADDRESS, LOYALTY_POINTS_ADDRESS, and MODULE_SIGNER_ADDRESS in env for Igra Mainnet.');
    process.exit(1);
  }
  const recorderAddress = (process.env.RECORDER_ADDRESS || deployer.address).trim();
  const overrides = getOverrides(chainId);

  console.log('Deploying DonationEscrowV2 (CrowdKAS) on Igra Mainnet');
  console.log('Deployer:', deployer.address);
  console.log('FeeRouter:', feeRouterAddress);
  console.log('LoyaltyPoints:', loyaltyPointsAddress);
  console.log('Recorder (for L1 record):', recorderAddress);
  console.log('ModuleSigner (module unlock attestations):', moduleSignerAddress);

  const DonationEscrowV2 = await hre.ethers.getContractFactory('DonationEscrowV2');
  const txReq = await DonationEscrowV2.getDeployTransaction(
    feeRouterAddress,
    loyaltyPointsAddress,
    FEE_BPS,
    recorderAddress,
    moduleSignerAddress
  );
  if (!txReq.gasLimit) txReq.gasLimit = 9_500_000n;
  const sent = await deployer.sendTransaction({ ...txReq, ...overrides });
  const receipt = await sent.wait();
  const address = receipt.contractAddress;
  if (!address) throw new Error('No contractAddress in receipt');
  console.log('DonationEscrowV2 deployed at:', address);

  const out = {
    network: 'igraMainnet',
    chainId: 38833,
    DonationEscrowV2: address,
    FeeRouter: feeRouterAddress,
    LoyaltyPoints: loyaltyPointsAddress,
    Recorder: recorderAddress,
    ModuleSigner: moduleSignerAddress,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };
  const outDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'donation-escrow-v2-igraMainnet.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('Wrote:', outPath);
  console.log('\nNext: authorize DonationEscrowV2 in FeeRouter + LoyaltyPoints; configure Revenue Tree bps for "donation".');
  console.log('NEXT_PUBLIC_DONATION_ESCROW_V2_ADDRESS_IGRA_MAINNET=' + address);
  console.log('NEXT_PUBLIC_DONATION_ESCROW_V2_ADDRESS_38833=' + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

