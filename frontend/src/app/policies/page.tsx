'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  Shield,
  Layers,
  Save,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { ArbitrationPolicy } from '../../lib/types';
import { apiClient } from '../../lib/api-client';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<ArbitrationPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPolicy, setSelectedPolicy] = useState<ArbitrationPolicy | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const list = await apiClient.getPolicies();
      setPolicies(list);
      if (list.length > 0) {
        setSelectedPolicy(list[0]);
      }
    } catch {
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPolicy) return;
    setSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await apiClient.savePolicy(selectedPolicy);
      setSelectedPolicy(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadPolicies();
    } catch (err: any) {
      alert(err.message || 'Failed to save policy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            <span>Arbitration Policy Rules & Thresholds</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure trust thresholds, evidence mandates, phantom citation restrictions, and multi-factor scoring weights.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Policy Saved (Version Incremented)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy List Sidebar */}
        <div className="space-y-3">
          <label className="text-xs font-mono uppercase text-slate-400 tracking-wider">
            Active Tenant Policies
          </label>
          <div className="space-y-2">
            {policies.map((p) => {
              const isSelected = selectedPolicy?.policyId === p.policyId;
              return (
                <button
                  key={p.policyId}
                  onClick={() => setSelectedPolicy({ ...p })}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-blue-950/70 border-blue-500 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs text-white">{p.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      v{p.version}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2">
                    {p.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Policy Config Form */}
        {selectedPolicy ? (
          <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  {selectedPolicy.name}
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  ID: {selectedPolicy.policyId} • Version: {selectedPolicy.version}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30 transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Policy Version'}</span>
              </button>
            </div>

            {/* General Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Default Strategy
                </label>
                <select
                  value={selectedPolicy.strategy}
                  onChange={(e) =>
                    setSelectedPolicy({
                      ...selectedPolicy,
                      strategy: e.target.value as any,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2 font-mono text-xs"
                >
                  <option value="HYBRID_SAFE">HYBRID_SAFE</option>
                  <option value="DETERMINISTIC_RULES">DETERMINISTIC_RULES</option>
                  <option value="WEIGHTED_SCORING">WEIGHTED_SCORING</option>
                  <option value="JUDGE_MODEL_ASSESSMENT">JUDGE_MODEL_ASSESSMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Confidence Threshold: {(selectedPolicy.minConfidenceThreshold * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="99"
                  value={Math.round(selectedPolicy.minConfidenceThreshold * 100)}
                  onChange={(e) =>
                    setSelectedPolicy({
                      ...selectedPolicy,
                      minConfidenceThreshold: parseInt(e.target.value, 10) / 100,
                    })
                  }
                  className="w-full mt-2 accent-blue-500"
                />
              </div>
            </div>

            {/* Policy Toggles */}
            <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
              <label className="font-mono text-slate-400 uppercase tracking-wider block mb-2">
                Grounding & Verification Rules
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPolicy.requireEvidence}
                  onChange={(e) =>
                    setSelectedPolicy({
                      ...selectedPolicy,
                      requireEvidence: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 accent-blue-500"
                />
                <span>Mandate Ground Truth Evidence (Trigger Calibrated Abstention if missing)</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPolicy.disallowPhantomCitations}
                  onChange={(e) =>
                    setSelectedPolicy({
                      ...selectedPolicy,
                      disallowPhantomCitations: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 accent-blue-500"
                />
                <span>Disallow Phantom Citations (Strictly disqualify unresolvable source citations)</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPolicy.disallowContradictions}
                  onChange={(e) =>
                    setSelectedPolicy({
                      ...selectedPolicy,
                      disallowContradictions: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 accent-blue-500"
                />
                <span>Disallow Factual Contradictions (Escalate to review queue on contradiction)</span>
              </label>

              <label className="flex items-center space-x-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPolicy.strictSchemaValidation}
                  onChange={(e) =>
                    setSelectedPolicy({
                      ...selectedPolicy,
                      strictSchemaValidation: e.target.checked,
                    })
                  }
                  className="rounded border-slate-700 bg-slate-900 text-blue-600 accent-blue-500"
                />
                <span>Strict JSON Schema Validation (Zero tolerance for malformed syntax)</span>
              </label>
            </div>

            {/* Weights Sliders */}
            <div className="pt-3 border-t border-slate-800 text-xs space-y-3">
              <label className="font-mono text-slate-400 uppercase tracking-wider block mb-1">
                Multi-Factor Utility Weights
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Evidence Support Weight</span>
                    <span className="font-mono text-white">
                      {(selectedPolicy.weights.evidenceSupport * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={Math.round(selectedPolicy.weights.evidenceSupport * 100)}
                    onChange={(e) =>
                      setSelectedPolicy({
                        ...selectedPolicy,
                        weights: {
                          ...selectedPolicy.weights,
                          evidenceSupport: parseInt(e.target.value, 10) / 100,
                        },
                      })
                    }
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Schema & Syntax Weight</span>
                    <span className="font-mono text-white">
                      {(selectedPolicy.weights.schemaAndFormat * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={Math.round(selectedPolicy.weights.schemaAndFormat * 100)}
                    onChange={(e) =>
                      setSelectedPolicy({
                        ...selectedPolicy,
                        weights: {
                          ...selectedPolicy.weights,
                          schemaAndFormat: parseInt(e.target.value, 10) / 100,
                        },
                      })
                    }
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 text-xs font-mono">
            Loading policy rules...
          </div>
        )}
      </div>
    </div>
  );
}
