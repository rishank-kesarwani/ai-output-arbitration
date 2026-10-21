'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Scale,
  Inbox,
  FileText,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Globe,
  Lock,
} from 'lucide-react';
import { isPublicAccessEnabled } from '../lib/api-client';

interface NavbarProps {
  pendingReviewCount?: number;
}

export function Navbar({ pendingReviewCount = 0 }: NavbarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Trust Console', href: '/', icon: Scale },
    {
      name: 'Review Queue',
      href: '/queue',
      icon: Inbox,
      badge: pendingReviewCount > 0 ? pendingReviewCount : undefined,
    },
    { name: 'Decision Audit', href: '/audit', icon: FileText },
    { name: 'Policies', href: '/policies', icon: Sliders },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <Link href="/" className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-white">
                  AI Output Arbitration
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30">
                  Trust Layer
                </span>
              </Link>
              <p className="text-xs text-slate-400 hidden sm:block">
                Evidence-Aware Verification & Calibrated Abstention
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{item.name}</span>
                  {item.badge !== undefined && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-amber-500 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* System Status Pill & Access Mode */}
          <div className="hidden lg:flex items-center space-x-3 text-xs">
            {isPublicAccessEnabled() ? (
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300"
                title="Public/demo access enabled via NEXT_PUBLIC_ACCESS_ENABLED"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium">Public Access: Active</span>
              </div>
            ) : (
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300"
                title="Public access disabled via NEXT_PUBLIC_ACCESS_ENABLED"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Public Access: Disabled</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Cluster: Ready</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
