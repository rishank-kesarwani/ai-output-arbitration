# 🛡️ AI Output Arbitration & Trust Layer

[![Backend Build & Tests](https://img.shields.io/badge/Backend-Passing-emerald?logo=nestjs)](file:///backend)
[![Frontend Build & Verification](https://img.shields.io/badge/Frontend-Verified-blue?logo=next.js)](file:///frontend)
[![Security & Evidence-Aware](https://img.shields.io/badge/Evidence--Aware-Calibrated%20Abstention-amber)](file:///backend/src/modules/arbitration/evaluators/evidence.evaluator.ts)
[![Audit Integrity](https://img.shields.io/badge/Audit-SHA--256%20Digest-purple)](file:///backend/src/modules/audit/audit.service.ts)

A production-grade, evidence-aware AI output arbitration engine that evaluates conflicting model answers, enforces deterministic format constraints and JSON schemas, resolves source citations, flags factual contradictions, and executes calibrated abstention or human review escalations.

> **CRITICAL TRUST INVARIANT:**  
> The system **never** implies that an answer is true simply because multiple LLMs agree (consensus ≠ truth). Missing ground truth evidence **never** silently turns into a passing score; instead, it triggers calibrated abstention.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Client [Frontend Layer (Vercel)]
        UI["Next.js 14 Responsive UI<br/>(Tailwind CSS + Glassmorphism)"]
        Console["Trust Console & Reproducible Scenarios"]
        QueueUI["Human Review Queue Console"]
        AuditUI["Decision Audit Explorer & SHA-256 Badges"]
        PolicyUI["Tenant Policy Rules & Sliders"]
    end

    subgraph Backend [Backend API Gateway (Render)]
        Nest["NestJS Core Service<br/>(Port: process.env.PORT || 4000)"]
        Prefix["Global Prefix: /api/v1<br/>(Dual /health & /api/v1/health Support)"]
        Guard["TenantGuard & ApiKeyGuard<br/>(Tenant Isolation & Mutation Auth)"]
        Filter["Sanitizing AllExceptionsFilter<br/>(Correlation ID & Zero Leakage)"]
    end

    subgraph Arbitration [Arbitration & Evaluation Engine]
        DetEval["Deterministic Evaluator<br/>(Ajv JSON Schema, Types, Policy Blacklist)"]
        EvidEval["Evidence Evaluator<br/>(Citation Resolver, Phantom Detector, Support Overlap)"]
        Strategies["Arbitration Strategies<br/>(HYBRID_SAFE, DETERMINISTIC, WEIGHTED, JUDGE)"]
        Abstention["Calibrated Abstention Engine<br/>(Failsafe Missing Evidence & Low Confidence)"]
    end

    subgraph Integrations [Shared Services (Resilient Integrations)]
        AIPlatform["AI Platform Service<br/>(LLM-Judge Evaluation via /ai/chat)"]
        Notification["Notification Service<br/>(POST /v1/notifications Critical Alert)"]
        Regression["Model Regression Detection<br/>(Benchmark Comparison)"]
    end

    subgraph Storage [Persistence & Audit Layer]
        AuditStore["Audit Service<br/>(SHA-256 Cryptographic Signature Digest)"]
        ReviewQueue["Human Review Queue<br/>(Pending Escalation & Resolution Audit)"]
        PolicyStore["Policy Store<br/>(Tenant Scoped with Version Increments)"]
    end

    UI -->|REST /api/v1| Nest
    Nest --> Prefix --> Guard --> Filter
    Filter --> DetEval
    Filter --> EvidEval
    DetEval & EvidEval --> Strategies --> Abstention
    Strategies -.-> AIPlatform
    Abstention -->|Escalation Alert| Notification
    Strategies -.-> Regression
    Abstention --> ReviewQueue
    Strategies --> AuditStore
    Nest --> PolicyStore
```

---

## 🚀 Key Capabilities

### 1. Deterministic Validation Gates
- **JSON Schema Validation:** Complete recursive Ajv schema validation supporting standard types, required fields, enum constraints, and numeric ranges.
- **Syntax Fault Tolerance:** Distinguishes between unparseable JSON syntax, missing keys, and schema violations.
- **Safety Policy Enforcement:** Configurable forbidden keyword blacklists, disallowed tokens, and PII pattern checks.
- **Exact & Normalized Match:** Compares against canonical ground-truth answers using token similarity metrics.

### 2. Evidence-Aware Grounding & Phantom Citation Detection
- **Citation Presence:** Validates citation existence against policy rules.
- **Reference Resolution:** Resolves each cited `sourceId` against provided ground truth `evidenceDocuments`. **Phantom / hallucinated citations are flagged and disqualified.**
- **Factual Overlap Calculation:** Calculates lexical and n-gram overlap between claimed facts and source texts.
- **Contradiction Detection:** Detects direct numerical contradictions (e.g., $142M vs $128.4M) between candidate claims and source documents, as well as mutual contradictions across competing models.
- **Missing Evidence Handling:** If ground truth evidence is missing, the system **refuses to guess** or pass unverified consensus. It returns a support score of `0.0` and triggers calibrated abstention.

### 3. Configurable Arbitration Strategies
- **`HYBRID_SAFE` (Recommended):** Hard deterministic gate first (schema syntax + safety + phantom citation check), followed by multi-factor weighted scoring on surviving candidates.
- **`DETERMINISTIC_RULES`:** Strict sequential elimination filter (Schema -> Policy -> Evidence -> Cost/Latency tie-break).
- **`WEIGHTED_SCORING`:** Multi-factor scalar utility index with transparent weights (Evidence: 35-50%, Schema: 20-25%, Policy: 20%, Cost: 10%, Latency: 10%).
- **`JUDGE_MODEL_ASSESSMENT`:** Integrates with the shared AI Platform for subjective nuance, accompanied by explicit disclaimers that judge models do not constitute ground truth.

### 4. Calibrated Abstention & Human Review Queue
- Decisions that fall below the policy confidence threshold or exhibit unresolvable factual contradictions are queued for human review.
- Sends escalation alerts via **Notification Service** (`POST /v1/notifications`).
- Provides an adjudication console with candidate diffs, audit commentary inputs, and Approve / Reject / Override actions.

### 5. Cryptographic Decision Ledger
- Every decision produces an immutable `DecisionRecord` stamped with a **SHA-256 cryptographic signature digest** generated over the decision ID, tenant, outcome, candidate IDs, and timestamp.
- Redacts sensitive credentials, tokens, and authorization headers from logs and audit metadata.

---

## 🧪 Reproducible Test Console Scenarios

The platform includes 5 pre-loaded, real-world evaluation scenarios:

| Scenario | Focus Area | Expected Outcome | Key Verification |
| :--- | :--- | :--- | :--- |
| **1. Financial 10-K Conflict** | Conflicting earnings figures | `SELECTED` (Model A) | Model A matches SEC 10-K filing; Model B disqualified for numerical contradiction. |
| **2. Clinical Pediatric Dosage** | Medical safety guidelines | `SELECTED` (Model A) | Model B disqualified for citing non-existent clinical trial (phantom citation). |
| **3. JSON Schema Order** | Structured output parsing | `SELECTED` (Model A) | Model B disqualified for unclosed JSON syntax; Model C rejected for missing `currency`. |
| **4. Unverified Consensus** | Missing evidence abstention | `ABSTAINED` (`MISSING_EVIDENCE`) | Models agree on fact, but evidence is missing. System refuses to assume truth from consensus. |
| **5. Contradictory Timestamps** | Temporal contradiction | `ESCALATED_TO_HUMAN_REVIEW` | Competing models assert conflicting times; automatically queued for human adjudication. |

---

## 🔗 Shared Service Integrations

### 1. Shared AI Platform
- **Endpoint:** `POST /ai/chat` (or `/api/v1/chat`)
- **Authentication:** Header `x-api-key: <AI_PLATFORM_API_KEY>`
- **Resilience:** Bounded timeout (5000ms), zero blocking retries, safe fallback when offline.

### 2. Notification Service
- **Endpoint:** `POST /v1/notifications`
- **Authentication:** Header `x-api-key: <NOTIFICATION_SERVICE_API_KEY>`
- **Payload Contract:**
  ```json
  {
    "priority": "CRITICAL",
    "channels": ["EMAIL"],
    "recipient": {
      "userId": "reviewer-tenant-1",
      "email": "reviewer@corp.internal"
    },
    "email": {
      "subject": "[CRITICAL REVIEW] AI Output Escalation",
      "html": "<p>Escalation details...</p>"
    }
  }
  ```
- **Resilience:** Safe async dispatch; failure never crashes arbitration.

### 3. Model Regression Detection
- **Endpoint:** `POST /evaluations/benchmark`
- **Authentication:** Header `x-api-key: <MODEL_REGRESSION_SERVICE_API_KEY>`
- **Fallback:** In-memory statistical benchmark comparison when external service is offline.

---

## 📦 Independent Application Structure

```
ai-output-arbitration/
├── backend/                  # NestJS service deployed to Render
│   ├── src/
│   │   ├── common/           # AllExceptionsFilter, TenantGuard, ApiKeyGuard, LoggingInterceptor
│   │   ├── config/           # Validated configuration loader
│   │   ├── modules/
│   │   │   ├── arbitration/  # Evaluators, Strategies, ArbitrationService, Controller
│   │   │   ├── audit/        # AuditService with SHA-256 signatures & redaction
│   │   │   ├── health/       # HealthController (/health, /health/live, /health/ready, /api/v1/health)
│   │   │   ├── integrations/ # Resilient clients for AI Platform, Notifications, Regression
│   │   │   ├── policies/     # Tenant policy management & versioning
│   │   │   ├── review-queue/ # Human review queue with adjudication actions
│   │   │   └── seed/         # Preloaded reproducible test scenarios
│   │   ├── app.controller.ts # Root index / discovery
│   │   ├── app.module.ts
│   │   └── main.ts           # Entrypoint with Helmet, Compression, Swagger, Global Prefix
│   ├── test/                 # E2E integration tests (jest-e2e.json)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                 # Next.js 14 frontend deployed to Vercel
│   ├── src/
│   │   ├── app/              # App Router: /, /queue, /audit, /policies
│   │   ├── components/       # Navbar, CandidateCard, EvidenceInspector, StatusBanner, MetricsBar
│   │   └── lib/              # Types, API Client, Default Scenarios
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── render.yaml               # Render infrastructure-as-code deployment manifest
├── vercel.json               # Vercel deployment manifest
└── README.md
```

---

## 🔐 Environment Variables & Access Control Model

### Environment-Controlled Public / Demo Access
The platform implements an independent frontend and backend environment-controlled access model:
- **Frontend Flag (`NEXT_PUBLIC_ACCESS_ENABLED`):** Controls presentation and interactivity of public demo controls (e.g., interactive arbitration evaluations, demo scenario selector).
- **Backend Flag (`PUBLIC_ACCESS_ENABLED`):** Independently enforces whether explicitly designated demo routes accept anonymous requests. When disabled, anonymous requests are rejected with `401 Unauthorized`.
- **Protected Mutations:** Sensitive actions (policy creation/updating, human review adjudication, and benchmark evaluations) **always** require valid `x-api-key` authorization, regardless of public access flags.

#### 4-Way Access Configuration Matrix
| Frontend (`NEXT_PUBLIC_ACCESS_ENABLED`) | Backend (`PUBLIC_ACCESS_ENABLED`) | User Experience & Security Behavior |
| :--- | :--- | :--- |
| **`true`** | **`true`** | **Full Public Demo Mode:** Trust Console evaluations and preloaded seed scenarios run seamlessly for anonymous demo users. Protected mutations remain secured by `x-api-key`. |
| **`true`** | **`false`** | **Backend Enforced Lockdown:** Frontend presents demo UI, but backend independently rejects direct and frontend anonymous evaluations with `401 Unauthorized` (`Public demo access is disabled`). Frontend flag cannot override backend enforcement. |
| **`false`** | **`true`** | **UI Suppressed Mode:** Frontend disables the "Run Arbitration" button, suppresses auto-execution on mount, and presents a public-access-disabled banner. |
| **`false`** | **`false`** | **Fully Restricted / Production Mode:** Frontend disables demo interactions and backend rejects all unauthenticated requests. Only clients presenting valid `x-api-key` headers can perform evaluations or mutations. |

---

### Endpoint Security & Access Classification
| Endpoint | Method | Classification | Auth Guard | Access When Public Disabled |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `GET` | Discovery / Info | None | Allowed (public status) |
| `/health`, `/health/live`, `/health/ready` | `GET` | System Probes | None | Allowed (K8s/Render probes) |
| `/api/v1/seed/scenarios` | `GET` | Public / Demo Seed | `PublicAccessGuard` | Requires `x-api-key` |
| `/api/v1/arbitration/evaluate` | `POST` | Public / Demo Eval | `TenantGuard`, `PublicAccessGuard` | Requires `x-api-key` |
| `/api/v1/arbitration/decisions` | `GET` | Tenant Audit Ledger | `TenantGuard`, `PublicAccessGuard` | Requires `x-api-key` |
| `/api/v1/arbitration/metrics` | `GET` | Tenant Metrics | `TenantGuard`, `PublicAccessGuard` | Requires `x-api-key` |
| `/api/v1/policies` | `GET` | Tenant Policy Read | `TenantGuard`, `PublicAccessGuard` | Requires `x-api-key` |
| `/api/v1/review-queue` | `GET` | Queue Read | `TenantGuard`, `PublicAccessGuard` | Requires `x-api-key` |
| `/api/v1/policies` | `POST` | **Protected Mutation** | `TenantGuard`, `ApiKeyGuard` | **Always requires `x-api-key`** |
| `/api/v1/review-queue/:id/resolve` | `POST` | **Protected Adjudication**| `TenantGuard`, `ApiKeyGuard` | **Always requires `x-api-key`** |
| `/api/v1/arbitration/benchmark` | `POST` | **Protected Integration** | `ApiKeyGuard` | **Always requires `x-api-key`** |

---

### Backend Runtime Variables (`backend/.env`)
| Variable | Ownership | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `PORT` | Backend Runtime | Service binding port | `4000` |
| `NODE_ENV` | Backend Runtime | Environment mode (`development` / `production`) | `production` |
| `API_PREFIX` | Backend Runtime | Global route prefix | `api/v1` |
| `PUBLIC_ACCESS_ENABLED` | Backend Config | Allows anonymous requests on designated public routes | `true` |
| `JWT_SECRET` | Backend Secret | Secret for token signing | `min_32_chars_secret` |
| `SERVICE_API_KEY` | Backend Secret | Administrative API key for mutations and restricted access | `placeholder_arbitration_key` |
| `AI_PLATFORM_URL` | Backend Config | Shared AI Platform endpoint | `https://ai-platform.onrender.com` |
| `AI_PLATFORM_API_KEY` | Backend Secret | Authentication key for AI Platform | (Managed via Render) |
| `NOTIFICATION_SERVICE_URL` | Backend Config | Notification service endpoint | `https://notification-service.onrender.com` |
| `NOTIFICATION_SERVICE_API_KEY`| Backend Secret | Authentication key for notification service | (Managed via Render) |
| `MODEL_REGRESSION_SERVICE_URL`| Backend Config | Regression service endpoint | `https://ai-model-regression-detection.onrender.com` |

### Frontend Public Variables (`frontend/.env.local`)
| Variable | Ownership | Description | Default / Example |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Frontend Public | Complete direct-backend API base URL (including `/api/v1`) | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_ACCESS_ENABLED` | Frontend Public | Toggle public demo evaluation controls in UI | `true` |

> **IMPORTANT (Vercel Build-Time Bundling):**  
> In Next.js, all `NEXT_PUBLIC_*` environment variables are bundled directly into the client JavaScript bundle at build time. Changing these variables in Vercel project settings requires triggering a new build/deployment for changes to take effect in user browsers.
>
> **Security Invariant:**  
> Never treat `NEXT_PUBLIC_*` as a security boundary. Backend secrets (`SERVICE_API_KEY`, `JWT_SECRET`, downstream service keys) must never be placed in frontend variables.

---

## 🛠️ Verification & Testing Commands

### Backend Verification (Independent)
```bash
cd backend
npm install
npm run lint         # ESLint validation
npm test             # Unit tests (evaluators, strategies, bounds, guards)
npm run test:e2e     # E2E integration tests (routing, SSRF, boundary, public access toggle, mutations)
npm run build        # TypeScript compilation
npm run start:prod   # Starts production server on 0.0.0.0:4000
```

### Frontend Verification (Independent)
```bash
cd frontend
npm install
npm run lint         # Next.js ESLint validation
npm test             # Unit tests (API client URL resolution, boolean parsing, headers)
npm run build        # Production Next.js build (all static routes prerendered)
npm run start        # Starts Next.js production server on port 3000
```

### Health & Routing Probe Checks
```bash
# Root discovery (reports operational status and publicAccessEnabled)
curl -s http://localhost:4000/

# Health probes (unprefixed for Render / Kubernetes)
curl -s http://localhost:4000/health
curl -s http://localhost:4000/health/live
curl -s http://localhost:4000/health/ready

# Health probe (prefixed for API consumers)
curl -s http://localhost:4000/api/v1/health

# Public demo evaluation (when PUBLIC_ACCESS_ENABLED=true)
curl -s -X POST http://localhost:4000/api/v1/arbitration/evaluate \
  -H "Content-Type: application/json" \
  -d '{"task":"Test","candidates":[{"candidateId":"c1","modelId":"m1","output":"42","latencyMs":100,"costUsd":0.001}]}'

# Protected policy mutation (requires x-api-key)
curl -s -X POST http://localhost:4000/api/v1/policies \
  -H "Content-Type: application/json" \
  -H "x-api-key: <SERVICE_API_KEY>" \
  -d '{"policyId":"general-qa-v1","name":"Updated Policy"}'
```

---

## 🚀 Deployment Specifications

### Render (Backend)
- **Repository Root:** `backend/`
- **Build Command:** `npm install --include=dev && npm run build` (or `npm install && npm run build`)
- **Start Command:** `npm run start:prod`
- **Health Check Path:** `/health`
- **Binding Address:** `0.0.0.0`
- **Build Filter:** `backend/**`
- **Environment Variables:** Set `PUBLIC_ACCESS_ENABLED` to `true` (or `false` for restricted environments), along with runtime secrets (`SERVICE_API_KEY`, `JWT_SECRET`, etc.).

### Vercel (Frontend)
- **Repository Root:** `frontend/`
- **Framework:** `Next.js`
- **Build Command:** `npm run build`
- **Install Command:** `npm install`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: Set to the complete backend API base URL with prefix (e.g., `https://ai-output-arbitration-backend.onrender.com/api/v1`).
  - `NEXT_PUBLIC_ACCESS_ENABLED`: Set to `true` for public demo mode or `false` to disable demo evaluation UI.
  - `NEXT_PUBLIC_UNOPTIMIZED_IMAGES`: Set to `true` to immediately bypass Vercel's serverless Image Optimization endpoint (`/_next/image`) during team transformation allowance exhaustion.
  - *Trigger a redeployment/rebuild after changing these variables.*

---

## 🖼️ Vercel Image Optimization & Performance Strategy

Vercel plans include a quota of **5,000 monthly image transformations** shared across all projects under the team account. Unconstrained usage of `next/image` with default settings generates up to 16 transformation variants per image, re-transforming them every 60 seconds upon cache expiration.

This repository enforces a strict, zero-waste image optimization architecture ensuring fast Core Web Vitals without consuming unnecessary Vercel transformation credits.

### 1. Image Asset Inventory & Delivery Strategy

| Asset Path | Type / Dimensions | Raw Size | WebP Size | Optimization Strategy | Transformations Consumed |
|---|---|---|---|---|---|
| `public/icon.svg` | Vector SVG | 2.2 KB | N/A | Static Direct (`unoptimized: true`) | **0** |
| `public/logo.svg` | Vector SVG | 2.3 KB | N/A | Static Direct (`unoptimized: true`) | **0** |
| `public/favicon.ico` | Multi-res ICO | 3.6 KB | N/A | Static Metadata Direct | **0** |
| `public/favicon-16x16.png` | PNG (16x16) | 391 B | 256 B | Static Direct (`unoptimized: true`) | **0** |
| `public/favicon-32x32.png` | PNG (32x32) | 695 B | 398 B | Static Direct (`unoptimized: true`) | **0** |
| `public/apple-touch-icon.png` | PNG (180x180) | 2.4 KB | 1.2 KB | Static Direct (`unoptimized: true`) | **0** |
| `public/icon-192.png` | PNG (192x192) | 2.5 KB | 1.3 KB | Static Direct / Pre-compressed WebP | **0** |
| `public/icon-512.png` | PNG (512x512) | 5.9 KB | 2.5 KB | Static Direct / Social OpenGraph | **0** |
| App UI Icons | Lucide React | < 1 KB inline | N/A | Inline SVG JSX (0 HTTP requests) | **0** |

### 2. Next.js Image Configuration (`frontend/next.config.js`)

```javascript
images: {
  // Global bypass toggle (active when NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true)
  unoptimized: process.env.NEXT_PUBLIC_UNOPTIMIZED_IMAGES === 'true',

  // Modern compression formats
  formats: ['image/avif', 'image/webp'],

  // Pruned from default 8 down to 5 responsive breakpoints matching Tailwind layout:
  // Eliminates redundant variants (750px, 828px, 1080px, 2048px, 3840px)
  deviceSizes: [640, 768, 1024, 1280, 1920],

  // Pruned imageSizes for thumbnails and inline cards
  imageSizes: [16, 32, 48, 64, 96, 128, 256],

  // Cache transformed variants for 1 full year (31,536,000s) on Vercel's edge cache
  // (Prevents Vercel's default 60-second re-transformation cycle)
  minimumCacheTTL: 31536000,

  // Prevent SVGs from ever being sent through raster transformation
  dangerouslyAllowSVG: false,
}
```

### 3. Edge CDN Caching Headers

Static assets in `public/` are served with immutable long-term cache headers:
```
Cache-Control: public, max-age=31536000, immutable
```
This guarantees browsers and edge CDNs cache icons and assets indefinitely, preventing redundant origin re-fetches.

### 4. `<SafeImage>` Component (`frontend/src/components/SafeImage.tsx`)

When adding new raster or photography images, use `<SafeImage>` instead of raw `<Image>` or `<img>`:
- **Automatic SVG & Thumbnail Bypass:** Automatically detects `.svg` extensions and small dimensions (`width <= 64` or `height <= 64`), marking them `unoptimized: true` to avoid consuming transformation allowance.
- **Quota Error Recovery:** If Vercel returns HTTP 402 (or an optimization pipeline error), the component automatically falls back to the unoptimized static asset or a specified `fallbackSrc`.
- **Responsive Layout Stability:** Retains intrinsic aspect ratios, responsive `sizes`, and lazy loading.

### 5. Developer Guide: How to Add New Assets Safely

1. **Icons & UI Glyphs:** Use `lucide-react` inline SVG icons. Never create raster files or route icons through `next/image`.
2. **Logos & Illustrations:** Prefer SVGs in `public/`. Always mark them `unoptimized: true` or render via `<SafeImage>`.
3. **Photographs & Screenshots:**
   - Pre-compress images to WebP/AVIF before committing.
   - Specify explicit `width`, `height`, and `sizes` (e.g., `sizes="(max-width: 768px) 100vw, 50vw"`).
   - If the Vercel team quota is exhausted, enable `NEXT_PUBLIC_UNOPTIMIZED_IMAGES=true` in Vercel project environment variables.


