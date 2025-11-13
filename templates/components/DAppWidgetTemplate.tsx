'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { formatEther } from 'viem';
// TODO: Import your contract ABI
import { {{CONTRACT_NAME}}_ABI } from '@/lib/contracts/abis';
import { getContractAddress } from '@/lib/contracts/addresses';
// TODO: Import your custom hook
import { use{{HookName}}, {{ItemInterface}} } from '@/hooks/use{{HookName}}';

export function {{WidgetName}}() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  // TODO: Add your component state
  const [showForm, setShowForm] = useState(false);
  // const [formField1, setFormField1] = useState('');
  // const [formField2, setFormField2] = useState('');

  const contractAddress = getContractAddress(chainId, '{{CONTRACT_NAME}}');

  // TODO: Use your custom hook
  const {
    items,
    isLoading,
    error,
    // TODO: Add your hook functions
    // createItem,
    // updateItem,
    refreshItems,
    // TODO: Add your hook state variables
    // itemCount,
    // fee,
  } = use{{HookName}}();

  // TODO: Add your handler functions
  // const handleCreateItem = async () => {
  //   if (!formField1.trim() || !formField2) {
  //     alert('Please fill in all fields');
  //     return;
  //   }
  // 
  //   try {
  //     await createItem(formField1.trim(), BigInt(formField2));
  //     setFormField1('');
  //     setFormField2('');
  //     setShowForm(false);
  //     setTimeout(() => {
  //       refreshItems();
  //     }, 3000);
  //   } catch (err) {
  //     console.error('Error creating item:', err);
  //   }
  // };

  // TODO: Add your helper functions
  // const formatDate = (timestamp: bigint) => {
  //   const date = new Date(Number(timestamp) * 1000);
  //   return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  // };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Check wallet connection
  if (!isConnected) {
    return (
      <div className="px-6 py-4 text-center">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          Please connect your wallet to use {{DAPP_NAME}}
        </p>
      </div>
    );
  }

  // Check contract availability
  if (!contractAddress) {
    return (
      <div className="px-6 py-4 text-center">
        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
          {{CONTRACT_NAME}} contract not deployed on this network
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-6">
      {/* Header - Mobile responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{{DAPP_NAME}}</h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {{DAPP_DESCRIPTION}}
          </p>
        </div>
        {/* TODO: Add action button if needed */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a6] transition-colors whitespace-nowrap"
        >
          {showForm ? 'Cancel' : '{{ACTION_BUTTON_TEXT}}'}
        </button>
      </div>

      {/* TODO: Add fee info if applicable */}
      {/* {fee && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-zinc-600 dark:text-zinc-400">Fee:</span>
              <span className="ml-2 font-semibold text-zinc-900 dark:text-zinc-100">
                {formatEther(fee)} KAS
              </span>
            </div>
          </div>
        </div>
      )} */}

      {/* TODO: Add form if needed */}
      {/* {showForm && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
            Create New Item
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Field 1 (max 200 characters)
              </label>
              <input
                type="text"
                value={formField1}
                onChange={(e) => setFormField1(e.target.value)}
                maxLength={200}
                placeholder="Enter field 1"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#02abb8] focus:border-transparent"
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {formField1.length}/200 characters
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Field 2
              </label>
              <input
                type="number"
                value={formField2}
                onChange={(e) => setFormField2(e.target.value)}
                placeholder="Enter field 2"
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#02abb8] focus:border-transparent"
              />
            </div>
            {fee && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Fee: {formatEther(fee)} KAS
                </p>
              </div>
            )}
            <button
              onClick={handleCreateItem}
              disabled={isLoading || !formField1.trim() || !formField2}
              className="w-full px-4 py-2 bg-[#02abb8] text-white rounded-lg hover:bg-[#0299a6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Processing...' : `Create Item (${fee ? formatEther(fee) : '0'} KAS)`}
            </button>
          </div>
        </div>
      )} */}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Items List - Mobile responsive */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Items {/* TODO: Add count if available */}
            {/* {itemCount !== null && `(${itemCount.toString()})`} */}
          </h3>
          <button
            onClick={refreshItems}
            disabled={isLoading}
            className="px-3 py-1 text-sm bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            Refresh
          </button>
        </div>

        {isLoading && items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 dark:text-zinc-400">Loading items...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-zinc-600 dark:text-zinc-400">No items yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {items
              .slice()
              .reverse() // Show newest first
              .map((item) => (
                <div
                  key={item.id.toString()}
                  className="p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800"
                >
                  {/* TODO: Customize item display */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                        Item #{item.id.toString()}
                      </h4>
                      {/* TODO: Display your item fields */}
                      {/* <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        {item.field1}
                      </p> */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                        <span>User: {formatAddress(item.id.toString())}</span>
                        {/* TODO: Add timestamp if available */}
                        {/* <span>Created: {formatDate(item.timestamp)}</span> */}
                      </div>
                    </div>
                  </div>

                  {/* TODO: Add action buttons if needed */}
                  {/* <div className="flex flex-col sm:flex-row gap-2 mt-4">
                    <button
                      onClick={() => handleAction(item.id)}
                      disabled={isLoading || !item.isActive}
                      className="flex-1 px-4 py-2 rounded-lg font-medium transition-colors bg-[#02abb8] text-white hover:bg-[#0299a6] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Action
                    </button>
                  </div> */}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

