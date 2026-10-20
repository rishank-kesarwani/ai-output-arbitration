'use client';

import React from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import { EvidenceDocument, EvidenceCheckResult } from '../lib/types';

interface EvidenceInspectorProps {
  documents: EvidenceDocument[];
  evidenceChecks?: Record<string, EvidenceCheckResult>;
}

export function EvidenceInspector({
  documents,
  evidenceChecks = {},
}: EvidenceInspectorProps) {
  // Aggregate contradictions and phantom citations across all checks
  const allPhantomCitations = new Set<string>();
  const allContradictions: string[] = [];

  for (const check of Object.values(evidenceChecks)) {
    for (const phantom of check.referenceResolution.phantomCitations) {
      allPhantomCitations.add(phantom);
    }
    if (check.contradictionFlags.contradictsSource || check.contradictionFlags.contradictsOtherCandidates) {
      for (const detail of check.contradictionFlags.conflictingDetails) {
        if (!allContradictions.includes(detail)) {
          allContradictions.push(detail);
        }
      }
    }
  }

  return (
    <div className="rounded-xl glass-panel p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white tracking-tight">
            Evidence Grounding & Source Verification
          </h2>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700">
          {documents.length} Source Document{documents.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Contradiction Alert Box */}
      {allContradictions.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300">
          <div className="flex items-center space-x-1.5 font-bold mb-1.5 text-rose-200">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Factual Contradictions Flagged ({allContradictions.length}):</span>
          </div>
          <ul className="space-y-1 list-disc list-inside text-rose-300/90">
            {allContradictions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Phantom Citation Warning */}
      {allPhantomCitations.size > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-amber-950/60 border border-amber-500/40 text-xs text-amber-300">
          <div className="flex items-center space-x-1.5 font-bold mb-1 text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Phantom / Hallucinated Citations Detected:</span>
          </div>
          <p className="text-amber-300/90">
            Candidates referenced non-existent sources: {Array.from(allPhantomCitations).map((s) => `[${s}]`).join(', ')}.
            These references failed resolution against verified documents.
          </p>
        </div>
      )}

      {/* Missing Evidence Warning */}
      {documents.length === 0 ? (
        <div className="p-6 rounded-lg bg-slate-950/60 border border-amber-500/30 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-amber-300">
            Ground Truth Evidence Not Supplied
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            This scenario tests calibrated abstention. Without ground truth evidence documents, the trust layer refuses to assume claims are factually true based solely on model consensus.
          </p>
        </div>
      ) : (
        /* Source Documents List */
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.sourceId}
              className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-blue-950 text-blue-300 border border-blue-500/30">
                    {doc.sourceId}
                  </span>
                  <span className="text-xs font-semibold text-slate-200 truncate max-w-xs sm:max-w-md">
                    {doc.title}
                  </span>
                </div>
                {doc.version && (
                  <span className="text-[10px] font-mono text-slate-400">
                    ver: {doc.version}
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-slate-300 bg-slate-900/60 p-2.5 rounded border border-slate-800/60 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                {doc.content}
              </div>

              {doc.uri && (
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-md font-mono">{doc.uri}</span>
                  <span className="flex items-center space-x-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Verified Source</span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
