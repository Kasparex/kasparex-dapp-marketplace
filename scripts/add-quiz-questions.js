/**
 * Script to add sample questions to QuizToEarn contract
 * 
 * Usage:
 *   npx hardhat run scripts/add-quiz-questions.js --network kasplexL2Testnet
 */

const hre = require('hardhat');

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log('\n📝 Adding Questions to QuizToEarn Contract...\n');
  console.log('Using account:', deployer.address);
  console.log('Account balance:', hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), 'KAS\n');

  const contractAddress = process.env.QUIZ_TO_EARN_ADDRESS || '0x7EF3E5215c722D7A3D41C2426e57b1B4A5bC4a05';
  console.log('Contract Address:', contractAddress);

  const QuizToEarn = await hre.ethers.getContractFactory('QuizToEarn');
  const quizToEarn = QuizToEarn.attach(contractAddress);

  // Sample questions about Kaspa and blockchain
  const questions = [
    {
      questionText: "What is Kaspa's consensus mechanism?",
      options: ["Proof of Work", "Proof of Stake", "Proof of Authority", "Delegated Proof of Stake"],
      correctAnswerIndex: 0,
      category: "Kaspa",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What makes Kaspa unique compared to Bitcoin?",
      options: ["Faster block times", "BlockDAG structure", "Lower fees", "All of the above"],
      correctAnswerIndex: 3,
      category: "Kaspa",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What is a BlockDAG?",
      options: ["A single chain of blocks", "A directed acyclic graph of blocks", "A tree structure", "A circular chain"],
      correctAnswerIndex: 1,
      category: "BlockDAG",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What is the native token of Kaspa?",
      options: ["KAS", "KSP", "KASPA", "KASX"],
      correctAnswerIndex: 0,
      category: "Kaspa",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What is the approximate block time of Kaspa?",
      options: ["1 second", "10 seconds", "1 minute", "10 minutes"],
      correctAnswerIndex: 0,
      category: "Kaspa",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What does EVM stand for?",
      options: ["Ethereum Virtual Machine", "Ethereum Value Machine", "Ethereum Verification Machine", "Ethereum Volume Machine"],
      correctAnswerIndex: 0,
      category: "General",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What is a smart contract?",
      options: ["A legal document", "Self-executing code on blockchain", "A type of cryptocurrency", "A mining algorithm"],
      correctAnswerIndex: 1,
      category: "General",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What is the main advantage of Layer 2 solutions?",
      options: ["Higher security", "Lower transaction costs", "More decentralization", "Larger block size"],
      correctAnswerIndex: 1,
      category: "General",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What is Proof-of-Utility?",
      options: ["A consensus mechanism", "A reward system based on usage", "A mining algorithm", "A staking mechanism"],
      correctAnswerIndex: 1,
      category: "General",
      rewardAmount: hre.ethers.parseEther('0.01')
    },
    {
      questionText: "What is Kaspa's main innovation?",
      options: ["Faster transactions", "BlockDAG architecture", "Lower fees", "Better privacy"],
      correctAnswerIndex: 1,
      category: "Kaspa",
      rewardAmount: hre.ethers.parseEther('0.01')
    }
  ];

  console.log(`Adding ${questions.length} questions...\n`);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    try {
      console.log(`${i + 1}. Adding: "${q.questionText}"`);
      const tx = await quizToEarn.addQuestion(
        q.questionText,
        q.options,
        q.correctAnswerIndex,
        q.category,
        q.rewardAmount
      );
      await tx.wait();
      console.log(`   ✅ Question ${i + 1} added successfully\n`);
    } catch (error) {
      console.error(`   ❌ Failed to add question ${i + 1}:`, error.message);
      if (error.message.includes('onlyOwner')) {
        console.error('   ⚠️  Make sure you are using the deployer account');
        break;
      }
    }
  }

  // Get question count
  const questionCount = await quizToEarn.questionCount();
  console.log(`\n✅ Total questions in contract: ${questionCount.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

