# Company Redesign — Architecture Decision Framework

Status: OWNER-REVIEW DRAFT / PROVISIONAL RECOMMENDATION  
Date: 2026-08-21

Architecture is chosen only after Product Constitution, Acceptance Scenarios, Golden Master, and Gameplay/State/Memory Model.

Existing code has no right to survive merely because it exists.

## 1. Architecture success criteria

Score every candidate against these criteria in order:

1. **Product fidelity** — easiest path to pass P0/P1 acceptance scenarios.
2. **Conceptual simplicity** — a new engineer/agent can explain one turn in a few steps.
3. **Single authority** — no browser/server/DB duplicate gameplay writers.
4. **Long-play continuity** — grounded memory/scene continuity without giant ontology.
5. **Failure isolation** — optional MM/media/observer failure cannot destroy good Story.
6. **Streaming correctness** — Story appears immediately and survives reconnect.
7. **Concurrency correctness** — one player action cannot become two committed turns.
8. **Testability** — product and structural tests can assert the right things.
9. **Operational simplicity** — minimal deploy/migration/cross-worker complexity.
10. **Reuse value** — only after the above.

## 2. Candidate A — Salvage current v2 transport kernel, replace product/runtime domain

Potentially retain only independently useful infrastructure already built/proven:

- server-owned `/turn` lifecycle;
- one canonical `(game, turn)` job;
- attempt fencing;
- explicit retry rather than automatic regeneration;
- durable streamed Story progress/reconnect;
- isolated mutable Company tables;
- atomic commit boundary;
- Cloudflare/Supabase wiring.

Replace/rebuild:

- demo/current v2 content adapter;
- Opening;
- Story prompt/context assembly;
- observer/domain state projection;
- current reduced `frontend-v2` product layer;
- product acceptance tests.

Pros:

- concurrency/streaming infrastructure already has hard-earned failure fixes;
- avoids recreating Cloudflare lifecycle/subrequest/fencing bugs;
- can preserve clean separation from v1.

Risks:

- current job/retry machinery may be more complicated than needed;
- developers may accidentally let v2 product assumptions leak back in;
- sunk-cost bias may preserve complexity that no longer helps.

## 3. Candidate B — Hospital-derived runtime skeleton, Company product rewritten on top

Reuse Hospital only as an architecture donor where its long-play behavior is independently proven.

Allowed donor ideas could include:

- simple Story→observe→commit flow;
- memory window strategy;
- Mind Monitor generation approach;
- proven UI/runtime interaction patterns.

Forbidden shortcut:

- copying Hospital semantic domains/hypnosis/consent/physical taxonomies merely because they exist;
- inheriting Hospital DB/runtime identities or hidden assumptions;
- treating donor behavior as Company product authority.

Pros:

- starts from a runtime with proven long-play feel.

Risks:

- Company-specific rule app, company world and modern streaming/recovery needs may not map cleanly;
- donor code can smuggle old semantics back into the product;
- may duplicate already-solved v2 infrastructure problems.

## 4. Candidate C — Entirely new minimal runtime

Build a new pipeline from zero with no v1/v2/Hospital implementation base.

Pros:

- maximum conceptual cleanliness;
- no hidden historical assumptions.

Risks:

- repeats solved Worker streaming/concurrency/reconnect problems;
- largest operational risk;
- likely slower to first correct gameplay unless scope is extremely small.

## 5. Provisional recommendation

**Recommend Candidate A, but only as “kernel salvage / product runtime rewrite”, not “continue v2”.**

Reason:

The strongest evidence so far says the v2 failure was primarily product-canon inheritance/acceptance failure, while the later v2 transport work specifically addressed real Cloudflare streaming, stale-attempt, retry and subrequest-budget defects.

This recommendation is conditional. Before implementation, perform a bounded kernel audit proving the retained kernel can be represented behind a small interface without importing demo/product semantics.

If that audit fails the simplicity criteria, choose B or C rather than preserving v2 by inertia.

## 6. Target conceptual architecture

Recommended target regardless of implementation donor:

```text
Browser
  |
  | literal action / explicit system command
  v
Game API
  |
  +-- ordinary turn ------------------------------+
  |                                               |
  |  Load committed context                       |
  |      -> reserve one turn attempt              |
  |      -> Story LLM streams visible narrative   |
  |      -> small post-Story observer              |
  |      -> pure reducers                          |
  |      -> atomic commit                          |
  |                                               |
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

Browser does not orchestrate Story→Observer→Commit stages.

## 7. Functional core / imperative shell

### Imperative shell

Owns:

- HTTP/SSE;
- LLM/network calls;
- DB transaction calls;
- attempt reservation/fencing;
- timeout/reconnect;
- sidecar dispatch.

### Functional core

Pure functions own:

- content projection;
- Story context construction;
- observer normalization;
- scene/rule/clothing/mechanic reducers;
- memory window construction;
- UI view-model projection.

Pure domain reducers should be testable without Cloudflare/Supabase/LLM.

## 8. Product/content compiler boundary

Do not hand-code semantic lists in runtime.

Introduce one explicit content boundary, conceptually:

```text
content/*.json
   -> validate/build CompanyContent
   -> Story/UI/domain readers
```

`CompanyContent` includes stable IDs and source facts but no gameplay state.

Tests must assert parity between source content and compiled projection.

## 9. Story output redesign — simplify the provider contract

The old semantic Story wire (`[SCENE]`, `[DIALOGUE]`, `[CHOICE]`, etc.) created protocol fragility and allowed provider self-repair/control text to leak into canonical Story.

The redesign should prefer **player-visible narrative as the primary Story output**, not a hidden semantic document.

Provisional preferred format:

- natural Korean narrative;
- dialogue uses the product-visible convention `화자명(연기지시): "대사"` where applicable;
- no OOC/self-repair/control vocabulary in committed visible text;
- optional deterministic dialogue metadata may be parsed only when exact registered speaker name/ID mapping is unambiguous;
- uncertain speaker metadata degrades TTS/structured dialogue only, not the narrative turn.

The post-Story observer extracts machine state from the completed Story.

If implementation chooses another Story envelope, it must prove it improves acceptance without reintroducing protocol garbage or semantic-authority complexity.

## 10. Story call

Story is sole narrative author.

Inputs are bounded to accepted product/state/memory context.

Do not provide:

- precomputed action success;
- relation stage;
- consent/compliance verdict;
- generic action class;
- risk probability;
- generic physical execution plan;
- observer interpretation from future/current turn.

No automatic Story retry-until-lucky.

## 11. Observer call

One small post-Story observer is the default candidate.

It reads the committed candidate Story and current state. It may propose only fields accepted by L3.

Optional projection failure is fail-open where structurally safe.

Mind Monitor may be produced in the same call or another explicitly justified nonblocking mechanism; call topology is not a product law. The architecture review should optimize reliability and simplicity, not preserve prior call counts by habit.

## 12. Commit boundary

One transaction commits an accepted ordinary turn:

- literal action;
- Story;
- allowed structural/mechanical reductions;
- memory/summary artifacts that are already available;
- optional monitor/presentation payload;
- turn identity/revision.

No arbitrary full-save submission from browser/LLM.

## 13. System commands are not ordinary Story turns

Separate APIs/domain commands for:

- apply/change/remove `상식개변` rule;
- feedback revision;
- reset/new game.

They have their own transaction semantics.

Do not convert them into fake literal player actions.

## 14. UI architecture

Use the accepted Golden UI surface inventory as input.

Recommended approach:

- transplant/rebuild presentation from the complete Company product surfaces;
- new thin controller talks only to redesigned API/context;
- frontend does not own gameplay state transitions;
- no frontend semantic catalog duplicates;
- UI derives display state from one view model/context response.

## 15. Testing architecture

Three distinct test layers:

### Product contract tests

Assert content identity, Setup fields, UI surfaces, Story prompt projection, removed features, etc.

### Structural runtime tests

Assert transaction/fencing/reconnect/idempotency/commit invariants.

### Manual acceptance

Opening/5-turn/10-turn/20+ turn scenarios from L1.

A green structural suite cannot override failed product/manual acceptance.

## 16. First implementation milestone after design approval

Do **not** rebuild the whole game first.

Milestone 0:

- canonical Setup + real Company content;
- correct Opening;
- real UI Story/action/MM shell;
- one ordinary turn through final selected runtime kernel;
- refresh/readback;
- no CSA/media/feedback yet unless needed to prove product identity.

Owner reviews Opening + 3–5 turns immediately.

Only after product acceptance should deeper infrastructure/feature completion proceed.
