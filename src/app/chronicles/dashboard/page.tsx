import { Metadata } from 'next';
import { ChroniclesVaultDashboard } from '@/components/chronicles/vault/ChroniclesVaultDashboard';

export const metadata: Metadata = {
  title: 'Vault · Krex\'s Chronicles',
  description: 'Wallet-gated unlocks, premium lore, and gear placeholders for Krex\'s Chronicles.',
};

export default function ChroniclesDashboardPage() {
  return <ChroniclesVaultDashboard />;
}
