import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arbitration Policies',
  description: 'Configure trust thresholds, evidence mandates, phantom citation restrictions, and multi-factor scoring weights.',
};

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
