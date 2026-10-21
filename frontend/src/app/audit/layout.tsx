import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Decision Audit Explorer',
  description: 'Tamper-evident cryptographic ledger of all arbitration evaluations, checks performed, and chosen outcomes.',
};

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
