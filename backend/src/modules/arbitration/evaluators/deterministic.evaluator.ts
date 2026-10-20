import { Injectable, Logger } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  CandidateResponse,
  DeterministicCheckResult,
  CheckViolation,
  ArbitrationPolicy,
} from '../../../common/types';

@Injectable()
export class DeterministicEvaluator {
  private readonly logger = new Logger(DeterministicEvaluator.name);
  private readonly ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  evaluate(
    candidate: CandidateResponse,
    policy: ArbitrationPolicy,
    expectedSchema?: Record<string, any>,
    requiredFields?: string[],
    canonicalAnswer?: string,
  ): DeterministicCheckResult {
    let parsed: Record<string, any> | null = candidate.parsedOutput || null;
    let jsonParseError: string | null = null;

    // Try parsing output if output appears to be JSON
    if (!parsed && typeof candidate.output === 'string') {
      const trimmed = candidate.output.trim();
      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))
      ) {
        try {
          parsed = JSON.parse(trimmed);
        } catch (e: any) {
          jsonParseError = `Failed to parse JSON output: ${e.message}`;
        }
      }
    }

    // 1. Required Fields Check
    const missingFields: string[] = [];
    if (requiredFields && requiredFields.length > 0) {
      if (!parsed || typeof parsed !== 'object') {
        missingFields.push(...requiredFields);
      } else {
        for (const field of requiredFields) {
          if (parsed[field] === undefined || parsed[field] === null || parsed[field] === '') {
            missingFields.push(field);
          }
        }
      }
    }

    // 2. JSON Schema Validation
    const schemaViolations: CheckViolation[] = [];
    if (expectedSchema) {
      if (jsonParseError) {
        schemaViolations.push({
          field: 'root',
          checkType: 'JSON_SYNTAX',
          message: jsonParseError,
          severity: 'CRITICAL',
        });
      } else if (!parsed) {
        schemaViolations.push({
          field: 'root',
          checkType: 'SCHEMA_COMPLIANCE',
          message: 'Expected structured JSON object matching schema, but received plain text or empty payload.',
          severity: 'CRITICAL',
        });
      } else {
        const validate = this.ajv.compile(expectedSchema);
        const valid = validate(parsed);
        if (!valid && validate.errors) {
          for (const err of validate.errors) {
            schemaViolations.push({
              field: err.instancePath || err.schemaPath,
              checkType: 'SCHEMA_VIOLATION',
              message: `${err.instancePath || 'root'}: ${err.message}`,
              severity: 'CRITICAL',
            });
          }
        }
      }
    }

    // 3. Type Constraints (e.g., string lengths, numeric bounds)
    const typeViolations: CheckViolation[] = [];
    if (candidate.output.length > 50000) {
      typeViolations.push({
        field: 'output',
        checkType: 'LENGTH_BOUND',
        message: 'Output exceeds maximum permissible length of 50,000 characters.',
        severity: 'CRITICAL',
      });
    }

    // 4. Policy Checks (Forbidden terms, safety rules)
    const forbiddenTermsFound: string[] = [];
    const lowerOutput = candidate.output.toLowerCase();
    if (policy.forbiddenKeywords && policy.forbiddenKeywords.length > 0) {
      for (const term of policy.forbiddenKeywords) {
        if (lowerOutput.includes(term.toLowerCase())) {
          forbiddenTermsFound.push(term);
        }
      }
    }

    // 5. Exact Match Check (if canonical answer provided)
    let exactMatchCheck: { passed: boolean; similarityScore?: number } | undefined;
    if (canonicalAnswer !== undefined && canonicalAnswer !== null) {
      const normCanonical = canonicalAnswer.trim().toLowerCase();
      const normOutput = candidate.output.trim().toLowerCase();
      const isExact = normCanonical === normOutput;

      // Compute character/token similarity
      let score = 0;
      if (isExact) {
        score = 1.0;
      } else if (normOutput.includes(normCanonical)) {
        score = 0.8;
      } else {
        // Simple Jaccard similarity of words
        const s1 = new Set(normCanonical.split(/\s+/));
        const s2 = new Set(normOutput.split(/\s+/));
        const intersection = new Set([...s1].filter((x) => s2.has(x)));
        const union = new Set([...s1, ...s2]);
        score = union.size > 0 ? intersection.size / union.size : 0;
      }

      exactMatchCheck = {
        passed: isExact || score >= 0.75,
        similarityScore: Math.round(score * 100) / 100,
      };
    }

    // Determine overall deterministic pass
    const passedRequiredFields = missingFields.length === 0;
    const passedSchema = schemaViolations.length === 0;
    const passedType = typeViolations.length === 0;
    const passedPolicy = forbiddenTermsFound.length === 0;
    const passedExact = exactMatchCheck ? exactMatchCheck.passed : true;

    const overallPassed =
      passedRequiredFields &&
      passedSchema &&
      passedType &&
      passedPolicy &&
      passedExact;

    let disqualificationReason: string | undefined;
    if (!overallPassed) {
      if (!passedSchema) {
        disqualificationReason = `JSON schema validation failed: ${schemaViolations[0]?.message}`;
      } else if (!passedRequiredFields) {
        disqualificationReason = `Missing required fields: ${missingFields.join(', ')}`;
      } else if (!passedPolicy) {
        disqualificationReason = `Forbidden terms detected: ${forbiddenTermsFound.join(', ')}`;
      } else if (!passedType) {
        disqualificationReason = `Type constraint violation: ${typeViolations[0]?.message}`;
      } else if (!passedExact) {
        disqualificationReason = `Failed exact match check against canonical truth.`;
      }
    }

    return {
      candidateId: candidate.candidateId,
      passed: overallPassed,
      requiredFieldsCheck: {
        passed: passedRequiredFields,
        missingFields,
      },
      jsonSchemaCheck: {
        passed: passedSchema,
        violations: schemaViolations,
      },
      typeConstraintsCheck: {
        passed: passedType,
        violations: typeViolations,
      },
      policyCheck: {
        passed: passedPolicy,
        forbiddenTermsFound,
        safetyPassed: passedPolicy,
      },
      exactMatchCheck,
      disqualificationReason,
    };
  }
}
