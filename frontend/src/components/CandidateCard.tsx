'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  DollarSign,
  Cpu,
  BookmarkCheck,
} from 'lucide-react';
import {
  CandidateResponse,
  CandidateScoreBreakdown,
  DeterministicCheckResult,
  EvidenceCheckResult,
} from '../lib/types';

interface CandidateCardProps {
  candidate: CandidateResponse;
  score?: CandidateScoreBreakdown;
  deterministic?: DeterministicCheckResult;
  evidence?: EvidenceCheckResult;
  isWinner: boolean;
}

export function CandidateCard({
  candidate,
  score,
  deterministic,
  evidence,
  isWinner,
}: CandidateCardProps) {
  const isDisqualified = score?.disqualified || false;
  const scorePercent = score ? Math.round(score.finalWeightedScore * 100) : 0;

  return (
    <div
      className={`relative rounded-xl p-4 sm:p-5 4k:p-6 glass-panel glass-card-hover transition-all flex flex-col justify-between ${
        isWinner
          ? 'ring-2 ring-emerald-500 bg-slate-900/90 shadow-lg shadow-emerald-500/10'
          : isDisqualified
          ? 'ring-1 ring-rose-500/40 bg-slate-950/70 opacity-85'
          : 'ring-1 ring-slate-800 bg-slate-900/60'
      }`}
    >
      <div>
        {/* Top Banner & Badges */}
        <div className="flex items-start sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="p-1 sm:p-1.5 rounded-md bg-blue-500/10 text-blue-400 flex-shrink-0">
              <Cpu className="w-4 h-4 4k:w-5 4k:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xs sm:text-sm 4k:text-base font-bold text-white tracking-tight truncate">
                {candidate.modelId}
              </h3>
              <span className="text-[10px] sm:text-xs font-mono text-slate-400 truncate block">
                {candidate.candidateId}
              </span>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex-shrink-0">
            {isWinner ? (
              <span className="inline-flex items-center space-x-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 whitespace-nowrap">
                <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>SELECTED</span>
              </span>
            ) : isDisqualified ? (
              <span className="inline-flex items-center space-x-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 whitespace-nowrap">
                <XCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span>DISQUALIFIED</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                <span>EVALUATED</span>
              </span>
            )}
          </div>
        </div>

        {/* Disqualification Reason Callout */}
        {isDisqualified && score?.disqualificationReason && (
          <div className="mb-3 px-2.5 sm:px-3 py-2 rounded-lg bg-rose-950/50 border border-rose-500/30 text-[11px] sm:text-xs text-rose-300 flex items-start space-x-2 break-words">
            <AlertOctagon className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span className="min-w-0 flex-1 leading-snug">{score.disqualificationReason}</span>
          </div>
        )}

        {/* Output Content */}
        <div className="mb-4">
          <div className="p-2.5 sm:p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 font-mono text-[11px] sm:text-xs 4k:text-sm text-slate-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap break-words select-text">
            {candidate.output}
          </div>
        </div>

        {/* Citations List if present */}
        {candidate.citations && candidate.citations.length > 0 && (
          <div className="mb-4 space-y-1">
            <div className="text-[11px] sm:text-xs font-semibold text-slate-400 flex items-center space-x-1">
              <BookmarkCheck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span>Citations ({candidate.citations.length}):</span>
            </div>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {candidate.citations.map((c, idx) => {
                const isPhantom = evidence?.referenceResolution.phantomCitations.includes(c.sourceId);
                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-medium border ${
                      isPhantom
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/60'
                        : 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                    }`}
                    title={isPhantom ? 'Phantom citation: source not found in evidence docs!' : 'Verified source reference'}
                  >
                    [{c.sourceId}]
                    {isPhantom && ' ⚠️ phantom'}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Trust Score & Metrics Bar */}
      <div className="pt-3 border-t border-slate-800/80 mt-auto">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-400 font-medium">Arbitration Trust Score</span>
          <span
            className={`font-bold font-mono text-xs sm:text-sm 4k:text-base ${
              isWinner
                ? 'text-emerald-400'
                : isDisqualified
                ? 'text-rose-400'
                : 'text-blue-400'
            }`}
          >
            {scorePercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isWinner
                ? 'bg-emerald-500'
                : isDisqualified
                ? 'bg-rose-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${scorePercent}%` }}
          />
        </div>

        {/* Metric Pills */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
          <div className="p-1.5 sm:p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center space-x-1 sm:space-x-1.5 min-w-0">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <span className="block text-slate-500 text-[9px] sm:text-[10px] truncate">Latency</span>
              <span className="font-mono text-slate-300 font-medium truncate block">
                {candidate.latencyMs}ms
              </span>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center space-x-1 sm:space-x-1.5 min-w-0">
            <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <span className="block text-slate-500 text-[9px] sm:text-[10px] truncate">Cost</span>
              <span className="font-mono text-slate-300 font-medium truncate block">
                ${candidate.costUsd.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="p-1.5 sm:p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 flex items-center space-x-1 sm:space-x-1.5 min-w-0">
            <BookmarkCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 flex-shrink-0" />
            <div className="min-w-0 flex-1 truncate">
              <span className="block text-slate-500 text-[9px] sm:text-[10px] truncate">Evidence</span>
              <span className="font-mono text-slate-300 font-medium truncate block">
                {evidence ? `${Math.round(evidence.sourceSupport.supportScore * 100)}%` : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
