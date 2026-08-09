# Navarachna — Hackathon Submission Report

> **Platform:** Navarachna — Autonomous Technology Intelligence Platform
> **Submitted:** 2026-08-09
> **Repository:** `teamnavrachna/navrachnabot`
> **Category:** Autonomous AI Agent Systems

---

## 1. Platform Overview

**Navarachna is not an RSS reader. It is not a blog. It is an Autonomous Technology Intelligence Platform.**

Navarachna is a fully self-directed technology intelligence system that operates without any human instruction after initialization. It continuously discovers emerging technology signals from the web, evaluates them against a rigorous multi-dimensional editorial standard, remembers what it has already published, rejects noise and duplicates, prioritizes high-signal intelligence, publishes structured executive briefings, and explains every decision it makes — autonomously, indefinitely, on a 30-second cycle.

The complete autonomous loop is:

```
Initialize → Discover → Evaluate → Memory Check → Quality Gates → Queue → Publish → Explain
```

Every stage is system-driven. No operator command is required for any individual publication or rejection.

### What Makes It Different

| Property | RSS Reader / Blog | Navarachna |
|---|---|---|
| Content Source | Manually curated | Autonomous multi-source discovery |
| Publishing Trigger | Human clicks "Publish" | Autonomous quality-gate pipeline |
| Duplicate Handling | None | Jaccard similarity memory engine |
| Editorial Standard | Subjective | 7-dimension AI scoring (0-100) |
| Rejection Audit | None | Persistent rejection records |
| Autonomy Proof | None | `AutonomyProof` table with cycle counters |
| Explainability | None | `/api/agent/explain` with full editorial trail |

---

## 2. Architecture

Navarachna is built on a clean full-stack architecture designed for modularity, extensibility, and live demonstration readiness.

### Backend

| Layer | Technology | Role |
|---|---|---|
| API Framework | **FastAPI** (Python) | REST API server, startup/shutdown lifecycle |
| Persistence | **SQLAlchemy** + SQLite / PostgreSQL | ORM-based relational data store |
| Scheduler | **APScheduler** | 30-second autonomous background task cycles |
| LLM Integration | **Gemini 1.5 Flash** (Google AI) | Editorial judgment, briefing generation |
| Fallback Engine | Heuristic scoring (Python) | Operates independently when Gemini unavailable |

### Frontend

| Layer | Technology | Role |
|---|---|---|
| Framework | **React 18 + Vite** | SPA frontend, hot module replacement |
| Language | **TypeScript** | Type-safe component development |
| Styling | **Vanilla CSS** + design tokens | Glassmorphism dark/light theme system |
| State Management | Custom hooks (`useAppState.ts`) | Live backend polling + client engine |
| Deployment | **Vercel** (static hosting) | Global CDN distribution |

### Service Layer (Backend)

```
app/
├── api/
│   └── endpoints.py          # All REST API routes
├── db/
│   ├── models.py             # SQLAlchemy ORM models
│   └── database.py           # Engine + session factory
├── schemas/
│   └── schemas.py            # Pydantic request/response models
└── services/
    ├── credibility.py        # Source Credibility Registry (40+ sources)
    ├── discovery.py          # Multi-source topic discovery engine
    ├── editorial.py          # 7-dimension scoring + quality gates
    ├── memory.py             # Jaccard similarity + diversity penalty
    ├── generator.py          # Gemini + fallback content generator
    ├── scheduler_tasks.py    # APScheduler task orchestration
    └── activity_logger.py    # Decision timeline logging
```

---

## 3. Data Flow

The complete lifecycle of a technology signal from raw discovery to published intelligence briefing:

### Stage 1: Initialization
- Judge or user calls `POST /api/agent/init` with agent name, domain, and persona config.
- System creates an `Agent` record, seeds session state, and starts the APScheduler background daemon.
- An `AutonomyProof` record is created and tied to the agent session.

### Stage 2: Discovery
- Every 30 seconds, `run_discovery_cycle()` fires across **all configured sources in parallel**.
- Sources include arXiv RSS, Hacker News Algolia API, IEEE Spectrum, TechCrunch, and more.
- Each source is isolated: a failure in one source does not abort the cycle for others.
- Raw candidate topics are stored as `Topic` records with source URL and timestamp.
- `DiscoveryCycleStats` records the per-cycle topic count, new topic count, and timestamp.

### Stage 3: Evaluation
- Each discovered topic is passed through `EditorialService.evaluate()`.
- The editorial engine scores the topic across **7 dimensions** (see Section 7).
- Gemini 1.5 Flash provides the primary score if available; the heuristic fallback engine activates otherwise.
- Confidence score (0–100) and confidence level (`LOW` / `MEDIUM` / `HIGH`) are computed.
- Source credibility is looked up in the `SourceCredibilityRegistry`.

### Stage 4: Memory Check
- `MemoryService` computes Jaccard similarity between the incoming topic title/summary and all previously published post titles.
- If similarity ≥ **0.45**, the topic is flagged as a memory collision and blocked from publishing.
- The computed `memory_similarity_score` is stored in the `Evaluation` record.

### Stage 5: Quality Gates
- The topic must pass **all** of the following gates simultaneously:
  1. Editorial score ≥ threshold (default: 70)
  2. Source credibility ≥ 50
  3. Confidence score ≥ 40
  4. Memory similarity < 0.45
- Any gate failure routes the topic to `RejectedTopicRecord` with the specific failure reason(s).

### Stage 6: Queue
- Topics passing all quality gates are inserted into `ApprovedTopicsQueue`.
- The queue maintains priority ordering by editorial score (descending).

### Stage 7: Publish
- `run_publishing_cycle()` dequeues the highest-priority approved topic.
- `GeneratorService` produces a structured intelligence briefing (Observation → Insight → Strategic Implication).
- The briefing is saved as a `Post` record with full score metadata.
- `AutonomyProof` cycle counters are incremented.
- `ActivityLogger` writes a `PUBLISH` event to the decision timeline.

### Stage 8: Explain
- Any published post or rejected topic is permanently auditable via:
  - `GET /api/agent/explain?postId=X` — full editorial trail for a published briefing
  - `GET /api/agent/rejected` — all rejection decisions with reasons
  - `GET /api/agent/audit` — aggregate autonomy proof dashboard

---

## 4. Core Engines

### Engine 1: Continuous Discovery Engine (30-Second Cycles)

The Discovery Engine is the system's sensory layer. It runs every **30 seconds** as an APScheduler background job and queries all registered technology news sources in parallel. Each source query is independently wrapped in error isolation, ensuring that network timeouts or rate limits on any individual source do not disrupt the broader discovery cycle. All discovered candidate topics are deduplicated by URL before being submitted to the Editorial Engine.

**Key Properties:**
- Cycle frequency: configurable (default 30 seconds)
- Per-source failure isolation: yes
- Parallel source querying: yes
- Deduplication: by source URL
- Cycle statistics: recorded in `DiscoveryCycleStats`

### Engine 2: Dynamic Publishing Engine

The Publishing Engine is the system's output layer. It dequeues the highest-priority approved topic from `ApprovedTopicsQueue` and invokes the `GeneratorService` to produce a structured three-part intelligence briefing. Published output is enriched with full score metadata and stored permanently. The engine records each publish action as an autonomy proof event.

**Key Properties:**
- Dequeues by: editorial score (highest first)
- Content format: Observation → Insight → Strategic Implication
- Score metadata: attached to every published post
- Autonomy proof: updated on every publish

### Editorial Engine (7-Dimension Scoring)

The core cognitive layer. Uses Gemini 1.5 Flash as the primary evaluator with a deterministic heuristic fallback. Scores each topic across 7 dimensions, applies source credibility weighting, memory similarity penalties, and diversity penalties to produce a final composite score and confidence rating. See Section 7 for full scoring specification.

### Memory Engine (Jaccard Similarity)

Prevents the system from re-publishing intelligence on topics it has already covered. Uses Jaccard similarity on tokenized title sets with a rejection threshold of **0.45**. Also computes a **diversity penalty** when multiple recently approved topics share overlapping vocabulary, discouraging thematic clustering in the published output stream.

**Jaccard Similarity Formula:**
```
similarity(A, B) = |A ∩ B| / |A ∪ B|

where A, B are tokenized word sets of topic titles
```

### Source Credibility Registry (`credibility.py`)

A curated, versioned registry of **40+ technology intelligence sources** rated on a 0–100 credibility scale. Source credibility directly impacts the `Source Quality` scoring dimension and can independently block a topic from publishing if credibility falls below the minimum threshold of 50.

**Sample Credibility Ratings:**

| Source | Credibility Score |
|---|---|
| arXiv (cs.AI) | 92 |
| Nature | 95 |
| IEEE Spectrum | 88 |
| MIT Technology Review | 85 |
| Google AI Blog | 82 |
| TechCrunch | 68 |
| Hacker News | 62 |
| Generic RSS (unknown) | 40 |

### Diversity Penalty System

When multiple topics in the approved queue or recent publish history share high lexical overlap, a diversity penalty is subtracted from the `Uniqueness` dimension score. This prevents the system from publishing three consecutive AI papers on the same narrow subtopic and ensures the published intelligence stream remains broad and valuable.

---

## 5. Database Design

All persistence is managed via SQLAlchemy ORM models. The schema supports full autonomy auditing, editorial history, memory tracking, and system health monitoring.

### `agents`
Tracks active agent sessions.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Unique agent identifier |
| name | String | Agent display name |
| domain | String | Monitored technology domain |
| persona | String | Writing voice/style setting |
| editorial_threshold | Integer | Minimum score for approval (default: 70) |
| scan_interval | Integer | Discovery cycle interval in seconds |
| created_at | DateTime | Session creation timestamp |
| is_active | Boolean | Active/inactive flag |

### `topics`
Raw discovered technology signals before editorial evaluation.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Unique topic identifier |
| agent_id | FK → agents | Owning agent session |
| title | String | Topic headline |
| summary | Text | Raw source summary |
| source_url | String | Original source URL |
| source_name | String | Named source identifier |
| discovered_at | DateTime | Discovery timestamp |
| status | String | `PENDING` / `APPROVED` / `REJECTED` |

### `evaluations`
Full editorial scoring record for each evaluated topic.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Unique evaluation identifier |
| topic_id | FK → topics | Evaluated topic |
| agent_id | FK → agents | Owning agent |
| domain_relevance_score | Integer | 0–25 |
| industry_impact_score | Integer | 0–20 |
| novelty_score | Integer | 0–15 |
| long_term_value_score | Integer | 0–15 |
| source_quality_score | Integer | 0–10 |
| persona_alignment_score | Integer | 0–10 |
| uniqueness_score | Integer | 0–5 |
| editorial_score | Integer | Composite 0–100 |
| confidence_score | Integer | 0–100 |
| confidence_level | String | `LOW` / `MEDIUM` / `HIGH` |
| source_credibility_score | Integer | Registry credibility 0–100 |
| memory_similarity_score | Float | Jaccard similarity 0.0–1.0 |
| decision | String | `APPROVED` / `REJECTED` |
| rejection_reason | Text | Structured rejection explanation |
| evaluated_at | DateTime | Evaluation timestamp |

### `posts`
Published intelligence briefings.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Unique post identifier |
| agent_id | FK → agents | Publishing agent |
| topic_id | FK → topics | Source topic |
| title | String | Briefing headline |
| content | Text | Full Observation/Insight/Implication body |
| editorial_score | Integer | Final editorial score |
| confidence_score | Integer | Confidence score at publish time |
| confidence_level | String | `LOW` / `MEDIUM` / `HIGH` |
| score_breakdown | JSON | Per-dimension scores |
| published_at | DateTime | Publication timestamp |

### `approved_topics_queue`
Priority queue of topics that have passed all quality gates and await publishing.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Queue entry identifier |
| agent_id | FK → agents | Owning agent |
| topic_id | FK → topics | Queued topic |
| editorial_score | Integer | Score used for priority ordering |
| queued_at | DateTime | Queue entry timestamp |

### `rejected_topics`
Permanent record of all topics rejected by quality gates.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Rejection record identifier |
| agent_id | FK → agents | Owning agent |
| topic_id | FK → topics | Rejected topic |
| rejection_reason | Text | Specific gate failure explanation |
| editorial_score | Integer | Score at time of rejection |
| confidence_score | Integer | Confidence at time of rejection |
| source_credibility_score | Integer | Credibility at time of rejection |
| memory_similarity_score | Float | Similarity at time of rejection |
| rejected_at | DateTime | Rejection timestamp |

### `discovery_cycle_stats`
Per-cycle discovery metrics for autonomy auditing.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Stats record identifier |
| agent_id | FK → agents | Owning agent |
| cycle_number | Integer | Sequential cycle counter |
| topics_discovered | Integer | Raw candidates found this cycle |
| new_topics | Integer | Novel topics (not previously seen) |
| approved_count | Integer | Topics approved this cycle |
| rejected_count | Integer | Topics rejected this cycle |
| published_count | Integer | Briefings published this cycle |
| cycle_at | DateTime | Cycle timestamp |

### `autonomy_proof`
Immutable running record proving zero human intervention.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Record identifier |
| agent_id | FK → agents | Owning agent |
| total_cycles | Integer | Total autonomous cycles completed |
| total_topics_discovered | Integer | Cumulative topics discovered |
| total_approved | Integer | Cumulative topics approved |
| total_rejected | Integer | Cumulative topics rejected |
| total_published | Integer | Cumulative briefings published |
| memory_rejections | Integer | Topics rejected by memory engine |
| last_cycle_at | DateTime | Most recent cycle timestamp |
| created_at | DateTime | First cycle timestamp |

### `diversity_tracker`
Tracks lexical distribution of recently published topics for diversity penalty computation.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Tracker record identifier |
| agent_id | FK → agents | Owning agent |
| topic_id | FK → topics | Tracked topic |
| token_signature | Text | Normalized token set representation |
| recorded_at | DateTime | Record timestamp |

### `system_health_logs`
Periodic system health snapshots.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Log identifier |
| agent_id | FK → agents | Owning agent |
| scheduler_status | String | `RUNNING` / `STOPPED` / `ERROR` |
| last_discovery_at | DateTime | Most recent discovery cycle |
| last_publish_at | DateTime | Most recent publication |
| queue_size | Integer | Current approved queue depth |
| memory_record_count | Integer | Total memory entries |
| error_count | Integer | Consecutive error count |
| recorded_at | DateTime | Snapshot timestamp |

### `activity_logs`
Human-readable decision timeline for the Judge Dashboard.

| Column | Type | Description |
|---|---|---|
| id | String (UUID PK) | Log entry identifier |
| agent_id | FK → agents | Owning agent |
| event_type | String | `DISCOVERY` / `APPROVE` / `REJECT` / `PUBLISH` / `MEMORY_BLOCK` |
| event_message | Text | Human-readable event description |
| metadata | JSON | Structured event payload |
| logged_at | DateTime | Event timestamp |

---

## 6. API Design

All endpoints are namespaced under `/api/agent/`. Authentication is session-based (agent ID required after init).

### `POST /api/agent/init`
Initialize an agent session. Required before any other endpoint.

**Request Body:**
```json
{
  "name": "Navarachna Intelligence",
  "domain": "Artificial Intelligence",
  "persona": "analytical",
  "editorial_threshold": 70,
  "scan_interval": 30
}
```

**Response:** Agent session object with `agentId`.

---

### `GET /api/agent/feed`
Returns published intelligence briefings enriched with full editorial metadata.

**Response Fields:**
- `id` — post identifier
- `title` — briefing headline
- `content` — full Observation/Insight/Implication body
- `editorialScore` — composite editorial score (0–100)
- `confidenceScore` — confidence score (0–100)
- `confidenceLevel` — `LOW` / `MEDIUM` / `HIGH`
- `scoreBreakdown` — per-dimension score object
- `publishedAt` — ISO 8601 publication timestamp

---

### `GET /api/agent/audit`
**Judge Dashboard endpoint.** Returns aggregate autonomy proof data.

**Response Fields:**
- `totalCycles` — total autonomous cycles completed
- `totalDiscovered` — cumulative topics discovered
- `totalApproved` — cumulative approvals
- `totalRejected` — cumulative rejections
- `totalPublished` — cumulative publications
- `memoryRejections` — topics blocked by memory engine
- `selectivityRate` — published / discovered ratio
- `lastCycleAt` — timestamp of most recent cycle
- `cycleHistory` — array of per-cycle stats records

---

### `GET /api/agent/explain?postId=...&agentId=...`
**Full editorial trail for a specific published post.** Returns every scoring decision that led to this post's publication.

**Response Fields:**
- `post` — full post metadata
- `topic` — original discovered topic
- `evaluation` — complete evaluation record including all 7 dimension scores
- `qualityGates` — pass/fail status for each gate
- `memoryCheck` — similarity score and comparison posts
- `credibilityCheck` — source credibility rating and registry entry
- `generationMethod` — `GEMINI` or `HEURISTIC_FALLBACK`

---

### `GET /api/agent/rejected`
Returns all topics that were blocked by quality gates. Persistent across the full session.

**Response Fields per record:**
- `topicTitle` — rejected topic headline
- `sourceUrl` — original source
- `editorialScore` — score at rejection
- `rejectionReason` — specific gate failure message
- `memorySimilarityScore` — Jaccard score if memory-blocked
- `sourceCredibilityScore` — credibility score if credibility-blocked
- `rejectedAt` — timestamp

---

### `GET /api/agent/metrics`
High-level platform performance metrics.

**Response:** Discovery rate, approval rate, rejection rate, publish rate, average editorial score, average confidence score.

---

### `GET /api/agent/decisions`
Structured decision timeline — all APPROVE and REJECT decisions with scores.

---

### `GET /api/agent/timeline`
Full activity event stream. Powers the Live Activity Terminal in the frontend.

**Response:** Array of activity log events ordered by timestamp, including `DISCOVERY`, `APPROVE`, `REJECT`, `PUBLISH`, `MEMORY_BLOCK` events.

---

### `GET /api/agent/health`
System health snapshot.

**Response:** Scheduler status, last discovery timestamp, last publish timestamp, queue depth, memory record count, error count.

---

### `GET /api/agent/memory`
Memory engine state. Returns the set of published post tokens used for Jaccard similarity comparison.

---

### `GET /api/agent/queue`
Current state of the approved topics queue awaiting publishing.

**Response:** Priority-ordered list of approved topics with scores.

---

### `GET /api/agent/status`
Lightweight status ping. Returns agent name, domain, scheduler status, cycle count.

---

## 7. Editorial Scoring Dimensions

Each topic is evaluated across 7 independent dimensions. The composite editorial score is the sum of all dimension scores on a scale of 0–100.

| Dimension | Max Score | Description |
|---|---|---|
| **Domain Relevance** | 25 | How precisely does the topic match the configured technology domain? Direct domain match scores high; tangential topics score low. |
| **Industry Impact** | 20 | Does the signal represent a development that will meaningfully affect industry practice, investment, or strategy in the next 12–24 months? |
| **Novelty** | 15 | Is this a genuinely new development, or a reiteration of existing knowledge? Early-stage research and first announcements score highest. |
| **Long-Term Value** | 15 | Will this intelligence remain actionable and relevant over a 2–5 year horizon? Foundational shifts score higher than tactical announcements. |
| **Source Quality** | 10 | Weighted by the Source Credibility Registry. A topic from a credibility-92 source like arXiv scores near maximum; a credibility-40 unknown RSS feed scores near minimum. |
| **Persona Alignment** | 10 | How well does the topic match the configured persona's preferred focus areas and writing voice? Analytical personas score technical depth higher. |
| **Uniqueness** | 5 | Has a similar topic been covered recently? Subtracted by the diversity penalty if recent publications share overlapping vocabulary. |

**Composite Score:** Sum of all dimensions (0–100).

### Confidence Scoring

Separate from the editorial score, a **Confidence Score (0–100)** reflects the system's certainty in its own evaluation.

| Confidence Level | Score Range | Meaning |
|---|---|---|
| HIGH | 75–100 | Gemini evaluation succeeded, strong signal, high source credibility |
| MEDIUM | 40–74 | Gemini evaluation succeeded with moderate certainty, or heuristic fallback with strong signal |
| LOW | 0–39 | Heuristic fallback only, weak source credibility, or ambiguous domain match |

**Minimum Confidence Threshold:** 40 (LOW evaluations below this score are blocked from publishing).

---

## 8. Quality Gates

A topic must simultaneously pass **all four** quality gates to advance from evaluation to the approved queue. Any single gate failure routes the topic to `RejectedTopicRecord` with the specific failure reason.

```
┌─────────────────────────────────────────────────────────────────┐
│                        QUALITY GATES                            │
│                                                                 │
│  Gate 1: Editorial Score ≥ 70 (configurable)                   │
│  Gate 2: Source Credibility ≥ 50                               │
│  Gate 3: Confidence Score ≥ 40                                 │
│  Gate 4: Memory Similarity < 0.45 (Jaccard threshold)          │
│                                                                 │
│  ALL GATES MUST PASS → Approved Queue                          │
│  ANY GATE FAILS     → Rejected Topics (with reason)            │
└─────────────────────────────────────────────────────────────────┘
```

### Gate Rationale

- **Gate 1 (Editorial Score ≥ 70):** Ensures only high-signal intelligence reaches publication. The default threshold of 70/100 is deliberately selective — approximately 30–40% of discovered topics pass in practice.
- **Gate 2 (Credibility ≥ 50):** Blocks low-quality, unverifiable sources from polluting the intelligence stream regardless of how relevant their topic appears.
- **Gate 3 (Confidence ≥ 40):** Blocks publication of evaluations where the system itself has insufficient confidence in its scoring — preventing overconfident low-quality output.
- **Gate 4 (Memory < 0.45):** Ensures the platform never republishes substantially similar intelligence, maintaining the novelty value of every briefing.

---

## 9. Hackathon Requirement Mapping

| Requirement | Implementation | Status |
|---|---|---|
| Autonomous agent operation | APScheduler 30-second cycles, no human trigger required | ✅ Complete |
| AI-powered decision making | Gemini 1.5 Flash editorial scoring engine | ✅ Complete |
| Heuristic fallback | Deterministic 7-dimension heuristic scoring (no LLM dependency) | ✅ Complete |
| Multi-source discovery | arXiv, Hacker News, IEEE Spectrum, TechCrunch, 40+ sources | ✅ Complete |
| Memory and continuity | Jaccard similarity engine, threshold 0.45, persistent across cycles | ✅ Complete |
| Quality filtering | 4-gate quality gate system with structured rejection records | ✅ Complete |
| Explainability / audit trail | `/api/agent/explain`, `/api/agent/audit`, `/api/agent/rejected` | ✅ Complete |
| Persistent storage | SQLAlchemy ORM, 11 database tables | ✅ Complete |
| Frontend UI | React + Vite SPA, dark/light glassmorphism theme | ✅ Complete |
| Live judge verification | Audit endpoint, explain endpoint, rejected topics endpoint | ✅ Complete |
| Autonomy proof | `AutonomyProof` table with cycle counter, timestamps | ✅ Complete |
| Source credibility | 40+ source registry (credibility.py), 0–100 ratings | ✅ Complete |
| Diversity enforcement | Diversity penalty on Uniqueness score dimension | ✅ Complete |
| Confidence scoring | 0–100 confidence score + LOW/MEDIUM/HIGH level | ✅ Complete |
| API documentation | 12 documented REST endpoints | ✅ Complete |
| Mobile responsive | Responsive CSS, mobile sub-header navigation | ✅ Complete |

---

## 10. Autonomy Proof

Navarachna's autonomy is verifiable, not claimed.

### How APScheduler Drives the Autonomous Loop

On startup (triggered by `POST /api/agent/init`), the FastAPI application registers two APScheduler jobs:

1. **Discovery Job** — interval: 30 seconds (configurable)
   - Runs `run_discovery_cycle(agent_id)` without any human trigger.
   - Discovers, evaluates, gates, and queues topics automatically.

2. **Publishing Job** — interval: 30 seconds (offset by 15 seconds from discovery)
   - Runs `run_publishing_cycle(agent_id)` without any human trigger.
   - Dequeues the highest-priority topic and publishes a briefing.

Both jobs continue indefinitely until the application stops or the agent session is reset. **No human command is required to trigger any individual publication or rejection.**

### AutonomyProof Table

Every successful cycle increments counters in the `AutonomyProof` table:

```python
autonomy_proof.total_cycles += 1
autonomy_proof.total_topics_discovered += new_topics
autonomy_proof.total_approved += approved_count
autonomy_proof.total_rejected += rejected_count
autonomy_proof.total_published += published_count
autonomy_proof.last_cycle_at = datetime.utcnow()
```

This table provides **immutable, timestamped proof** that the system has been operating autonomously. A judge can call `GET /api/agent/audit` at any time to see the full cycle history and verify that no human-triggered publications exist.

### What "Autonomous" Means in Practice

After `POST /api/agent/init` is called once:
- The system discovers technology signals every 30 seconds.
- It evaluates every signal against 7 scoring dimensions.
- It rejects signals that fail any quality gate.
- It publishes approved signals without any human command.
- It remembers everything it has published and refuses to repeat it.
- It logs every decision permanently for judge inspection.

A judge could walk away after initialization and return hours later to find a fully populated intelligence briefing feed — with complete editorial audit trails — produced entirely without human intervention.

---

## 11. Judge Verification Paths

Judges can independently verify every claim made in this submission using the following verification paths:

### Path 1: Verify Autonomous Operation

```http
GET /api/agent/audit
```

Returns:
- `totalCycles` — how many autonomous cycles have completed
- `lastCycleAt` — timestamp of most recent cycle (should be within 30 seconds of current time)
- `totalPublished` — cumulative autonomous publications
- `memoryRejections` — topics blocked by memory engine (proves memory is active)
- `selectivityRate` — ratio of published to discovered (proves quality filtering, not bulk posting)

**What to look for:** `totalCycles` growing over time without any manual trigger. `memoryRejections > 0` proves the memory engine is actively blocking duplicates.

### Path 2: Verify Editorial Reasoning

```http
GET /api/agent/explain?postId=<any-post-id>&agentId=<agent-id>
```

Returns the complete editorial trail for any specific published briefing, including:
- All 7 dimension scores
- Quality gate pass/fail results
- Memory similarity check result
- Source credibility score
- Whether Gemini or heuristic fallback was used

**What to look for:** Each published post has a unique, traceable editorial history. The system cannot publish without a complete evaluation trail.

### Path 3: Verify Rejection Selectivity

```http
GET /api/agent/rejected
```

Returns all rejected topics with specific rejection reasons.

**What to look for:** `rejectionReason` fields explaining exactly which gate failed and why. A healthy system should show rejections across all four gate types, proving the filtering is active and selective.

### Path 4: Frontend System Health Page

Navigate to the **System Health** tab in the frontend UI.

Displays:
- Live scheduler status badge (`RUNNING` / `STOPPED`)
- Last discovery timestamp (auto-updating every 3 seconds)
- Last publish timestamp
- Queue depth
- Memory record count
- Cycle history chart

### Path 5: Verify Memory Engine

```http
GET /api/agent/memory
```

Returns the current memory state — all token signatures of published posts used for Jaccard comparison. Cross-reference with `memoryRejections` in the audit endpoint to verify the memory engine is actively blocking duplicates.

---

## 12. Risk Analysis

This section honestly assesses known risks and limitations of the current implementation.

| Risk | Severity | Description | Mitigation |
|---|---|---|---|
| **SQLite persistence on serverless** | Medium | SQLite write-locks can cause contention on concurrent requests; not suitable for high-concurrency production. | Architecture supports PostgreSQL swap via `DATABASE_URL` env variable. SQLite adequate for hackathon single-session demo. |
| **Gemini rate limits** | Low | Google AI API free-tier rate limits may interrupt editorial scoring under high-frequency cycles. | Full heuristic fallback engine activates automatically. Zero downtime on rate limit hit. |
| **30-second cycles for live demo** | Low | In a fast-paced judging environment, 30-second cycles may feel slow for first-impression demos. | Interval is configurable down to 5 seconds in settings. Judges can accelerate cycle speed immediately. |
| **Heuristic fallback scoring bias** | Low | The deterministic heuristic engine produces slightly more generous scores than Gemini on ambiguous topics. | Confidence level is set to `LOW` or `MEDIUM` for heuristic evaluations, and quality gates still apply. |
| **Frontend Vercel / Backend decoupling** | Low | Vercel-deployed frontend runs a client-side simulation engine when backend is unreachable. Live backend required for persistent data. | Backend URL is configurable. Instructions provided in README for full-stack local deployment. |
| **No authentication** | Low | Current API has no token-based authentication beyond agent session ID. | Out of scope for hackathon. Production version would implement JWT auth. |
| **Memory tokenization simplicity** | Low | Jaccard similarity on word tokens is less semantically precise than embedding-based similarity. | Threshold tuned conservatively at 0.45 to minimize false positives while catching genuine duplicates. |

---

## 13. Live Steer Challenge Readiness

Navarachna's architecture is explicitly designed for rapid modification — each service is a standalone Python module with a clean static interface.

### Service Independence

| Service File | Responsibility | What Can Be Changed in 20 Minutes |
|---|---|---|
| `credibility.py` | Source credibility registry | Add sources, adjust ratings, change threshold |
| `memory.py` | Jaccard similarity + diversity | Adjust threshold, swap similarity algorithm |
| `editorial.py` | 7-dimension scoring + quality gates | Change dimension weights, add/remove dimensions, adjust thresholds |
| `discovery.py` | Source querying | Add new RSS feeds, add new API sources, change query terms |
| `scheduler_tasks.py` | Cycle orchestration | Change cycle frequency, add new pipeline stages |
| `generator.py` | Content generation | Change output format, system prompts, Gemini parameters |

### Live Steer Scenarios Navarachna Is Ready For

1. **"Add a new source"** — Add one entry to `discovery.py` source list. Zero other changes required.
2. **"Change the scoring threshold"** — Adjust `editorial_threshold` in agent settings or change the default in `editorial.py`. Takes effect immediately.
3. **"Add an 8th scoring dimension"** — Add one dimension to the scoring function in `editorial.py` and update the max score constant. Frontend auto-renders the new dimension from `scoreBreakdown`.
4. **"Make it publish faster"** — Reduce `scan_interval` in agent settings. APScheduler reschedules automatically.
5. **"Change the output format"** — Modify the Gemini system prompt in `generator.py`. All new posts use the updated format. Existing posts are unaffected.
6. **"Block a specific source"** — Set its credibility score to 0 in `credibility.py`. All future topics from that source fail Gate 2.
7. **"Add a new rejection gate"** — Add one conditional check in `editorial.py`'s `gate_check()` function and a corresponding field to `RejectedTopicRecord`.

---

*Submission prepared by Team Navarachna — 2026-08-09*
*All endpoints, engines, and database tables described in this document are implemented and operational.*
