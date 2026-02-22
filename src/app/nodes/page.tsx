import { Metadata } from 'next';
import { NodesDashboardContent } from '@/components/nodes/NodesDashboardContent';

export const metadata: Metadata = {
  title: 'Kasparex Nodes – User Dashboard',
  description: 'Manage your KREX node: connect, monitor status, and track incentives.',
};

export default function NodesDashboardPage() {
  return <NodesDashboardContent />;
}
