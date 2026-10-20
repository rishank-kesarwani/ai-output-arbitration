import { Injectable, Logger } from '@nestjs/common';
import {
  CandidateResponse,
  EvidenceCheckResult,
  EvidenceDocument,
  ArbitrationPolicy,
} from '../../../common/types';

@Injectable()
export class EvidenceEvaluator {
  private readonly logger = new Logger(EvidenceEvaluator.name);

  evaluate(
    candidate: CandidateResponse,
    allCandidates: CandidateResponse[],
    evidenceDocuments: EvidenceDocument[],
    policy: ArbitrationPolicy,
  ): EvidenceCheckResult {
    const candidateCitations = candidate.citations || [];
    const evidenceMap = new Map<string, EvidenceDocument>();
    for (const doc of evidenceDocuments) {
      evidenceMap.set(doc.sourceId, doc);
    }

    // 1. Citation Presence Check
    const citationPresence = {
      required: policy.requireEvidence,
      present: candidateCitations.length > 0,
    };

    // 2. Reference Resolution (Detect Phantom / Hallucinated Citations)
    const phantomCitations: string[] = [];
    const verifiedCitations: string[] = [];

    for (const citation of candidateCitations) {
      if (evidenceMap.has(citation.sourceId)) {
        verifiedCitations.push(citation.sourceId);
      } else {
        phantomCitations.push(citation.sourceId);
      }
    }

    // 3. Source Support Calculation
    // Critical rule: DO NOT turn missing evidence into a passing score!
    let supportScore = 0;
    const unsupportedFacts: string[] = [];
    let hasMissingEvidence = false;

    if (policy.requireEvidence && evidenceDocuments.length === 0) {
      // Evidence is required by policy, but zero evidence documents were provided
      hasMissingEvidence = true;
      supportScore = 0.0;
      unsupportedFacts.push('Entire evidence repository is missing or empty.');
    } else if (candidateCitations.length === 0) {
      if (policy.requireEvidence) {
        hasMissingEvidence = true;
        supportScore = 0.0;
        unsupportedFacts.push('Candidate provides zero citations despite policy requirement.');
      } else {
        // Evidence not strictly required by policy, give baseline neutral support
        supportScore = 0.5;
      }
    } else {
      // Evaluate support of each citation against its source document
      let totalSupportWeight = 0;
      let earnedSupport = 0;

      for (const citation of candidateCitations) {
        totalSupportWeight += 1;
        const sourceDoc = evidenceMap.get(citation.sourceId);

        if (!sourceDoc) {
          unsupportedFacts.push(
            `Phantom source reference [${citation.sourceId}] does not resolve to any verified document.`,
          );
          continue;
        }

        // Measure factual overlap between claimed fact (or candidate text) and source content
        const claimText = (citation.claimedFact || citation.sourceExcerpt || candidate.output).toLowerCase();
        const sourceContent = sourceDoc.content.toLowerCase();

        // Meaningful tokens: words and numbers (including decimals like 45.2), ignoring common stop words
        const stopWords = new Set(['the', 'and', 'with', 'for', 'was', 'were', 'had', 'has', 'have', 'from', 'that', 'this']);
        const claimTokens = (claimText.match(/[a-z0-9]+(?:\.[0-9]+)?/g) || [])
          .filter((t) => t.length >= 2 && !stopWords.has(t));

        if (claimTokens.length === 0) {
          earnedSupport += 0.5;
          continue;
        }

        let matchedTokens = 0;
        for (const token of claimTokens) {
          if (sourceContent.includes(token)) {
            matchedTokens++;
          }
        }

        const overlapRatio = matchedTokens / claimTokens.length;
        if (overlapRatio >= 0.35) {
          earnedSupport += Math.min(1.0, overlapRatio * 1.25);
        } else {
          unsupportedFacts.push(
            `Claim citing [${citation.sourceId}] has low factual overlap (${Math.round(
              overlapRatio * 100,
            )}%) with source text.`,
          );
        }
      }

      supportScore =
        totalSupportWeight > 0
          ? Math.min(1.0, Math.round((earnedSupport / totalSupportWeight) * 100) / 100)
          : 0.0;
    }

    // 4. Contradiction Detection
    // Check 4a: Contradiction against evidence documents
    let contradictsSource = false;
    const conflictingDetails: string[] = [];

    // Simple numeric and key phrase contradiction check
    // Extracts numbers (like amounts, dates, percentages)
    const extractNumbers = (text: string): string[] => {
      const matches = text.match(/\b\d+(?:[\.,]\d+)?%?(?:M|B|k|K)?\b/g);
      return matches || [];
    };

    const candidateNumbers = extractNumbers(candidate.output);
    for (const sourceDoc of evidenceDocuments) {
      const sourceNumbers = new Set(extractNumbers(sourceDoc.content));
      // If candidate mentions specific quantities/numbers not supported anywhere in source
      for (const num of candidateNumbers) {
        if (!sourceNumbers.has(num) && policy.requireEvidence && evidenceDocuments.length > 0) {
          // If candidate cites this doc specifically but number is inverted or absent
          for (const cit of candidateCitations) {
            if (cit.sourceId === sourceDoc.sourceId && cit.claimedFact?.includes(num)) {
              contradictsSource = true;
              conflictingDetails.push(
                `Numerical claim "${num}" in candidate contradicted by source document [${sourceDoc.sourceId}].`,
              );
            }
          }
        }
      }
    }

    // Check 4b: Mutual Contradictions across other candidates
    let contradictsOtherCandidates = false;
    for (const other of allCandidates) {
      if (other.candidateId === candidate.candidateId) continue;
      const otherNumbers = extractNumbers(other.output);
      const conflictingNumbers = candidateNumbers.filter(
        (n) => !otherNumbers.includes(n) && otherNumbers.length > 0,
      );

      if (conflictingNumbers.length >= 2) {
        contradictsOtherCandidates = true;
        conflictingDetails.push(
          `Conflicting data points [${conflictingNumbers.slice(0, 3).join(', ')}] with candidate [${
            other.candidateId
          }] (${other.modelId}).`,
        );
      }
    }

    // 5. Determine Overall Evidence Pass / Disqualification
    let passed = true;
    let disqualificationReason: string | undefined;

    if (policy.requireEvidence && hasMissingEvidence) {
      passed = false;
      disqualificationReason =
        'Missing ground truth evidence: policy requires citation verification, but evidence was absent or incomplete.';
    } else if (policy.disallowPhantomCitations && phantomCitations.length > 0) {
      passed = false;
      disqualificationReason = `Phantom citations detected: references non-existent sources [${phantomCitations.join(
        ', ',
      )}].`;
    } else if (policy.disallowContradictions && contradictsSource) {
      passed = false;
      disqualificationReason = `Contradiction detected: candidate directly contradicts verified evidence document.`;
    } else if (policy.requireEvidence && supportScore < 0.5) {
      passed = false;
      disqualificationReason = `Insufficient source support score (${Math.round(
        supportScore * 100,
      )}% < 50% threshold).`;
    }

    return {
      candidateId: candidate.candidateId,
      passed,
      citationPresence,
      referenceResolution: {
        totalCitations: candidateCitations.length,
        resolvedCitations: verifiedCitations.length,
        phantomCitations,
      },
      sourceSupport: {
        supportScore,
        hasMissingEvidence,
        unsupportedFacts,
        verifiedCitations,
      },
      contradictionFlags: {
        contradictsSource,
        contradictsOtherCandidates,
        conflictingDetails,
      },
      disqualificationReason,
    };
  }
}
