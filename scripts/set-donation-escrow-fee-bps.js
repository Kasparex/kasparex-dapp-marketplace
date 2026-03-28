/**
 * Set DonationEscrow fee to 10% (feeBps = 1000) so 10% of each L2 donation goes to FeeRouter â†’ 100% to Revenue Tree.
 * Call as DonationEscrow owner.
 *
 * Usage: npx hardhat run scripts/set-donation-escrow-fee-bps.js --network igraMainnet
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

const FEE_BPS_10_PCT = 1000;

function getOverrides(chainId) {
  if (Number(chainId) === 38833) {
    return { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  }
  return {};
}

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const chainId = (await hre.ethers.provider.getNetwork()).chainId;
  if (Number(chainId) !== 38833) {
    console.error('This script is for Igra Mainnet (chainId 38833) only.');
    process.exit(1);
  }

  let donationEscrowAddress = process.env.DONATION_ESCROW_ADDRESS?.trim();
  if (!donationEscrowAddress) {
    const p = path.join(__dirname, '..', 'deployments', 'donation-escrow-igra-galleon-testnet.json');
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      donationEscrowAddress = data.DonationEscrow;
    }
  }
  if (!donationEscrowAddress) {
    console.error('Set DONATION_ESCROW_ADDRESS or ensure deployments/donation-escrow-igra-galleon-testnet.json exists.');
    process.exit(1);
  }

  const overrides = getOverrides(chainId);
  const escrow = await hre.ethers.getContractAt('DonationEscrow', donationEscrowAddress);
  const current = await escrow.feeBps();
  console.log('DonationEscrow:', donationEscrowAddress);
  console.log('Current feeBps:', current.toString());
  if (current === BigInt(FEE_BPS_10_PCT)) {
    console.log('Already 10%. No change.');
    return;
  }

  console.log('Setting feeBps to', FEE_BPS_10_PCT, '(10%)...');
  const tx = await escrow.setFeeBps(FEE_BPS_10_PCT, overrides);
  await tx.wait();
  console.log('Tx:', tx.hash);
  console.log('Done. 10% of each L2 donation now goes to FeeRouter â†’ 100% to Revenue Tree.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
