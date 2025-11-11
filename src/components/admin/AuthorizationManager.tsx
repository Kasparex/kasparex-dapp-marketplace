'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAssignDeveloper, useRevokeDeveloper, useDAppDevelopers, getAuthorizationRegistryAddress } from '@/lib/contracts/authorization';
import { getAllDApps, DApp } from '@/lib/dapps';
import { isAddress } from 'viem';
import { useAccount, useChainId } from 'wagmi';
import { useSafeError } from '@/hooks/useSafeError';
import { getErrorMessage } from '@/lib/utils';

export function AuthorizationManager() {
  const [selectedDApp, setSelectedDApp] = useState<DApp | null>(null);
  const [developerAddress, setDeveloperAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dAppId, setDAppId] = useState<number | null>(null);
  const { address } = useAccount();
  
  const allDApps = getAllDApps();
  const filteredDApps = searchQuery
    ? allDApps.filter(dapp => 
        dapp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dapp.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allDApps;

  const chainId = useChainId();
  const contractAddress = getAuthorizationRegistryAddress(chainId);
  
  const { assignDeveloper, isPending: isAssigning, isConfirmed: isAssigned, error: assignError, hash: assignHash } = useAssignDeveloper();
  const { revokeDeveloper, isPending: isRevoking, isConfirmed: isRevoked, error: revokeError } = useRevokeDeveloper();
  
  // Safely convert errors to strings immediately to prevent React serialization issues
  const safeAssignError = useSafeError(assignError);
  const safeRevokeError = useSafeError(revokeError);
  const { developers, isLoading: isLoadingDevelopers } = useDAppDevelopers(dAppId || undefined);

  // Reset form after successful assignment/revocation
  useEffect(() => {
    if (isAssigned || isRevoked) {
      setDeveloperAddress('');
      // Refresh developers list would happen automatically via the hook
    }
  }, [isAssigned, isRevoked]);

  const handleSelectDApp = (dapp: DApp) => {
    setSelectedDApp(dapp);
    // Try to parse dApp ID - if it's numeric, use it directly
    const parsedId = parseInt(dapp.id, 10);
    if (!isNaN(parsedId)) {
      setDAppId(parsedId);
    } else {
      // For non-numeric IDs, we'd need to map them or use contract address lookup
      // For now, show a message
      setDAppId(null);
    }
  };

  const handleAssign = async () => {
    if (!dAppId || !developerAddress || !isAddress(developerAddress)) {
      console.error('Invalid input:', { dAppId, developerAddress });
      return;
    }
    
    try {
      console.log('Assigning developer:', { dAppId, developerAddress });
      await assignDeveloper(dAppId, developerAddress);
    } catch (error) {
      // Error is already converted to string in the hook
      const errorMsg = getErrorMessage(error, 'Failed to assign developer');
      console.error('Error assigning developer:', errorMsg);
      // The error will be displayed via safeAssignError from the hook
    }
  };

  const handleRevoke = (devAddress: string) => {
    if (!dAppId) {
      return;
    }
    revokeDeveloper(dAppId, devAddress);
  };

  const isValidAddress = developerAddress && isAddress(developerAddress);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
          Assign Developer to dApp
        </h2>

        {/* dApp Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Search and Select dApp
          </label>
          <input
            type="text"
            placeholder="Search dApps by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 mb-3"
          />
          
          {searchQuery && (
            <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
              {filteredDApps.length > 0 ? (
                filteredDApps.map((dapp) => (
                  <button
                    key={dapp.id}
                    onClick={() => handleSelectDApp(dapp)}
                    className={`w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 transition-colors ${
                      selectedDApp?.id === dapp.id
                        ? 'bg-[#02abb8]/10 border-[#02abb8]'
                        : ''
                    }`}
                  >
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{dapp.name}</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      ID: {dapp.id} • {dapp.category}
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-sm">
                  No dApps found
                </div>
              )}
            </div>
          )}

          {selectedDApp && (
            <div className="mt-4 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {selectedDApp.name}
                  </div>
                  <div className="text-sm text-zinc-500 dark:text-zinc-400">
                    ID: {selectedDApp.id} • {selectedDApp.category}
                  </div>
                  {!dAppId && (
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                      ⚠️ dApp ID is not numeric. Please ensure the dApp is registered on-chain.
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDApp(null);
                    setDAppId(null);
                    setSearchQuery('');
                  }}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Developer Address Input */}
        {selectedDApp && dAppId && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Developer Wallet Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={developerAddress}
              onChange={(e) => setDeveloperAddress(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
                developerAddress && !isValidAddress
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-zinc-300 dark:border-zinc-700'
              }`}
            />
            {developerAddress && !isValidAddress && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                Invalid wallet address format
              </p>
            )}
          </div>
        )}

        {/* Contract Address Warning */}
        {!contractAddress && (
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
            ⚠️ <strong>AuthorizationRegistry contract not deployed</strong> on this network (Chain ID: {chainId}). 
            Please deploy the contract or set the <code>NEXT_PUBLIC_AUTHORIZATION_REGISTRY_ADDRESS</code> environment variable.
          </div>
        )}

        {/* Assign Button */}
        {selectedDApp && dAppId && (
          <div className="flex gap-3">
            <button
              onClick={handleAssign}
              disabled={!isValidAddress || isAssigning || isRevoking || !contractAddress}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isValidAddress && !isAssigning && !isRevoking && contractAddress
                  ? 'bg-[#02abb8] text-white hover:bg-[#0299a6]'
                  : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isAssigning ? 'Assigning...' : !contractAddress ? 'Contract Not Deployed' : 'Assign Developer'}
            </button>
          </div>
        )}

        {/* Status Messages */}
        {safeAssignError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            <strong>Error:</strong> {safeAssignError}
          </div>
        )}
        {isAssigning && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            ⏳ Transaction pending... Please confirm in your wallet.
          </div>
        )}
        {assignHash && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
            📝 Transaction submitted: <code className="text-xs">{assignHash}</code>
          </div>
        )}
        {isAssigned && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
            ✓ Developer assigned successfully! Transaction confirmed.
          </div>
        )}
        {safeRevokeError && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            Error: {safeRevokeError}
          </div>
        )}
        {isRevoked && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
            ✓ Developer revoked successfully!
          </div>
        )}
      </div>

      {/* Current Developers List */}
      {selectedDApp && dAppId && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Current Developers for {selectedDApp.name}
          </h3>
          
          {isLoadingDevelopers ? (
            <div className="text-zinc-500 dark:text-zinc-400">Loading...</div>
          ) : developers && developers.length > 0 ? (
            <div className="space-y-2">
              {developers.map((dev, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                >
                  <div>
                    <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100">
                      {dev}
                    </div>
                    {dev.toLowerCase() === address?.toLowerCase() && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        (You)
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRevoke(dev)}
                    disabled={isRevoking || isAssigning}
                    className="px-4 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isRevoking ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-500 dark:text-zinc-400 text-sm">
              No developers assigned yet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

