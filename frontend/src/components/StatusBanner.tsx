'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ExternalLink,
  Flame,
} from 'lucide-react';
import { ArbitrationOutcome, EscalationReason } from '../lib/types';
import Link from 'next/link';

interface StatusBannerProps {
  outcome: ArbitrationOutcome;
  chosenCandidateId?: string;
  chosenModelId?: string;
  abstentionReason?: string;
  escalationReason?: EscalationReason;
  hasContradictions?: boolean;
  missingEvidence?: boolean;
}

export function StatusBanner({
  outcome,
  chosenCandidateId,
  chosenModelId,
  abstentionReason,
  escalationReason,
  hasContradictions,
  missingEvidence,
}: StatusBannerProps) {
  if (outcome === 'SELECTED') {
    return (
      <div className="rounded-xl p-3.5 sm:p-4 bg-emerald-950/40 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-emerald-300 text-xs sm:text-sm">
                Arbitration Outcome: Candidate Selected
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-mono font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Winner: {chosenModelId || chosenCandidateId}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-400/90 mt-1 leading-relaxed">
              Candidate successfully cleared deterministic schema constraints, citation verification, and achieved the highest calibrated trust score.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (outcome === 'ABSTAINED') {
    return (
      <div className="rounded-xl p-3.5 sm:p-4 bg-amber-950/40 border border-amber-500/40 shadow-lg shadow-amber-950/20 mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 mt-0.5 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-amber-300 text-xs sm:text-sm">
                Arbitration Outcome: Calibrated Abstention
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {escalationReason || 'UNVERIFIED_EVIDENCE'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-300/90 mt-1 leading-relaxed">
              {abstentionReason ||
                'The system refuses to accept candidate assertions without verified evidence. Agreement across models is NOT accepted as proof of ground truth.'}
            </p>
            {missingEvidence && (
              <p className="text-[11px] sm:text-xs text-amber-400/80 mt-1 italic leading-relaxed">
                * Note: Ground truth evidence repository is empty or missing. Under policy, missing evidence triggers calibrated abstention rather than false assumptions.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (outcome === 'ESCALATED_TO_HUMAN_REVIEW') {
    return (
      <div className="rounded-xl p-3.5 sm:p-4 bg-indigo-950/40 border border-indigo-500/40 shadow-lg shadow-indigo-950/20 mb-6">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5 flex-shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-indigo-300 text-xs sm:text-sm">
                  Arbitration Outcome: Escalated to Human Review
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {escalationReason || 'MANUAL_TRIAGE_REQUIRED'}
                </span>
              </div>
              <Link
                href="/queue"
                className="inline-flex items-center space-x-1 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium self-start sm:self-auto"
              >
                <span>Open Review Queue</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs sm:text-sm text-indigo-300/90 mt-1 leading-relaxed">
              {abstentionReason ||
                'Conflicting assertions or edge-case policy conditions require human specialist sign-off.'}
            </p>
            {hasContradictions && (
              <div className="flex items-center space-x-1 text-xs text-rose-400 mt-1.5 font-medium">
                <Flame className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Severe factual contradiction detected between candidate responses.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // REJECTED
  return (
    <div className="rounded-xl p-3.5 sm:p-4 bg-rose-950/40 border border-rose-500/40 shadow-lg shadow-rose-950/20 mb-6">
      <div className="flex items-start space-x-3">
        <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5 flex-shrink-0">
          <XCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-rose-300 text-xs sm:text-sm">
              Arbitration Outcome: All Candidates Rejected
            </span>
            <span className="px-2 py-0.5 rounded text-[11px] sm:text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              DISQUALIFIED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-rose-300/90 mt-1 leading-relaxed">
            {abstentionReason ||
              'Every candidate response failed critical deterministic checks (schema violation, broken syntax, or safety blacklist).'}
          </p>
        </div>
      </div>
    </div>
  );
}
