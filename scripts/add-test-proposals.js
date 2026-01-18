/**
 * Script to add test proposals to DAO Voting contract
 * 
 * Usage:
 * node scripts/add-test-proposals.js --network kasplex-l2-mainnet
 * 
 * Or with environment variables:
 * PRIVATE_KEY=your_key node scripts/add-test-proposals.js
 */

const { ethers } = require('ethers');
require('dotenv').config();

// Test proposals to add
const TEST_PROPOSALS = [
  {
    title: 'Add NFT Marketplace dApp',
    description: 'Create a decentralized NFT marketplace where users can buy, sell, and trade NFTs on Kaspa L2. This would include features like auctions, collections, and royalty distribution.',
  },
  {
    title: 'Implement DeFi Lending Protocol',
    description: 'Build a lending and borrowing protocol that allows users to lend their KAS and other tokens to earn interest, or borrow against their holdings. This would include liquidity pools and interest rate mechanisms.',
  },
  {
    title: 'Create Gaming dApp Platform',
    description: 'Develop a gaming platform where users can play blockchain-based games, earn rewards, and trade in-game assets. Games could include PvP battles, tournaments, and NFT-based collectibles.',
  },
  {
    title: 'Build Social Media dApp',
    description: 'Create a decentralized social media platform where users can post content, tip creators, and earn rewards for engagement. Content would be stored on IPFS and users would have full control over their data.',
  },
  {
    title: 'Launch Prediction Market',
    description: 'Build a prediction market where users can bet on future events, sports outcomes, or market predictions. This would use oracle integration for result verification and automated payouts.',
  },
  {
    title: 'Implement Cross-Chain Bridge',
    description: 'Create a bridge that allows users to transfer assets between Kaspa L1, L2, and other blockchains. This would enable seamless interoperability and expand the ecosystem.',
  },
  {
    title: 'Add Staking Platform',
    description: 'Develop a staking platform where users can stake KAS, GRID, or dApp tokens to earn rewards. This would include flexible staking periods, auto-compounding, and validator selection.',
  },
  {
    title: 'Create DAO Governance Tool',
    description: 'Build a comprehensive DAO governance tool that allows communities to create proposals, vote on decisions, and manage treasury funds. This would include voting power based on token holdings.',
  },
  {
    title: 'Launch Decentralized Exchange',
    description: 'Create a DEX for trading tokens on Kaspa L2 with features like liquidity pools, automated market making, and yield farming. This would support both KAS and dApp tokens.',
  },
  {
    title: 'Build Identity Verification dApp',
    description: 'Develop a decentralized identity verification system using zero-knowledge proofs. Users could verify their identity once and use it across multiple dApps without revealing personal information.',
  },
];

// Contract addresses (update these based on your deployment)
const CONTRACT_ADDRESSES = {
  'kasplex-l2-mainnet': {
    DAOVoting: process.env.DAO_VOTING_ADDRESS || '0x...', // Update with actual address
  },
  'kasplex-l2-testnet': {
    DAOVoting: process.env.DAO_VOTING_ADDRESS_TESTNET || '0x...', // Update with actual address
  },
};

// ABI for DAO Voting contract (simplified)
const DAO_VOTING_ABI = [
  'function submitProposal(string memory _title, string memory _description) external payable',
  'function submissionFee() external view returns (uint256)',
  'function proposalCount() external view returns (uint256)',
];

async function main() {
  // Get network from command line or default to testnet
  const network = process.argv.find(arg => arg.startsWith('--network'))?.split('=')[1] || 'kasplex-l2-testnet';
  
  // Get RPC URL
  const rpcUrl = network === 'kasplex-l2-mainnet'
    ? process.env.KASPLEX_L2_MAINNET_RPC || 'https://evmrpc.kasplex.org'
    : process.env.KASPLEX_L2_TESTNET_RPC || 'https://evmrpc-testnet.kasplex.org';

  // Get private key
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error('Error: PRIVATE_KEY environment variable is required');
    console.error('Set it in .env file or pass as environment variable');
    process.exit(1);
  }

  // Get contract address
  const contractAddress = CONTRACT_ADDRESSES[network]?.DAOVoting;
  if (!contractAddress || contractAddress === '0x...') {
    console.error(`Error: DAO Voting contract address not set for ${network}`);
    console.error('Update CONTRACT_ADDRESSES in this script or set DAO_VOTING_ADDRESS in .env');
    process.exit(1);
  }

  console.log(`\n🚀 Adding test proposals to DAO Voting contract`);
  console.log(`Network: ${network}`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`RPC: ${rpcUrl}\n`);

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  // Connect to contract
  const daoVoting = new ethers.Contract(contractAddress, DAO_VOTING_ABI, wallet);

  // Get submission fee
  const submissionFee = await daoVoting.submissionFee();
  console.log(`Submission fee: ${ethers.formatEther(submissionFee)} KAS\n`);

  // Get current proposal count
  const currentCount = await daoVoting.proposalCount();
  console.log(`Current proposal count: ${currentCount.toString()}\n`);

  // Submit each proposal
  for (let i = 0; i < TEST_PROPOSALS.length; i++) {
    const proposal = TEST_PROPOSALS[i];
    console.log(`[${i + 1}/${TEST_PROPOSALS.length}] Submitting: "${proposal.title}"`);
    
    try {
      const tx = await daoVoting.submitProposal(proposal.title, proposal.description, {
        value: submissionFee,
      });
      
      console.log(`  Transaction: ${tx.hash}`);
      console.log(`  Waiting for confirmation...`);
      
      const receipt = await tx.wait();
      console.log(`  ✅ Confirmed in block ${receipt.blockNumber}\n`);
      
      // Small delay between transactions
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      // Continue with next proposal
    }
  }

  // Get final proposal count
  const finalCount = await daoVoting.proposalCount();
  console.log(`\n✅ Complete! Final proposal count: ${finalCount.toString()}`);
  console.log(`Added ${Number(finalCount) - Number(currentCount)} proposals\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
