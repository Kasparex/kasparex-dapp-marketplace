/**
 * Approve GRID (or other ERC20) and deposit into RewardsClaimVault on Igra mainnet.
 *
 * Env:
 *   PRIVATE_KEY — deployer / funder (must hold token + iKAS for gas)
 *   REWARDS_CLAIM_VAULT_ADDRESS — vault 0x… (defaults to production Igra vault)
 *   REWARDS_VAULT_TOKEN — ERC20 to fund (defaults to Igra mainnet GRID)
 *   REWARDS_VAULT_DEPOSIT_GRID — human amount, 18 decimals (e.g. "1000")
 *   or REWARDS_VAULT_DEPOSIT_WEI — raw uint string
 *
 *   npx hardhat run scripts/fund-rewards-claim-vault.js --network igraMainnet
 */

const hre = require('hardhat');

const IERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

const VAULT_ABI = ['function deposit(address token, uint256 amount) external'];

const DEFAULT_VAULT = '0xc76515904e948698F67fCBc64f7d3b4C57602470';
const DEFAULT_IGRA_GRID = '0x05E02a8b14CD7974c6102CDB855F2dCd8E1f4902';

function feeOverrides(chainId) {
  if (Number(chainId) === 38836 || Number(chainId) === 38833) {
    return { gasPrice: hre.ethers.parseUnits('2000', 'gwei') };
  }
  return {};
}

async function main() {
  const vaultAddr =
    process.env.REWARDS_CLAIM_VAULT_ADDRESS?.trim() || DEFAULT_VAULT;
  const tokenAddr = process.env.REWARDS_VAULT_TOKEN?.trim() || DEFAULT_IGRA_GRID;

  if (!hre.ethers.isAddress(vaultAddr) || !hre.ethers.isAddress(tokenAddr)) {
    throw new Error('Invalid REWARDS_CLAIM_VAULT_ADDRESS or REWARDS_VAULT_TOKEN');
  }

  let amount;
  if (process.env.REWARDS_VAULT_DEPOSIT_WEI?.trim()) {
    amount = BigInt(process.env.REWARDS_VAULT_DEPOSIT_WEI.trim());
  } else if (process.env.REWARDS_VAULT_DEPOSIT_GRID?.trim()) {
    const dec = process.env.REWARDS_VAULT_TOKEN_DECIMALS
      ? Number(process.env.REWARDS_VAULT_TOKEN_DECIMALS)
      : 18;
    amount = hre.ethers.parseUnits(process.env.REWARDS_VAULT_DEPOSIT_GRID.trim(), dec);
  } else {
    throw new Error(
      'Set REWARDS_VAULT_DEPOSIT_GRID (human units) or REWARDS_VAULT_DEPOSIT_WEI (raw)',
    );
  }

  if (amount <= 0n) throw new Error('Deposit amount must be positive');

  const [signer] = await hre.ethers.getSigners();
  const net = await hre.ethers.provider.getNetwork();
  const ov = feeOverrides(net.chainId);

  const token = new hre.ethers.Contract(tokenAddr, IERC20_ABI, signer);
  const vault = new hre.ethers.Contract(vaultAddr, VAULT_ABI, signer);

  let sym = '?';
  try {
    sym = await token.symbol();
  } catch {
    /* optional */
  }

  const bal = await token.balanceOf(signer.address);
  if (bal < amount) {
    throw new Error(
      `Insufficient ${sym} balance: have ${bal.toString()} need ${amount.toString()} (wei)`,
    );
  }

  console.log('Network chainId:', net.chainId.toString());
  console.log('Funder:', signer.address);
  console.log('Vault:', vaultAddr);
  console.log('Token:', tokenAddr, sym ? `(${sym})` : '');
  console.log('Deposit amount (wei):', amount.toString());

  const cur = await token.allowance(signer.address, vaultAddr);
  if (cur < amount) {
    console.log('Approving vault…');
    const approveTx = await token.approve(vaultAddr, amount, ov);
    console.log('  tx:', approveTx.hash);
    await approveTx.wait();
  } else {
    console.log('Allowance already sufficient, skipping approve');
  }

  console.log('Depositing…');
  const depTx = await vault.deposit(tokenAddr, amount, ov);
  console.log('  tx:', depTx.hash);
  await depTx.wait();
  console.log('Done. Vault token balance increased.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
