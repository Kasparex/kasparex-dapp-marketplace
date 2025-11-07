'use client';

import { useState } from 'react';
import { AuthorizationManager } from './AuthorizationManager';
import { FeeManagement } from './FeeManagement';

type AdminTab = 'overview' | 'authorization' | 'fees';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const tabs: { id: AdminTab; label: string; icon: string; description: string }[] = [
    { 
      id: 'overview', 
      label: 'Overview', 
      icon: '📊',
      description: 'Dashboard statistics and quick actions'
    },
    { 
      id: 'authorization', 
      label: 'Developer Authorization', 
      icon: '👥',
      description: 'Assign developers to dApps'
    },
    { 
      id: 'fees', 
      label: 'Fee Management', 
      icon: '💰',
      description: 'Manage global and per-dApp fees'
    },
  ];

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#02abb8] text-[#02abb8]'
                  : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-800 p-6">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Admin Dashboard Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Quick Actions</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    <button
                      onClick={() => setActiveTab('authorization')}
                      className="text-[#02abb8] hover:underline"
                    >
                      Assign Developers →
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Fee Management</div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                    <button
                      onClick={() => setActiveTab('fees')}
                      className="text-[#02abb8] hover:underline"
                    >
                      Configure Fees →
                    </button>
                  </div>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">Security</div>
                  <div className="text-sm text-zinc-900 dark:text-zinc-100">
                    Admin-only access enabled
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-xl mr-3">⚠️</div>
                <div>
                  <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
                    Admin Access Warning
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You have full administrative access. All actions are recorded on-chain and require transaction confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'authorization' && <AuthorizationManager />}
        {activeTab === 'fees' && <FeeManagement />}
      </div>
    </div>
  );
}

