'use client';

import { useState, useEffect } from 'react';
import { 
  useUpdateDistributionPercentages, 
  useTreasuryPercentages,
  useUpdateDistributionAddresses,
  useTreasuryAddresses,
  useTreasuryBalance
} from '@/lib/contracts/treasury';
import { 
  useUpdateKasparexFee,
  useKasparexFee,
  useUpdateSubscriptionPlan,
  useSubscriptionPlan
} from '@/lib/contracts/subscription';
import { getAllDApps, DApp } from '@/lib/dapps';
import { isAddress, formatEther, parseEther } from 'viem';

export function FeeManagement() {
  // Global fee state
  const [treasuryPercent, setTreasuryPercent] = useState<string>('');
  const [developerPercent, setDeveloperPercent] = useState<string>('');
  const [builderPercent, setBuilderPercent] = useState<string>('');
  const [kasparexFeePercent, setKasparexFeePercent] = useState<string>('');
  const [developerAddress, setDeveloperAddress] = useState<string>('');
  const [builderAddress, setBuilderAddress] = useState<string>('');

  // Per-dApp fee state
  const [selectedDApp, setSelectedDApp] = useState<DApp | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState<string>('');
  const [quarterlyPrice, setQuarterlyPrice] = useState<string>('');
  const [yearlyPrice, setYearlyPrice] = useState<string>('');

  // Hooks for global fees
  const { treasuryPercentage, developerPercentage, builderPercentage, isLoading: isLoadingPercentages } = useTreasuryPercentages();
  const { developerAddress: currentDevAddress, builderAddress: currentBuilderAddress, isLoading: isLoadingAddresses } = useTreasuryAddresses();
  const { feePercentage: currentKasparexFee, isLoading: isLoadingKasparexFee } = useKasparexFee();
  const { balance: treasuryBalance } = useTreasuryBalance();
  
  const { updatePercentages, isPending: isUpdatingPercentages, isConfirmed: isPercentagesUpdated } = useUpdateDistributionPercentages();
  const { updateAddresses, isPending: isUpdatingAddresses, isConfirmed: isAddressesUpdated } = useUpdateDistributionAddresses();
  const { updateFee, isPending: isUpdatingFee, isConfirmed: isFeeUpdated } = useUpdateKasparexFee();

  // Hooks for per-dApp fees
  const { plan, isLoading: isLoadingPlan } = useSubscriptionPlan(selectedDApp?.contractAddress);
  const { updatePlan, isPending: isUpdatingPlan, isConfirmed: isPlanUpdated } = useUpdateSubscriptionPlan();

  // Load current values
  useEffect(() => {
    if (treasuryPercentage !== undefined) setTreasuryPercent(treasuryPercentage.toFixed(2));
    if (developerPercentage !== undefined) setDeveloperPercent(developerPercentage.toFixed(2));
    if (builderPercentage !== undefined) setBuilderPercent(builderPercentage.toFixed(2));
  }, [treasuryPercentage, developerPercentage, builderPercentage]);

  useEffect(() => {
    if (currentKasparexFee !== undefined) setKasparexFeePercent(currentKasparexFee.toFixed(2));
  }, [currentKasparexFee]);

  useEffect(() => {
    if (currentDevAddress) setDeveloperAddress(currentDevAddress);
    if (currentBuilderAddress) setBuilderAddress(currentBuilderAddress);
  }, [currentDevAddress, currentBuilderAddress]);

  useEffect(() => {
    if (plan) {
      setMonthlyPrice(formatEther(plan.monthlyPrice));
      setQuarterlyPrice(formatEther(plan.quarterlyPrice));
      setYearlyPrice(formatEther(plan.yearlyPrice));
    } else if (selectedDApp && !isLoadingPlan) {
      // Reset if no plan exists
      setMonthlyPrice('');
      setQuarterlyPrice('');
      setYearlyPrice('');
    }
  }, [plan, selectedDApp, isLoadingPlan]);

  // Reset on success
  useEffect(() => {
    if (isPercentagesUpdated || isAddressesUpdated || isFeeUpdated || isPlanUpdated) {
      // Values will refresh automatically via hooks
    }
  }, [isPercentagesUpdated, isAddressesUpdated, isFeeUpdated, isPlanUpdated]);

  const allDApps = getAllDApps();
  const filteredDApps = searchQuery
    ? allDApps.filter(dapp => 
        dapp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (dapp.contractAddress && dapp.contractAddress.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  const handleUpdatePercentages = () => {
    const treasury = parseFloat(treasuryPercent);
    const developer = parseFloat(developerPercent);
    const builder = parseFloat(builderPercent);
    
    if (isNaN(treasury) || isNaN(developer) || isNaN(builder)) {
      alert('Please enter valid percentages');
      return;
    }
    
    if (Math.abs(treasury + developer + builder - 100) > 0.01) {
      alert('Percentages must sum to 100%');
      return;
    }

    updatePercentages(treasury, developer, builder);
  };

  const handleUpdateAddresses = () => {
    if (!isAddress(developerAddress) || !isAddress(builderAddress)) {
      alert('Please enter valid addresses');
      return;
    }
    updateAddresses(developerAddress, builderAddress);
  };

  const handleUpdateKasparexFee = () => {
    const fee = parseFloat(kasparexFeePercent);
    if (isNaN(fee) || fee < 0 || fee > 100) {
      alert('Please enter a valid fee percentage (0-100)');
      return;
    }
    updateFee(fee);
  };

  const handleUpdatePlan = () => {
    if (!selectedDApp?.contractAddress) {
      alert('Please select a dApp');
      return;
    }
    if (!monthlyPrice || !quarterlyPrice || !yearlyPrice) {
      alert('Please enter all prices');
      return;
    }

    const isUpdate = !!plan;
    updatePlan(selectedDApp.contractAddress, monthlyPrice, quarterlyPrice, yearlyPrice, isUpdate);
  };

  const percentagesSum = parseFloat(treasuryPercent || '0') + parseFloat(developerPercent || '0') + parseFloat(builderPercent || '0');
  const percentagesValid = Math.abs(percentagesSum - 100) < 0.01;

  return (
    <div className="space-y-6">
      {/* Global Fee Settings */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
          Global Fee Settings
        </h2>

        {/* Treasury Distribution Percentages */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Treasury Distribution Percentages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Treasury %
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={treasuryPercent}
                onChange={(e) => setTreasuryPercent(e.target.value)}
                disabled={isLoadingPercentages}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Developer %
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={developerPercent}
                onChange={(e) => setDeveloperPercent(e.target.value)}
                disabled={isLoadingPercentages}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Builder %
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={builderPercent}
                onChange={(e) => setBuilderPercent(e.target.value)}
                disabled={isLoadingPercentages}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>
          <div className="mb-4">
            <div className={`text-sm ${percentagesValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              Total: {percentagesSum.toFixed(2)}% {percentagesValid ? '✓' : '(Must equal 100%)'}
            </div>
          </div>
          <button
            onClick={handleUpdatePercentages}
            disabled={!percentagesValid || isUpdatingPercentages || isLoadingPercentages}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              percentagesValid && !isUpdatingPercentages && !isLoadingPercentages
                ? 'bg-[#02abb8] text-white hover:bg-[#0299a6]'
                : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isUpdatingPercentages ? 'Updating...' : 'Update Distribution Percentages'}
          </button>
          {isPercentagesUpdated && (
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ Percentages updated successfully!
            </div>
          )}
        </div>

        {/* Distribution Addresses */}
        <div className="mb-6 border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Distribution Addresses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Developer Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={developerAddress}
                onChange={(e) => setDeveloperAddress(e.target.value)}
                disabled={isLoadingAddresses}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
                  developerAddress && !isAddress(developerAddress)
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Builder Address
              </label>
              <input
                type="text"
                placeholder="0x..."
                value={builderAddress}
                onChange={(e) => setBuilderAddress(e.target.value)}
                disabled={isLoadingAddresses}
                className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 ${
                  builderAddress && !isAddress(builderAddress)
                    ? 'border-red-300 dark:border-red-700'
                    : 'border-zinc-300 dark:border-zinc-700'
                }`}
              />
            </div>
          </div>
          <button
            onClick={handleUpdateAddresses}
            disabled={!isAddress(developerAddress) || !isAddress(builderAddress) || isUpdatingAddresses || isLoadingAddresses}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isAddress(developerAddress) && isAddress(builderAddress) && !isUpdatingAddresses && !isLoadingAddresses
                ? 'bg-[#02abb8] text-white hover:bg-[#0299a6]'
                : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isUpdatingAddresses ? 'Updating...' : 'Update Distribution Addresses'}
          </button>
          {isAddressesUpdated && (
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ Addresses updated successfully!
            </div>
          )}
        </div>

        {/* Kasparex Fee Percentage */}
        <div className="mb-6 border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
            Kasparex Fee Percentage (for dApp Subscriptions)
          </h3>
          <div className="max-w-xs mb-4">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Fee Percentage (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={kasparexFeePercent}
              onChange={(e) => setKasparexFeePercent(e.target.value)}
              disabled={isLoadingKasparexFee}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            />
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              This percentage is taken from subscription payments before sending to developers
            </div>
          </div>
          <button
            onClick={handleUpdateKasparexFee}
            disabled={!kasparexFeePercent || isUpdatingFee || isLoadingKasparexFee}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              kasparexFeePercent && !isUpdatingFee && !isLoadingKasparexFee
                ? 'bg-[#02abb8] text-white hover:bg-[#0299a6]'
                : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
            }`}
          >
            {isUpdatingFee ? 'Updating...' : 'Update Kasparex Fee'}
          </button>
          {isFeeUpdated && (
            <div className="mt-2 text-sm text-green-600 dark:text-green-400">
              ✓ Fee updated successfully!
            </div>
          )}
        </div>

        {/* Treasury Balance */}
        {treasuryBalance !== undefined && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
              Treasury Balance
            </h3>
            <div className="text-2xl font-bold text-[#02abb8]">
              {formatEther(treasuryBalance)} KAS
            </div>
          </div>
        )}
      </div>

      {/* Per-dApp Fee Settings */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-6">
          Per-dApp Subscription Fees
        </h2>

        {/* dApp Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Search and Select dApp
          </label>
          <div className="k-search-container h-10 mb-3 overflow-visible">
            <input
              type="text"
              placeholder="Search dApps by name or contract address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`k-search-input h-10 w-full ${searchQuery.length > 0 ? 'is-typing' : ''}`.trim()}
            />
          </div>
          
          {searchQuery && (
            <div className="max-h-60 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg">
              {filteredDApps.length > 0 ? (
                filteredDApps
                  .filter(dapp => dapp.contractAddress)
                  .map((dapp) => (
                    <button
                      key={dapp.id}
                      onClick={() => setSelectedDApp(dapp)}
                      className={`w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 transition-colors ${
                        selectedDApp?.id === dapp.id
                          ? 'bg-[#02abb8]/10 border-[#02abb8]'
                          : ''
                      }`}
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{dapp.name}</div>
                      <div className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                        {dapp.contractAddress}
                      </div>
                    </button>
                  ))
              ) : (
                <div className="px-4 py-3 text-zinc-500 dark:text-zinc-400 text-sm">
                  No dApps with contract addresses found
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
                  <div className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                    {selectedDApp.contractAddress}
                  </div>
                  {plan && (
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                      ✓ Subscription plan exists
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedDApp(null);
                    setMonthlyPrice('');
                    setQuarterlyPrice('');
                    setYearlyPrice('');
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

        {/* Subscription Prices */}
        {selectedDApp && selectedDApp.contractAddress && (
          <div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-4">
              {plan ? 'Update' : 'Create'} Subscription Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Monthly Price (KAS)
                </label>
                <input
                  type="number"
                  step="0.000000000000000001"
                  min="0"
                  value={monthlyPrice}
                  onChange={(e) => setMonthlyPrice(e.target.value)}
                  disabled={isLoadingPlan}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Quarterly Price (KAS)
                </label>
                <input
                  type="number"
                  step="0.000000000000000001"
                  min="0"
                  value={quarterlyPrice}
                  onChange={(e) => setQuarterlyPrice(e.target.value)}
                  disabled={isLoadingPlan}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Yearly Price (KAS)
                </label>
                <input
                  type="number"
                  step="0.000000000000000001"
                  min="0"
                  value={yearlyPrice}
                  onChange={(e) => setYearlyPrice(e.target.value)}
                  disabled={isLoadingPlan}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <button
              onClick={handleUpdatePlan}
              disabled={!monthlyPrice || !quarterlyPrice || !yearlyPrice || isUpdatingPlan || isLoadingPlan}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                monthlyPrice && quarterlyPrice && yearlyPrice && !isUpdatingPlan && !isLoadingPlan
                  ? 'bg-[#02abb8] text-white hover:bg-[#0299a6]'
                  : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed'
              }`}
            >
              {isUpdatingPlan ? 'Updating...' : plan ? 'Update Plan' : 'Create Plan'}
            </button>
            {isPlanUpdated && (
              <div className="mt-2 text-sm text-green-600 dark:text-green-400">
                ✓ Subscription plan {plan ? 'updated' : 'created'} successfully!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

