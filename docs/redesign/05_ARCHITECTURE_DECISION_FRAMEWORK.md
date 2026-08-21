# Company Redesign — Architecture Decision Framework

Status: OWNER-REVIEW DRAFT / PROVISIONAL RECOMMENDATION  
Date: 2026-08-21

Architecture is chosen only after Product Constitution, Acceptance Scenarios, Golden Master, Gameplay/State/Memory Model, and the nine-rule CSA MVP decision. Existing code has no right to survive merely because it exists.

## 1. Architecture success criteria

Score candidates in this order:

1. Product fidelity — easiest path to pass P0/P1 acceptance.
2. Conceptual simplicity — one turn explainable in a few steps.
3. Single authority — no browser/server/DB duplicate gameplay writers.
4. Long-play continuity without giant ontology.
5. Failure isolation — optional observer/MM/media cannot destroy good Story.
6. Streaming correctness.
7. Concurrency correctness.
8. Testability of product and structural contracts.
9. Operational simplicity.
10. Reuse value — only after the above.

## 2. Candidate A — Salvage current v2 transport kernel, replace product/runtime domain

Potential KEEP candidates:

- server-owned turn lifecycle;
- one canonical `(game, turn)` job;
- attempt fencing;
- explicit retry rather than auto regeneration;
- durable streamed Story progress/reconnect;
- isolated mutable Company tables;
- atomic commit boundary;
- Cloudflare/Supabase wiring.

Replace/rebuild:

- v2 demo/product content adapter;
- Opening;
- Story context/prompt;
- observer/domain projection;
- reduced `frontend-v2` product layer;
- product acceptance tests;
- historical generic CSA surfaces not needed by the accepted nine rules.

Pros: preserves hard-earned transport/concurrency fixes.  
Risks: job/retry machinery may still be too complex and sunk-cost bias may leak product assumptions back in.

## 3. Candidate B — Hospital-derived runtime skeleton, Company product rewritten on top

Reuse Hospital only as independently proven donor ideas: simple Story→observe→commit, memory windowing, Mind Monitor approach, proven UI/runtime interaction patterns.

Do not inherit Hospital semantic domains, hypnosis, consent/physical taxonomies, DB identities, or hidden assumptions.

Pros: long-play donor evidence.  
Risks: may smuggle foreign semantics and duplicate solved streaming/concurrency work.

## 4. Candidate C — Entirely new minimal runtime

Build from zero without v1/v2/Hospital implementation base.

Pros: conceptual cleanliness.  
Risks: repeats solved Worker streaming/concurrency/reconnect problems and may slow first correct gameplay.

## 5. Provisional recommendation

Recommend **Candidate A only as kernel salvage / product runtime rewrite**, not “continue v2”.

This is conditional on a bounded kernel audit proving the retained kernel can sit behind a small product-neutral interface. If not, choose B or C.

## 6. Target conceptual architecture

```text
Browser
  |
  | literal action / explicit system command
  v
Game API
  |
  +-- ordinary turn ------------------------------+
  |  load committed context                       |
  |  reserve one attempt                          |
  |  Story LLM streams visible narrative          |
  |  small post-Story observer                     |
  |  pure minimal reducers                         |
  |  atomic commit                                 |
  +-----------------------------------------------+
  |
  +-- rule transaction (no Story turn)
  +-- feedback revision (same chronological turn)
  +-- reset/new game
  |
  v
Committed Context API
  |
  +-- UI
  +-- next Story
  +-- optional Image/TTS sidecars
```

Browser never orchestrates Story→Observer→Commit stages.

## 7. Functional core / imperative shell

Imperative shell owns HTTP/SSE, LLM/network, DB transaction calls, attempt reservation/fencing, timeout/reconnect, sidecars.

Pure functional core owns content projection, Story context, observer normalization, minimal scene/rule/clothing reducers, memory window, and UI view-model projection.

## 8. Product/content compiler boundary

```text
accepted content sources
   -> validate/build CompanyContent
   -> Story/UI/domain readers
```

`CompanyContent` carries stable source facts but no gameplay state.

For CSA, `CompanyContent` exposes **only the accepted nine active templates**. Do not compile the historical 44 and filter them later in runtime/UI.

Tests assert parity between accepted source content and compiled projection.

## 9. Story output redesign — simplify provider contract

Prefer player-visible narrative as the primary Story output rather than a fragile hidden semantic document.

Provisional format:

- natural Korean narrative;
- dialogue uses product-visible `화자명(연기지시): "대사"` where useful;
- no OOC/self-repair/control vocabulary in committed Story;
- optional dialogue metadata is parsed only when exact registered identity is unambiguous;
- uncertain metadata degrades TTS/structured dialogue only, not narrative.

The post-Story observer extracts only accepted machine state.

## 10. Story call

Story is sole narrative author.

Inputs are bounded to accepted product/state/memory context, including only relevant active premises from the nine-rule CSA catalog.

Do not provide precomputed action success, relation stage, consent/compliance verdict, generic action class, risk probability, generic physical execution plan, or historical non-MVP CSA semantics.

No automatic retry-until-lucky.

## 11. Observer call

Default: one small post-Story observer.

It may propose only fields accepted by the Gameplay/State/Memory model. Optional projection failure is fail-open where structurally safe.

Recommended starting topology for simplicity: Story call + one observer call containing scene projection, summary, and Mind Monitor. Do not split these into multiple LLM stages unless live evidence proves one combined observer is unreliable for a specific reason.

## 12. Commit boundary

One transaction commits an accepted ordinary turn:

- literal action;
- Story;
- allowed structural/mechanical reductions;
- already available memory/summary artifacts;
- optional monitor/presentation payload;
- turn identity/revision.

No arbitrary full-save submission from browser/LLM.

## 13. System commands are not ordinary Story turns

Separate domain commands for:

- apply/change/remove one of the accepted nine `상식개변` rules;
- feedback revision;
- reset/new game.

Never convert them into fake literal player actions.

## 14. CSA architecture scope

The first CSA implementation supports **exactly the nine retained templates** from `07_CSA_MVP_CATALOG.md`.

Design only mechanics those nine prove necessary:

- durable rule lifecycle;
- exact accepted scope validation;
- non-turn transaction;
- exact four-slot clothing synchronization for retained clothing rules;
- Story-premise projection for request-triggered/open-ended rules.

Do not build a generic historical category/action DSL in anticipation of later rules.

A future rule may add one new narrow mechanic only after owner selection and acceptance-scenario review.

## 15. UI architecture

Use the accepted Golden surface inventory.

- transplant/rebuild complete Company presentation intentionally;
- thin controller talks to redesigned API/context only;
- frontend owns no gameplay transition;
- no frontend semantic catalog duplicates;
- `상식개변` UI displays only the 3/3/3 active catalog.

## 16. Testing architecture

Three layers:

### Product contract tests

Assert Company content, Setup, UI surfaces, Story context, removed features, and exact nine-rule CSA catalog.

### Structural runtime tests

Assert transaction/fencing/reconnect/idempotency/commit invariants.

### Manual acceptance

Opening / 3–5 / 10–20 turns, then nine-rule CSA play.

Green structural tests cannot override failed product/manual acceptance.

## 17. First implementation milestone after design approval

Milestone 0:

- canonical Setup + real Company content;
- correct Opening;
- real UI Story/action/MM shell;
- one ordinary turn through selected kernel;
- refresh/readback;
- no active CSA mutation/media/feedback yet unless required for product identity.

Owner reviews Opening + 3–5 turns immediately. Core continuity is validated before implementing the nine-rule CSA MVP.

## 18. Remaining architecture/product decisions before lock

Do not start source implementation until owner explicitly resolves or deliberately defers these without implementation assumptions:

1. choice suggestions: none vs optional four;
2. physical continuity: bounded scene snapshot alone vs minimal extra structure;
3. player sexual meter: retain or remove from core;
4. exact per-template CSA subject/counterparty controls for the nine-rule MVP.

These decisions are intentionally small enough to review independently before code resumes.
