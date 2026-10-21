import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Human Review Queue',
  description: 'Adjudicate conflicting AI outputs, contradictory assertions, and missing-evidence escalations.',
};

export default function QueueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
