'use client';

import { useState, useMemo } from 'react';
import type { RewardItem } from '@/lib/rewards/dashboard-data';
import { formatLargeNumber } from '@/lib/rewards/calculator';

interface RewardsTableProps {
  rewards: RewardItem[];
  searchQuery?: string;
  userStatus?: {
    krexTier: string;
  };
}

type SortField = 'name' | 'requirement' | 'multiplier' | 'feeReduction' | 'points' | 'status';
type SortDirection = 'asc' | 'desc';

export function RewardsTable({ rewards, searchQuery = '', userStatus }: RewardsTableProps) {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter by search query
  const filteredRewards = useMemo(() => {
    if (!searchQuery.trim()) return rewards;

    const query = searchQuery.toLowerCase().trim();
    return rewards.filter((reward) => {
      const searchableText = [
        reward.name,
        reward.description,
        reward.requirement,
        ...reward.benefits,
        reward.userStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [rewards, searchQuery]);

  // Sort rewards
  const sortedRewards = useMemo(() => {
    const sorted = [...filteredRewards];

    sorted.sort((a, b) => {
      let aValue: string | number | undefined;
      let bValue: string | number | undefined;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'requirement':
          aValue = a.requirement.toLowerCase();
          bValue = b.requirement.toLowerCase();
          break;
        case 'multiplier':
          aValue = a.multiplier ?? 0;
          bValue = b.multiplier ?? 0;
          break;
        case 'feeReduction':
          aValue = a.feeReduction ?? 0;
          bValue = b.feeReduction ?? 0;
          break;
        case 'points':
          aValue = a.points ?? 0;
          bValue = b.points ?? 0;
          break;
        case 'status':
          aValue = a.isUnlocked ? 1 : 0;
          bValue = b.isUnlocked ? 1 : 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [filteredRewards, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getTypeIcon = (type: RewardItem['type']) => {
    switch (type) {
      case 'krex-tier':
        return '💎';
      case 'nft':
        return '🖼️';
      case 'node':
        return '🖥️';
      case 'premium':
        return '⭐';
      default:
        return '';
    }
  };

  const getTypeLabel = (type: RewardItem['type']) => {
    switch (type) {
      case 'krex-tier':
        return 'KREX Tier';
      case 'nft':
        return 'NFT';
      case 'node':
        return 'Node';
      case 'premium':
        return 'Premium';
      default:
        return type;
    }
  };

  if (sortedRewards.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
        <p>No rewards found matching your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-700">
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                Reward Type
                <SortIcon field="name" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => handleSort('requirement')}
            >
              <div className="flex items-center gap-2">
                Requirement
                <SortIcon field="requirement" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => handleSort('multiplier')}
            >
              <div className="flex items-center gap-2">
                Multiplier
                <SortIcon field="multiplier" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => handleSort('feeReduction')}
            >
              <div className="flex items-center gap-2">
                Fee Reduction
                <SortIcon field="feeReduction" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => handleSort('points')}
            >
              <div className="flex items-center gap-2">
                Points
                <SortIcon field="points" />
              </div>
            </th>
            <th
              className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              onClick={() => handleSort('status')}
            >
              <div className="flex items-center gap-2">
                Status
                <SortIcon field="status" />
              </div>
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Benefits
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedRewards.map((reward) => {
            const isHighlighted = reward.isUnlocked || reward.userStatus === 'Current Tier';
            
            return (
              <tr
                key={reward.id}
                className={`border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                  isHighlighted ? 'bg-[#02abb8]/10 dark:bg-[#02abb8]/20' : ''
                }`}
              >
                <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                  <div className="flex items-center gap-2">
                    <span>{getTypeIcon(reward.type)}</span>
                    <div>
                      <div className="font-medium">{reward.name}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {getTypeLabel(reward.type)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {reward.requirement}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100">
                  {reward.multiplier ? (
                    <span className="font-medium">{reward.multiplier}x</span>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                  {reward.feeReduction !== undefined ? (
                    reward.feeReduction === 100 ? (
                      <span className="text-green-600 dark:text-green-400 font-medium">Zero Fee</span>
                    ) : (
                      <span>-{reward.feeReduction}%</span>
                    )
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-900 dark:text-zinc-100 font-medium">
                  {reward.points !== undefined ? (
                    <span>{reward.points} {reward.points === 1 ? 'point' : 'points'}</span>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
                <td className="py-3 px-4 text-sm">
                  {reward.isUnlocked ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      ✓ Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      Locked
                    </span>
                  )}
                  {reward.userStatus && (
                    <div className="mt-1 text-xs text-[#02abb8] font-medium">
                      {reward.userStatus}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-600 dark:text-zinc-400">
                  <ul className="list-disc list-inside space-y-1">
                    {reward.benefits.map((benefit, index) => (
                      <li key={index} className="text-xs">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
