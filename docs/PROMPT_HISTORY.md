# Prompt History — Navarachna

> **Document Purpose:** Complete archive of major engineering prompts, design requirements, technical instructions, outcomes, and affected files across all development iterations.

---

## Prompt 1: Database & Core System Architecture Setup

* **Date:** 2026-08-07
* **Purpose:** Architect backend database models, Pydantic data schemas, and FastAPI entry points for autonomous execution.
* **Prompt:**
  ```text
  Design a FastAPI backend with SQLAlchemy ORM models for an autonomous AI technology intelligence platform named Navarachna.
  Create data models for Agent, Topic, Evaluation, Post, and PublishingLog. 
  Ensure API endpoints support POST /api/agent/init and GET /api/agent/feed.
  ```
* **Outcome:** Created SQLAlchemy schema in `app/db/models.py`, API endpoints in `app/api/endpoints.py`, and FastAPI app setup in `app/main.py`.
* **Related Files:**
  * `app/db/models.py`
  * `app/db/database.py`
  * `app/api/endpoints.py`
  * `app/schemas/schemas.py`

---

## Prompt 2: Autonomous Discovery & 7-Dimension Editorial Engine

* **Date:** 2026-08-07
* **Purpose:** Implement candidate topic discovery and editorial rejection/approval scoring logic.
* **Prompt:**
  ```text
  Implement a discovery service that fetches live RSS feeds (arXiv, Hacker News, TechCrunch) tailored to a target domain (e.g., Robotics, AI Security, Machine Learning).
  Build an editorial scoring engine evaluating candidates from 0 to 100 across 7 weighted criteria: Domain Relevance, Industry Impact, Novelty, Long-Term Value, Source Quality, Persona Alignment, and Uniqueness.
  Only approve topics scoring >= 70. Store rejection reasons for filtered candidate topics.
  ```
* **Outcome:** Built `app/services/discovery.py` and `app/services/editorial.py` with multi-source RSS parsing and structured score output.
* **Related Files:**
  * `app/services/discovery.py`
  * `app/services/editorial.py`

---

## Prompt 3: Memory Lookup & Structured Intelligence Report Generation

* **Date:** 2026-08-07
* **Purpose:** Establish memory continuity lookup and Observation-Insight-Implication post generation.
* **Prompt:**
  ```text
  Create a MemoryService to check incoming candidate topics against previously published intelligence reports to prevent duplicate coverage.
  Create a GeneratorService using Gemini 1.5 Flash API that formats published reports into Observation, Insight, and Strategic Implication paragraphs, along with a transparent selection rationale.
  ```
* **Outcome:** Created vector memory continuity lookups in `app/services/memory.py` and structured generator logic in `app/services/generator.py`.
* **Related Files:**
  * `app/services/memory.py`
  * `app/services/generator.py`

---

## Prompt 4: Autonomous Background Scheduler Daemon

* **Date:** 2026-08-07
* **Purpose:** Enable non-blocking 30-second continuous discovery and publishing loops.
* **Prompt:**
  ```text
  Integrate APScheduler into FastAPI startup events to continuously execute Engine 1 (Discovery & Scoring) and Engine 2 (Queue Publishing) in the background every 30 seconds.
  ```
* **Outcome:** Integrated APScheduler background daemon into `app/main.py` and `app/services/scheduler_tasks.py`.
* **Related Files:**
  * `app/main.py`
  * `app/services/scheduler_tasks.py`

---

## Prompt 5: Command Center Frontend & Real-Time Intelligence Dashboard

* **Date:** 2026-08-08
* **Purpose:** Build a React SPA frontend with centered Command Center navigation, Bento KPI grid, and live stdout logs.
* **Prompt:**
  ```text
  Build a React/Vite SPA for Navarachna with navigation tabs (Dashboard, Feed, Pipeline, Activity, History, System, Settings).
  Dashboard must include: Hero status banner, 4 KPI cards (Topics Scanned, Approved, Rejected, Published), Next Discovery Scan countdown progress bar, Autonomy Status, Live Terminal Stream, and Latest Published Intelligence.
  Use centered layout containers (max-width 1440px), Inter + JetBrains Mono fonts, and dark charcoal theme (#0B0F14).
  ```
* **Outcome:** Created frontend app structure in `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/Dashboard.tsx`, and styling in `src/index.css`.
* **Related Files:**
  * `scratch/friend_zip/project/src/App.tsx`
  * `scratch/friend_zip/project/src/components/Sidebar.tsx`
  * `scratch/friend_zip/project/src/components/Dashboard.tsx`
  * `scratch/friend_zip/project/src/index.css`

---

## Prompt 6: Editorial Pipeline Table & STDOUT Terminal Log View

* **Date:** 2026-08-08
* **Purpose:** Implement dedicated views for pipeline queue inspection and real-time activity stream stdout logs.
* **Prompt:**
  ```text
  Create ApprovedQueuePage.tsx as an editorial pipeline table ranked by composite score with priority badges (P1, P2, P3).
  Create ActivityStreamPage.tsx as a terminal-inspired stdout logger with filter tabs (ALL, DISCOVERY, ACCEPT, REJECT, PUBLISH).
  ```
* **Outcome:** Built `ApprovedQueuePage.tsx` and `ActivityStreamPage.tsx` with live API polling and responsive mobile card fallbacks.
* **Related Files:**
  * `scratch/friend_zip/project/src/components/ApprovedQueuePage.tsx`
  * `scratch/friend_zip/project/src/components/ActivityStreamPage.tsx`

---

## Prompt 7: Dynamic Parameter Persistence & Production Build Pipeline

* **Date:** 2026-08-08
* **Purpose:** Enable dynamic configuration updates and automate build/deployment into FastAPI static assets.
* **Prompt:**
  ```text
  Ensure agent name, domain, writing style, scan interval, and editorial score threshold update dynamically across the UI and backend.
  Build Vite bundle and deploy output to app/static/ for unified FastAPI serving.
  ```
* **Outcome:** Updated `PersonaSettings.tsx`, built Vite production bundle, deployed assets to `app/static/`, and restarted server daemon.
* **Related Files:**
  * `scratch/friend_zip/project/src/components/PersonaSettings.tsx`
  * `app/static/*`
