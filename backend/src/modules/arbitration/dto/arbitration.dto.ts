import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ArbitrationStrategyType } from '../../../common/types';

export class CitationDto {
  @ApiProperty({ example: 'cit-1' })
  @IsString()
  @IsNotEmpty()
  citationId: string;

  @ApiProperty({ example: 'source-10k-q3' })
  @IsString()
  @IsNotEmpty()
  sourceId: string;

  @ApiPropertyOptional({ example: 'https://sec.gov/filings/10k.pdf' })
  @IsString()
  @IsOptional()
  uri?: string;

  @ApiPropertyOptional({ example: 'Q3 Financial 10-K Report' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Net income was $45.2M in Q3 2024.' })
  @IsString()
  @IsOptional()
  claimedFact?: string;

  @ApiPropertyOptional({ example: 'Operating revenue reached $128.4M.' })
  @IsString()
  @IsOptional()
  sourceExcerpt?: string;
}

export class CandidateDto {
  @ApiProperty({ example: 'cand-1' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  candidateId: string;

  @ApiProperty({ example: 'gemini-1.5-pro' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  modelId: string;

  @ApiProperty({ example: 'Company Q3 revenue reached $128.4M with net income of $45.2M.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  output: string;

  @ApiPropertyOptional({ example: { revenue: 128400000, netIncome: 45200000 } })
  @IsObject()
  @IsOptional()
  parsedOutput?: Record<string, any>;

  @ApiPropertyOptional({ type: [CitationDto] })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CitationDto)
  citations?: CitationDto[];

  @ApiPropertyOptional({ example: 0.94 })
  @IsNumber()
  @IsOptional()
  confidenceScore?: number;

  @ApiProperty({ example: 420 })
  @IsNumber()
  latencyMs: number;

  @ApiProperty({ example: 0.0035 })
  @IsNumber()
  costUsd: number;

  @ApiPropertyOptional({ example: { promptTokens: 350, completionTokens: 120, totalTokens: 470 } })
  @IsObject()
  @IsOptional()
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isSimulated?: boolean;
}

export class EvidenceDocumentDto {
  @ApiProperty({ example: 'source-10k-q3' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  sourceId: string;

  @ApiProperty({ example: 'SEC 10-K Quarterly Filing Q3' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  title: string;

  @ApiPropertyOptional({ example: 'https://sec.gov/filings/10k.pdf' })
  @IsString()
  @IsOptional()
  @MaxLength(1024)
  uri?: string;

  @ApiProperty({ example: 'The company recorded revenue of $128.4 million and consolidated net income of $45.2 million for the quarter ended September 30.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;

  @ApiPropertyOptional({ example: 'v2.1' })
  @IsString()
  @IsOptional()
  version?: string;

  @ApiPropertyOptional({ example: '2024-10-15' })
  @IsString()
  @IsOptional()
  lastUpdated?: string;
}

export class EvaluateCandidatesDto {
  @ApiPropertyOptional({ example: 'tenant-enterprise-1' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  tenantId?: string;

  @ApiPropertyOptional({ example: 'workspace-prod-a' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  workspaceId?: string;

  @ApiPropertyOptional({ example: 'req-98765' })
  @IsString()
  @IsOptional()
  @MaxLength(64)
  requestId?: string;

  @ApiProperty({ example: 'Extract key financial metrics from Q3 filing' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  task: string;

  @ApiPropertyOptional({ example: 'strict-financial-v1' })
  @IsString()
  @IsOptional()
  policyId?: string;

  @ApiPropertyOptional({
    enum: ['DETERMINISTIC_RULES', 'WEIGHTED_SCORING', 'JUDGE_MODEL_ASSESSMENT', 'HYBRID_SAFE'],
    example: 'HYBRID_SAFE',
  })
  @IsEnum(['DETERMINISTIC_RULES', 'WEIGHTED_SCORING', 'JUDGE_MODEL_ASSESSMENT', 'HYBRID_SAFE'])
  @IsOptional()
  strategy?: ArbitrationStrategyType;

  @ApiProperty({ type: [CandidateDto], description: 'List of model candidate responses (2 to 10 candidates)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CandidateDto)
  candidates: CandidateDto[];

  @ApiPropertyOptional({ type: [EvidenceDocumentDto], description: 'Verified ground truth evidence documents' })
  @IsArray()
  @IsOptional()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => EvidenceDocumentDto)
  evidenceDocuments?: EvidenceDocumentDto[];

  @ApiPropertyOptional({ description: 'Expected JSON Schema for structured validation' })
  @IsObject()
  @IsOptional()
  expectedSchema?: Record<string, any>;

  @ApiPropertyOptional({ example: ['revenue', 'netIncome'], description: 'Required fields in structured response' })
  @IsArray()
  @IsOptional()
  requiredFields?: string[];

  @ApiPropertyOptional({ example: 'Revenue: $128.4M', description: 'Canonical answer for exact match comparison' })
  @IsString()
  @IsOptional()
  canonicalAnswer?: string;

  @ApiPropertyOptional({ example: false, description: 'Mark whether candidates are simulated or measured' })
  @IsBoolean()
  @IsOptional()
  isSimulated?: boolean;
}
