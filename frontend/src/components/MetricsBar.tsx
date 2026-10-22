'use client';

import React, { useState } from 'react';
import {
  Clock,
  DollarSign,
  Fingerprint,
  Info,
  Check,
  Copy,
  Layers,
} from 'lucide-react';
import { DecisionRecord } from '../lib/types';

interface MetricsBarProps {
  decision: DecisionRecord;
}

export function MetricsBar({ decision }: MetricsBarProps) {
  const [copied, setCopied] = useState(false);

  const copySignature = () => {
    navigator.clipboard.writeText(decision.signatureHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isSim = decision.executionMetrics.isSimulated;

  return (
    <div className="rounded-xl glass-panel p-3.5 sm:p-4 mb-6">
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs 4k:text-sm">
        {/* Latency Metric */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 flex-shrink-0">
            <Clock className="w-4 h-4 4k:w-5 4k:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="text-slate-400 font-medium truncate">Execution Latency</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  isSim
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {isSim ? 'Simulated' : 'Measured'}
              </span>
            </div>
            <span className="text-sm 4k:text-base font-mono font-bold text-white block mt-0.5">
              {decision.executionMetrics.totalLatencyMs} ms
            </span>
          </div>
        </div>

        {/* Cost Metric */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 flex-shrink-0">
            <DollarSign className="w-4 h-4 4k:w-5 4k:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-slate-400 font-medium truncate block">Evaluation Cost</span>
            <div className="text-sm 4k:text-base font-mono font-bold text-white mt-0.5">
              ${decision.executionMetrics.totalCostUsd.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Strategy Applied */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 flex-shrink-0">
            <Layers className="w-4 h-4 4k:w-5 4k:h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-slate-400 font-medium truncate block">Arbitration Strategy</span>
            <div className="text-sm 4k:text-base font-mono font-bold text-indigo-300 truncate mt-0.5" title={decision.strategy}>
              {decision.strategy}
            </div>
          </div>
        </div>

        {/* Tamper-Evident SHA-256 Digest */}
        <div className="flex items-center justify-between xs:justify-start lg:justify-end space-x-2 min-w-0">
          <div className="text-left lg:text-right min-w-0">
            <div className="flex items-center space-x-1 text-slate-400 justify-start lg:justify-end">
              <Fingerprint className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate">Audit Signature (SHA-256)</span>
            </div>
            <button
              onClick={copySignature}
              className="mt-1 inline-flex items-center space-x-1 font-mono text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 py-1 rounded transition-colors max-w-full truncate"
              title="Click to copy full SHA-256 cryptographic signature"
            >
              <span className="truncate">{decision.signatureHash.slice(0, 10)}...</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400 flex-shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Limitations Disclaimer Banner */}
      {decision.strategyDetails?.limitationsDisclaimer && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start space-x-2 text-[11px] 4k:text-xs text-slate-400 leading-relaxed">
          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <span className="break-words">{decision.strategyDetails.limitationsDisclaimer}</span>
        </div>
      )}
    </div>
  );
}
