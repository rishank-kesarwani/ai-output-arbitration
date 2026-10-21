import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://ai-output-arbitration.vercel.app',
  ),
  title: {
    default: 'AI Output Arbitration & Trust Layer',
    template: '%s | AI Output Arbitration',
  },
  description:
    'Evidence-aware AI response arbitration, deterministic validation, citation checking, calibrated abstention, and human review engine.',
  applicationName: 'AI Output Arbitration',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AI Output Arbitration',
    title: 'AI Output Arbitration & Trust Layer',
    description:
      'Evidence-aware AI response arbitration, deterministic validation, citation checking, and human review engine.',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'AI Output Arbitration Trust Layer Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'AI Output Arbitration & Trust Layer',
    description:
      'Evidence-aware AI response arbitration and calibrated abstention engine.',
    images: ['/icon-512.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#020617',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white flex flex-col justify-between">
        <div className="flex-1">
          <Navbar />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
