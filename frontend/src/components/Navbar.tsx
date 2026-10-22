'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShieldAlert,
  Scale,
  Inbox,
  FileText,
  Sliders,
  Globe,
  Lock,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { isPublicAccessEnabled } from '../lib/api-client';

interface NavbarProps {
  pendingReviewCount?: number;
}

export function Navbar({ pendingReviewCount = 0 }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const publicAccess = isPublicAccessEnabled();

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
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 backdrop-blur-md">
      <div className="w-full max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1920px] 4k:max-w-[2400px] mx-auto px-3 sm:px-6 lg:px-8 4k:px-12">
        <div className="flex items-center justify-between h-16 4k:h-20">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0">
            <Link
              href="/"
              className="flex items-center space-x-2.5 sm:space-x-3 group min-w-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 4k:w-12 4k:h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20 flex-shrink-0 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4.5 h-4.5 sm:w-5 sm:h-5 4k:w-6 4k:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm xs:text-base sm:text-lg 4k:text-xl font-bold tracking-tight text-white truncate">
                    AI Output Arbitration
                  </span>
                  <span className="hidden xs:inline-flex text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-medium border border-blue-500/30 whitespace-nowrap">
                    Trust Layer
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400 hidden lg:block truncate">
                  Evidence-Aware Verification & Calibrated Abstention
                </p>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links (md and up) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-3 py-2 4k:px-4 4k:py-2.5 rounded-lg text-xs lg:text-sm 4k:text-base font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 4k:w-5 4k:h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                  {item.badge !== undefined && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-amber-500 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* System Status Pill & Access Mode (Desktop) */}
          <div className="hidden lg:flex items-center space-x-3 text-xs 4k:text-sm">
            {publicAccess ? (
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 whitespace-nowrap"
                title="Public/demo access enabled via NEXT_PUBLIC_ACCESS_ENABLED"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium">Public Access: Active</span>
              </div>
            ) : (
              <div
                className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 whitespace-nowrap"
                title="Public access disabled via NEXT_PUBLIC_ACCESS_ENABLED"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium">Public Access: Disabled</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Cluster: Ready</span>
            </div>
          </div>

          {/* Mobile Menu Button (md:hidden) */}
          <div className="flex items-center space-x-2 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-slate-200" />
              ) : (
                <Menu className="w-6 h-6 text-slate-200" />
              )}
              {pendingReviewCount > 0 && !mobileMenuOpen && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-in fade-in duration-200">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.badge !== undefined && (
                      <span className="px-2 py-0.5 text-xs font-bold text-white bg-amber-500 rounded-full animate-pulse">
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Mobile System Status Bar */}
          <div className="pt-3 border-t border-slate-800/70 flex flex-wrap gap-2 text-xs">
            {publicAccess ? (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>Public Access: Active</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Public Access: Disabled</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Cluster: Ready</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
