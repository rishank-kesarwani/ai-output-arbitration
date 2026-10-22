'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Scale, Inbox, FileText, Sliders, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-7xl 2xl:max-w-[1536px] 3xl:max-w-[1920px] 4k:max-w-[2400px] mx-auto px-3 sm:px-6 lg:px-8 4k:px-12 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
          {/* Logo & Description */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-9 h-9 4k:w-11 4k:h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20 flex-shrink-0">
              <ShieldAlert className="w-4.5 h-4.5 4k:w-5.5 4k:h-5.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm 4k:text-base text-white tracking-tight truncate">
                  AI Output Arbitration
                </span>
                <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                  Trust Layer
                </span>
              </div>
              <p className="text-xs 4k:text-sm text-slate-400 mt-0.5 leading-relaxed">
                Evidence-aware response verification, deterministic validation, and calibrated abstention.
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs 4k:text-sm font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center space-x-1.5 whitespace-nowrap">
              <Scale className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Trust Console</span>
            </Link>
            <Link href="/queue" className="hover:text-white transition-colors flex items-center space-x-1.5 whitespace-nowrap">
              <Inbox className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span>Review Queue</span>
            </Link>
            <Link href="/audit" className="hover:text-white transition-colors flex items-center space-x-1.5 whitespace-nowrap">
              <FileText className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Decision Audit</span>
            </Link>
            <Link href="/policies" className="hover:text-white transition-colors flex items-center space-x-1.5 whitespace-nowrap">
              <Sliders className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Policies</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Invariant & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs 4k:text-sm text-slate-400">
          <div className="flex items-center space-x-2 text-slate-400 text-[11px] 4k:text-xs leading-relaxed">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>Core Invariant: Model consensus is never accepted as proof of ground truth.</span>
          </div>
          <div className="font-mono text-[11px] 4k:text-xs text-slate-400 whitespace-nowrap">
            SHA-256 Tamper-Evident Ledger • Multi-Tenant Isolated
          </div>
        </div>
      </div>
    </footer>
  );
}
