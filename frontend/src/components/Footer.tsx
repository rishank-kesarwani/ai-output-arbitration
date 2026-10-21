'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Scale, Inbox, FileText, Sliders, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/60">
          {/* Logo & Description */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20 flex-shrink-0">
              <ShieldAlert className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-white tracking-tight">
                  AI Output Arbitration
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Trust Layer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evidence-aware response verification, deterministic validation, and calibrated abstention.
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
            <Link href="/" className="hover:text-white transition-colors flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-blue-400" />
              <span>Trust Console</span>
            </Link>
            <Link href="/queue" className="hover:text-white transition-colors flex items-center space-x-1.5">
              <Inbox className="w-3.5 h-3.5 text-indigo-400" />
              <span>Review Queue</span>
            </Link>
            <Link href="/audit" className="hover:text-white transition-colors flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Decision Audit</span>
            </Link>
            <Link href="/policies" className="hover:text-white transition-colors flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Policies</span>
            </Link>
          </nav>
        </div>

        {/* Bottom Invariant & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Core Invariant: Model consensus is never accepted as proof of ground truth.</span>
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            SHA-256 Tamper-Evident Ledger • Multi-Tenant Isolated
          </div>
        </div>
      </div>
    </footer>
  );
}
