'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Filter,
  Search,
  Copy,
  Check,
} from 'lucide-react';
import { DecisionRecord, ArbitrationOutcome } from '../../lib/types';
import { apiClient } from '../../lib/api-client';

export default function AuditPage() {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [outcomeFilter, setOutcomeFilter] = useState<string>('ALL');
  const [selectedRecord, setSelectedRecord] = useState<DecisionRecord | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadDecisions();
  }, [outcomeFilter]);

  const loadDecisions = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getDecisions({
        outcome: outcomeFilter === 'ALL' ? undefined : (outcomeFilter as ArbitrationOutcome),
        limit: 50,
      });
      setDecisions(res.items || []);
    } catch {
      setDecisions([]);
    } finally {
      setLoading(false);
    }
  };

  const copyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-400" />
            <span>Decision Audit Explorer</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Tamper-evident cryptographic ledger of all arbitration evaluations, checks performed, and chosen outcomes.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="text-xs font-mono bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SELECTED">Selected Only</option>
            <option value="ABSTAINED">Abstained Only</option>
            <option value="ESCALATED_TO_HUMAN_REVIEW">Escalated Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
        </div>
      </div>

      {/* Decisions Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading audit records...
        </div>
      ) : decisions.length === 0 ? (
        <div className="p-16 text-center glass-panel rounded-2xl">
          <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Decision Records</h3>
          <p className="text-xs text-slate-400 mt-1">
            Run an evaluation from the Trust Console to populate the audit ledger.
          </p>
        </div>
      ) : (
        <div className="rounded-xl glass-panel overflow-hidden border border-slate-800">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-950/60 font-mono text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Decision ID / Timestamp</th>
                <th className="px-4 py-3 text-left">Task</th>
                <th className="px-4 py-3 text-left">Strategy</th>
                <th className="px-4 py-3 text-left">Outcome</th>
                <th className="px-4 py-3 text-left">SHA-256 Digest</th>
                <th className="px-4 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {decisions.map((dec) => (
                <tr key={dec.decisionId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-slate-300">
                    <div className="font-semibold text-white">{dec.decisionId}</div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(dec.timestamp).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 max-w-xs font-medium text-slate-200 truncate">
                    {dec.task}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-slate-400">
                    {dec.strategy}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                        dec.outcome === 'SELECTED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : dec.outcome === 'ABSTAINED'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : dec.outcome === 'ESCALATED_TO_HUMAN_REVIEW'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {dec.outcome}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-400">
                    <button
                      onClick={() => copyHash(dec.signatureHash, dec.decisionId)}
                      className="inline-flex items-center space-x-1 hover:text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800"
                      title="Copy SHA-256 hash"
                    >
                      <Fingerprint className="w-3 h-3 text-blue-400" />
                      <span>{dec.signatureHash.slice(0, 10)}...</span>
                      {copiedId === dec.decisionId ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setSelectedRecord(dec)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px]"
                    >
                      JSON
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel-elevated rounded-2xl max-w-3xl w-full p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white font-mono">
                Audit Record: {selectedRecord.decisionId}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">
              <pre className="p-4 rounded-xl bg-slate-950 font-mono text-xs text-emerald-400 whitespace-pre-wrap">
                {JSON.stringify(selectedRecord, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
