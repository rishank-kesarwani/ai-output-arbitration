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
  Sparkles,
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
    <div className="rounded-xl glass-panel p-4 mb-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {/* Latency Metric */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-400 font-medium">Execution Latency</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isSim
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {isSim ? 'Simulated' : 'Measured'}
              </span>
            </div>
            <span className="text-sm font-mono font-bold text-white">
              {decision.executionMetrics.totalLatencyMs} ms
            </span>
          </div>
        </div>

        {/* Cost Metric */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 font-medium">Evaluation Cost</span>
            <div className="text-sm font-mono font-bold text-white">
              ${decision.executionMetrics.totalCostUsd.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Strategy Applied */}
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <span className="text-slate-400 font-medium">Arbitration Strategy</span>
            <div className="text-sm font-mono font-bold text-indigo-300 truncate max-w-[130px]">
              {decision.strategy}
            </div>
          </div>
        </div>

        {/* Tamper-Evident SHA-256 Digest */}
        <div className="flex items-center justify-between sm:justify-end space-x-2">
          <div className="text-left sm:text-right">
            <div className="flex items-center space-x-1 text-slate-400 justify-start sm:justify-end">
              <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
              <span>Audit Signature (SHA-256)</span>
            </div>
            <button
              onClick={copySignature}
              className="mt-0.5 inline-flex items-center space-x-1 font-mono text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
              title="Click to copy full SHA-256 cryptographic signature"
            >
              <span>{decision.signatureHash.slice(0, 10)}...</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Limitations Disclaimer Banner */}
      {decision.strategyDetails?.limitationsDisclaimer && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-start space-x-2 text-[11px] text-slate-400">
          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <span>{decision.strategyDetails.limitationsDisclaimer}</span>
        </div>
      )}
    </div>
  );
}
