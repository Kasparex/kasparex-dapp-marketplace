/**
 * Test Ecosystem Contracts Page
 * Quick test page to verify frontend integration
 */

'use client';

import { useAccount, useChainId } from 'wagmi';
import { getContractAddress } from '@/lib/contracts/addresses';
import { TokenDisplay } from '@/components/dapps/TokenDisplay';
import { RewardsDisplay } from '@/components/dapps/RewardsDisplay';
import { ProofOfUtility } from '@/components/dapps/ProofOfUtility';
import { AffiliateWidget } from '@/components/dapps/AffiliateWidget';

export default function TestEcosystemPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  // Get contract addresses
  const gridTokenAddress = getContractAddress(chainId, 'GRIDToken');
  const proofOfUtilityAddress = getContractAddress(chainId, 'ProofOfUtility');
  const rewardManagerAddress = getContractAddress(chainId, 'RewardManager');
  const feeHandlerAddress = getContractAddress(chainId, 'FeeHandler');
  const affiliateManagerAddress = getContractAddress(chainId, 'AffiliateManager');
  const loyaltyPointsAddress = getContractAddress(chainId, 'LoyaltyPoints');
  const profileRegistryAddress = getContractAddress(chainId, 'ProfileRegistry');
  const userProfileDashboardAddress = getContractAddress(chainId, 'UserProfileDashboard');
  const adminDashboardAddress = getContractAddress(chainId, 'AdminDashboard');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Ecosystem Contracts Test
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Testing frontend integration with deployed ecosystem contracts
          </p>
        </div>

        {/* Connection Status */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Connection Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-zinc-700 dark:text-zinc-300">
                Wallet: {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {isConnected && address && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                {address}
              </div>
            )}
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Chain ID: {chainId}
            </div>
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Contract Addresses
          </h2>
          <div className="space-y-2 text-sm font-mono">
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">GRIDToken: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {gridTokenAddress || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">ProofOfUtility: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {proofOfUtilityAddress || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">RewardManager: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {rewardManagerAddress || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">FeeHandler: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {feeHandlerAddress || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">AffiliateManager: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {affiliateManagerAddress || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">LoyaltyPoints: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {loyaltyPointsAddress || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">ProfileRegistry: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {profileRegistryAddress || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">UserProfileDashboard: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {userProfileDashboardAddress || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">AdminDashboard: </span>
              <span className="text-zinc-900 dark:text-zinc-100">
                {adminDashboardAddress || 'Not found'}
              </span>
            </div>
          </div>
        </div>

        {/* GRID Token Rewards */}
        {gridTokenAddress && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <RewardsDisplay
              gridTokenAddress={gridTokenAddress}
            />
          </div>
        )}

        {/* Proof of Utility */}
        {proofOfUtilityAddress && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
            <ProofOfUtility
              proofOfUtilityAddress={proofOfUtilityAddress}
            />
          </div>
        )}

        {/* Affiliate Widget */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
          <AffiliateWidget
            dAppId="test-dapp-1"
            dAppName="Test dApp"
          />
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Testing Instructions
          </h3>
          <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200 text-sm">
            <li>Connect your wallet to Kasplex L2 Testnet (Chain ID: 167012)</li>
            <li>Check that all contract addresses are displayed correctly</li>
            <li>Verify GRID token balance shows (if you have any)</li>
            <li>Check Proof of Utility events (should be empty initially)</li>
            <li>Test the Affiliate Widget to generate referral links</li>
            <li>Navigate to a dApp detail page to see full integration</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


