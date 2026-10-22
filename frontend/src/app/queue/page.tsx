'use client';

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
  UserCheck,
  RotateCcw,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { HumanReviewItem } from '../../lib/types';
import { apiClient } from '../../lib/api-client';

export default function ReviewQueuePage() {
  const [items, setItems] = useState<HumanReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HumanReviewItem | null>(null);
  const [resolutionComment, setResolutionComment] = useState('');
  const [overrideCandidateId, setOverrideCandidateId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'ALL'>('PENDING');

  useEffect(() => {
    loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getReviewQueue(
        statusFilter === 'ALL' ? undefined : 'PENDING',
      );
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (action: 'APPROVE' | 'REJECT' | 'OVERRIDE') => {
    if (!selectedItem) return;
    if (!resolutionComment.trim()) {
      alert('A resolution commentary is strictly required for compliance.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.resolveReview(selectedItem.reviewId, {
        action,
        candidateId: action === 'OVERRIDE' ? overrideCandidateId : selectedItem.decisionRecord.chosenCandidateId,
        resolutionComment,
        reviewerId: 'specialist-adjudicator-1',
      });
      setSelectedItem(null);
      setResolutionComment('');
      setOverrideCandidateId('');
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl 4k:text-3xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Inbox className="w-6 h-6 4k:w-7 4k:h-7 text-indigo-400 flex-shrink-0" />
            <span>Human Review Queue</span>
          </h1>
          <p className="text-xs sm:text-sm 4k:text-base text-slate-400 mt-1 max-w-xl leading-relaxed">
            Adjudicate conflicting AI outputs, contradictory assertions, and missing-evidence escalations.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-center whitespace-nowrap ${
              statusFilter === 'PENDING'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Action ({items.filter((i) => i.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-center whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Items
          </button>
        </div>
      </div>

      {/* Queue Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">
          Loading escalated review queue...
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 sm:p-16 text-center glass-panel rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Review Queue is Clear</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
            No pending AI output escalations require human adjudication at this time.
          </p>
        </div>
      ) : (
        <div className="rounded-xl glass-panel border border-slate-800 overflow-hidden w-full">
          <div className="overflow-x-auto w-full">
            <table className="min-w-full divide-y divide-slate-800 text-xs 4k:text-sm">
              <thead className="bg-slate-950/60 font-mono text-slate-400 uppercase">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left whitespace-nowrap">Review ID / Created</th>
                  <th className="px-3 sm:px-4 py-3 text-left whitespace-nowrap">Task</th>
                  <th className="px-3 sm:px-4 py-3 text-left whitespace-nowrap">Trigger Reason</th>
                  <th className="px-3 sm:px-4 py-3 text-left whitespace-nowrap">Status</th>
                  <th className="px-3 sm:px-4 py-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {items.map((item) => (
                  <tr key={item.reviewId} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-3 sm:px-4 py-3.5 font-mono text-slate-300 whitespace-nowrap">
                      <div className="font-semibold text-white">{item.reviewId}</div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 min-w-[200px] max-w-xs font-medium text-slate-200 truncate">
                      {item.task}
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-950/80 text-amber-300 border border-amber-500/40">
                        {item.escalationReason}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                          item.status === 'PENDING'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                            : item.status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setOverrideCandidateId(
                            item.decisionRecord.candidates[0]?.candidateId || '',
                          );
                        }}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow transition-all"
                      >
                        {item.status === 'PENDING' ? 'Adjudicate' : 'View Audit'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjudication Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel-elevated rounded-2xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-4xl p-4 sm:p-6 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2 min-w-0">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase text-indigo-400">
                  Adjudication Console
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  Review: {selectedItem.reviewId}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 flex-shrink-0"
              >
                Close
              </button>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto space-y-4">
              {/* Task Details */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400 font-mono">Task:</span>
                <div className="font-semibold text-slate-200 mt-0.5 leading-snug">{selectedItem.task}</div>
                <div className="text-amber-400 mt-1 font-mono text-[11px] break-words">
                  Reason: {selectedItem.escalationReason} ({selectedItem.escalationDetails})
                </div>
              </div>

              {/* Side-by-side candidates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {selectedItem.decisionRecord.candidates.map((cand) => (
                  <div
                    key={cand.candidateId}
                    className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between font-mono mb-2 gap-2">
                      <span className="font-bold text-white truncate">{cand.modelId}</span>
                      <span className="text-slate-400 truncate text-[11px]">{cand.candidateId}</span>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto whitespace-pre-wrap break-words select-text">
                      {cand.output}
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Actions if PENDING */}
              {selectedItem.status === 'PENDING' ? (
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-indigo-500/30 space-y-3">
                  <h4 className="text-xs font-bold text-white font-mono uppercase">
                    Adjudicator Decision
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Override Candidate Selection (Optional):
                    </label>
                    <select
                      value={overrideCandidateId}
                      onChange={(e) => setOverrideCandidateId(e.target.value)}
                      className="w-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2"
                    >
                      {selectedItem.decisionRecord.candidates.map((c) => (
                        <option key={c.candidateId} value={c.candidateId}>
                          {c.modelId} ({c.candidateId})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Compliance Audit Rationale (Mandatory):
                    </label>
                    <textarea
                      value={resolutionComment}
                      onChange={(e) => setResolutionComment(e.target.value)}
                      placeholder="Detail why candidate is being accepted, rejected, or overridden..."
                      rows={3}
                      className="w-full text-xs font-mono bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => handleResolve('REJECT')}
                      disabled={submitting}
                      className="w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-semibold bg-rose-600/80 hover:bg-rose-500 text-white transition-colors"
                    >
                      Reject All
                    </button>
                    <button
                      onClick={() => handleResolve('OVERRIDE')}
                      disabled={submitting}
                      className="w-full sm:w-auto px-3 py-2 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
                    >
                      Override Selection
                    </button>
                    <button
                      onClick={() => handleResolve('APPROVE')}
                      disabled={submitting}
                      className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-colors"
                    >
                      Approve Candidate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="font-semibold text-emerald-400 mb-1">
                    Resolved as {selectedItem.status} by {selectedItem.reviewerId}
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] break-words">
                    &ldquo;{selectedItem.resolutionComment}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
