'use client';

import React, { useState, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Sliders,
  AlertCircle,
  FileCode,
  ShieldCheck,
  CheckCircle,
  Scale,
} from 'lucide-react';
import { DEFAULT_SCENARIOS, LocalScenario } from '../lib/default-scenarios';
import { DecisionRecord, ArbitrationStrategyType } from '../lib/types';
import { apiClient, isPublicAccessEnabled } from '../lib/api-client';
import { StatusBanner } from '../components/StatusBanner';
import { MetricsBar } from '../components/MetricsBar';
import { CandidateCard } from '../components/CandidateCard';
import { EvidenceInspector } from '../components/EvidenceInspector';

export default function TrustConsolePage() {
  const publicAccess = isPublicAccessEnabled();
  const [scenarios] = useState<LocalScenario[]>(DEFAULT_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(
    DEFAULT_SCENARIOS[0].id,
  );

  const [currentScenario, setCurrentScenario] = useState<LocalScenario>(
    DEFAULT_SCENARIOS[0],
  );
  const [selectedStrategy, setSelectedStrategy] = useState<ArbitrationStrategyType>(
    DEFAULT_SCENARIOS[0].payload.strategy || 'HYBRID_SAFE',
  );

  const [isRunning, setIsRunning] = useState(false);
  const [decision, setDecision] = useState<DecisionRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rawModalOpen, setRawModalOpen] = useState(false);

  // Automatically execute arbitration on mount with the first scenario only if public access is enabled
  useEffect(() => {
    if (publicAccess) {
      runArbitration(DEFAULT_SCENARIOS[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicAccess]);

  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    const found = scenarios.find((s) => s.id === scenarioId);
    if (found) {
      setCurrentScenario(found);
      setSelectedStrategy(found.payload.strategy || 'HYBRID_SAFE');
      if (publicAccess) {
        runArbitration(found, found.payload.strategy);
      }
    }
  };

  const runArbitration = async (
    scenario: LocalScenario,
    strategyOverride?: ArbitrationStrategyType,
  ) => {
    setIsRunning(true);
    setErrorMessage(null);

    const payload = {
      ...scenario.payload,
      strategy: strategyOverride || selectedStrategy,
    };

    try {
      const res = await apiClient.evaluate(payload);
      setDecision(res);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Failed to execute arbitration evaluation on backend.',
      );
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl 4k:text-4xl font-extrabold text-white tracking-tight flex flex-wrap items-center gap-2">
            <Scale className="w-6 h-6 sm:w-7 sm:h-7 4k:w-9 4k:h-9 text-blue-400 flex-shrink-0" />
            <span className="truncate">Arbitration Trust Console</span>
            <span className="text-[10px] sm:text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
              v1.0.0
            </span>
          </h1>
          <p className="text-xs sm:text-sm 4k:text-base text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Multi-candidate response evaluation with deterministic validation, citation checking, and calibrated abstention. Majority agreement is never accepted as proof of ground truth.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => runArbitration(currentScenario)}
            disabled={isRunning || !publicAccess}
            title={!publicAccess ? 'Public demo evaluation is disabled in this environment' : undefined}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
          >
            <Play className={`w-4 h-4 flex-shrink-0 ${isRunning ? 'animate-spin' : ''}`} />
            <span>
              {!publicAccess
                ? 'Public Access Disabled'
                : isRunning
                ? 'Evaluating...'
                : 'Run Arbitration'}
            </span>
          </button>
        </div>
      </div>

      {/* Public Demo Access Disabled Banner */}
      {!publicAccess && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 leading-relaxed">
            <span className="font-semibold block">Public Demo Access Disabled</span>
            <span className="text-[11px] sm:text-xs text-amber-300/90">
              Public and anonymous evaluation actions are disabled by environment configuration (NEXT_PUBLIC_ACCESS_ENABLED=false). Direct evaluation requests require authenticated credentials (x-api-key).
            </span>
          </div>
        </div>
      )}

      {/* Scenario Selector Carousel / Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span>Reproducible Evaluation Scenarios</span>
          </label>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-2.5">
          {scenarios.map((sc) => {
            const isSelected = sc.id === selectedScenarioId;
            return (
              <button
                key={sc.id}
                onClick={() => handleSelectScenario(sc.id)}
                className={`text-left p-2.5 sm:p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-950/60 border-blue-500 text-white shadow-md shadow-blue-950/40 ring-1 ring-blue-500/50'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-blue-400 mb-0.5 sm:mb-1 truncate">
                  {sc.category}
                </div>
                <div className="text-xs font-semibold line-clamp-1">{sc.title}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scenario Context Card */}
      <div className="p-3.5 sm:p-4 rounded-xl glass-panel border border-slate-800 flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-mono text-slate-400">Current Task:</span>
          <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5 leading-snug">
            {currentScenario.payload.task}
          </p>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            {currentScenario.description}
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Strategy Selector */}
          <div className="text-left w-full sm:w-auto">
            <label className="block text-[10px] font-mono text-slate-400 mb-1 uppercase">
              Strategy
            </label>
            <select
              value={selectedStrategy}
              onChange={(e) => {
                const newStrat = e.target.value as ArbitrationStrategyType;
                setSelectedStrategy(newStrat);
                runArbitration(currentScenario, newStrat);
              }}
              className="w-full sm:w-auto text-xs font-mono bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
            >
              <option value="HYBRID_SAFE">HYBRID_SAFE (Recommended)</option>
              <option value="DETERMINISTIC_RULES">DETERMINISTIC_RULES</option>
              <option value="WEIGHTED_SCORING">WEIGHTED_SCORING</option>
              <option value="JUDGE_MODEL_ASSESSMENT">JUDGE_MODEL_ASSESSMENT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state if backend unreachable */}
      {errorMessage && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 leading-relaxed">
            <span className="font-semibold block">Execution Notice</span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Active Results Display */}
      {decision && (
        <div className="space-y-6">
          {/* Status Banner */}
          <StatusBanner
            outcome={decision.outcome}
            chosenCandidateId={decision.chosenCandidateId}
            chosenModelId={decision.chosenCandidate?.modelId}
            abstentionReason={decision.abstentionReason}
            escalationReason={decision.escalationReason}
            hasContradictions={Object.values(decision.evidenceChecks).some(
              (e) =>
                e.contradictionFlags.contradictsSource ||
                e.contradictionFlags.contradictsOtherCandidates,
            )}
            missingEvidence={Object.values(decision.evidenceChecks).some(
              (e) => e.sourceSupport.hasMissingEvidence,
            )}
          />

          {/* Metrics Bar */}
          <MetricsBar decision={decision} />

          {/* Candidate Responses Comparison Matrix */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Candidate Comparison Matrix</span>
                <span className="text-[11px] sm:text-xs font-mono text-slate-400 font-normal">
                  ({decision.candidates.length} candidates evaluated)
                </span>
              </h2>

              <button
                onClick={() => setRawModalOpen(true)}
                className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center space-x-1 self-start sm:self-auto"
              >
                <FileCode className="w-3.5 h-3.5 flex-shrink-0" />
                <span>View Full Decision JSON</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 4k:gap-6">
              {decision.candidates.map((cand) => (
                <CandidateCard
                  key={cand.candidateId}
                  candidate={cand}
                  score={decision.scores[cand.candidateId]}
                  deterministic={decision.deterministicChecks[cand.candidateId]}
                  evidence={decision.evidenceChecks[cand.candidateId]}
                  isWinner={decision.chosenCandidateId === cand.candidateId}
                />
              ))}
            </div>
          </div>

          {/* Evidence Inspector */}
          <EvidenceInspector
            documents={currentScenario.payload.evidenceDocuments || []}
            evidenceChecks={decision.evidenceChecks}
          />
        </div>
      )}

      {/* Raw Decision JSON Modal */}
      {rawModalOpen && decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel-elevated rounded-2xl w-full max-w-[calc(100vw-1.5rem)] sm:max-w-3xl p-4 sm:p-6 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2 min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white font-mono truncate">
                Decision Record: {decision.decisionId}
              </h3>
              <button
                onClick={() => setRawModalOpen(false)}
                className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 flex-shrink-0"
              >
                Close
              </button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto">
              <pre className="p-3 sm:p-4 rounded-xl bg-slate-950 font-mono text-[11px] sm:text-xs text-emerald-400 whitespace-pre-wrap break-all sm:break-words overflow-x-auto select-text">
                {JSON.stringify(decision, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
