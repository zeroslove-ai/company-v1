# Company Redesign — Architecture Decision Framework

Status: OWNER-REVIEW DRAFT / PRODUCT INPUTS LOCKED  
Date: 2026-08-21

Architecture is chosen only after Product Constitution, Acceptance Scenarios, Golden Master, Gameplay/State/Memory Model, and the nine-rule CSA MVP decision. Existing code has no right to survive merely because it exists.

The previously open product questions are now resolved:

- ordinary turns have free input **and four Story-authored choices**, projected by Extract;
- immediate physical continuity starts with one bounded `scene_note` only;
- dynamic player sexual/arousal/erection/ejaculation gauge is removed;
- retained CSA templates use flexible supported subject/counterparty scope rather than one hard-coded historical pairing.

Architecture must implement these decisions; it may not reopen them for convenience.

## 1. Architecture success criteria

Score candidates in this order:

1. Product fidelity — easiest path to pass P0/P1 acceptance.
2. Conceptual simplicity — one turn explainable in a few steps.
3. Single authority — no browser/server/DB duplicate gameplay writers.
4. Long-play continuity without giant ontology.
5. Failure isolation — optional observer/MM/choice/media failure cannot destroy good Story.
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
- explicit retry rather than auto-regeneration;
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
- historical generic CSA execution surfaces;
- any dynamic player sexual-meter state.

Pros: preserves hard-earned transport/concurrency fixes.  
Risks: job/retry machinery may still be too complex and sunk-cost bias may leak product assumptions back in.

## 3. Candidate B — Hospital-derived runtime skeleton, Company product rewritten on top

Reuse Hospital only as independently proven donor ideas: natural Story + four choices, Story→observe→commit flow, memory windowing, Mind Monitor approach, and proven UI/runtime interaction patterns.

Do not inherit Hospital semantic domains, hypnosis, consent/physical taxonomies, DB identities, or hidden assumptions.

The specific Hospital-like behavior desired here is the **natural Story-authored choice experience**, not wholesale Hospital runtime copying.

Pros: strong play-feel donor evidence.  
Risks: may smuggle foreign semantics and duplicate solved streaming/concurrency work.

## 4. Candidate C — Entirely new minimal runtime

Build from zero without v1/v2/Hospital implementation base.

Pros: conceptual cleanliness.  
Risks: repeats solved Worker streaming/concurrency/reconnect problems and may slow first correct gameplay.

## 5. Provisional recommendation

Recommend **Candidate A only as kernel salvage / product runtime rewrite**, not “continue v2”.

This remains conditional on a bounded kernel audit proving the retained kernel can sit behind a small product-neutral interface. If not, choose B or C.

## 6. Target conceptual architecture

```text
Browser
  |
  | literal free input OR extracted full choice text
  v
Game API
  |
  +-- ordinary turn ------------------------------+
  |  load committed context                       |
  |  reserve one attempt                          |
  |  Story LLM streams visible narrative          |
  |  Story also writes 4 natural next choices     |
  |  one post-Story Extract/observer               |
  |     - scene/time                               |
  |     - scene_note                               |
  |     - clothing evidence                       |
  |     - four literal choices                    |
  |     - summary + Mind Monitor                   |
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

Pure functional core owns content projection, Story context, observer normalization, minimal scene/rule/clothing reducers, memory window, choice projection validation, and UI view-model projection.

## 8. Product/content compiler boundary

```text
accepted content sources
   -> validate/build CompanyContent
   -> Story/UI/domain readers
```

`CompanyContent` carries stable source facts but no gameplay state.

For CSA, `CompanyContent` exposes only the accepted nine active templates and one canonical supported scope vocabulary. It does not compile historical 44-rule active semantics and filter them later.

## 9. Story output contract — natural narrative + natural choices

Player-visible narrative is the primary Story output.

Preferred contract:

- natural Korean narrative;
- dialogue uses product-visible `화자명(연기지시): "대사"` where useful;
- Story ends with four natural full-action suggestions for the next turn;
- no OOC/self-repair/control vocabulary in committed Story;
- no mandatory `[SCENE]/[DIALOGUE]/[CHOICE]` hidden semantic wire merely to make the game work;
- optional deterministic speaker metadata may be parsed only when identity is unambiguous.

The same post-Story Extract reads the completed text and projects the four choices plus minimal machine state.

If a different envelope is proposed, it must prove that it materially improves reliability without reintroducing visible protocol garbage or a second narrative author.

## 10. Story call

Story is sole narrative author and sole author of the four next-action suggestions.

Inputs are bounded to accepted product/state/memory context, including relevant active nine-rule premises with selected flexible scope.

Do not provide precomputed action success, relation stage, consent/compliance verdict, generic action class, risk probability, generic physical execution plan, dynamic player sexual meter, or historical non-MVP CSA semantics.

No automatic retry-until-lucky.

## 11. Extract/observer call

Default: one small post-Story observer.

It may propose only accepted fields:

- elapsed time;
- location/presence changes with evidence;
- replacement `scene_note`;
- ordinary clothing changes with actor evidence;
- four literal Story-authored choices;
- turn summary;
- Mind Monitor;
- warnings.

Extract does not invent replacement choices or narrative consequences. Choice/MM/optional observation failure is local; it never triggers a second Story generation.

## 12. Commit boundary

One transaction commits an accepted ordinary turn:

- literal action;
- raw Story;
- extracted current-turn choices when valid;
- allowed structural/mechanical reductions;
- scene_note;
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

First implementation supports exactly the nine retained templates.

Required mechanics:

- durable rule lifecycle;
- flexible finite `subject_scope` / optional `counterparty_scope` validation;
- non-turn transaction;
- exact four-slot clothing synchronization for retained clothing rules;
- Story-premise projection for request/open-ended rules.

Scope flexibility is deliberately generic **data**, but rule execution is not a generic DSL. A scope combination changes who the wording applies to; it does not install a new action taxonomy/consent/compliance engine.

If source audit proves a flexible supported scope model is materially too complex or semantically incoherent for some retained rule, stop and return exact evidence/cost to owner before narrowing.

## 15. UI architecture

Use the accepted Golden surface inventory.

- complete Company presentation intentionally rebuilt/transplanted;
- four extracted current-turn choices + free input are first-class action surfaces;
- thin controller talks to redesigned API/context only;
- frontend owns no gameplay transition;
- no frontend semantic catalog duplicates;
- `상식개변` UI displays only 3/3/3 catalog with flexible supported scope controls;
- removed dynamic player sexual gauge has no compatibility placeholder.

## 16. Testing architecture

### Product contract tests

Assert Company content, Setup, UI surfaces, Story context, four Story-authored choices, free input, scene_note model, removed player meter, and exact nine-rule flexible-scope CSA catalog.

### Structural runtime tests

Assert transaction/fencing/reconnect/idempotency/commit invariants.

### Manual acceptance

Opening / 3–5 / 10–20 turns, then nine-rule CSA play.

Green structural tests cannot override failed product/manual acceptance.

## 17. First implementation milestone after architecture approval

Milestone 0:

- canonical Setup + real Company content;
- correct Opening;
- real UI Story/action/Mind Monitor shell;
- one ordinary turn through selected kernel;
- Story-authored four choices projected by Extract;
- free input;
- scene_note continuity skeleton;
- refresh/readback;
- no active CSA mutation/media/feedback yet unless required for product identity.

Owner reviews Opening + 3–5 turns immediately.

## 18. Remaining decision before source implementation

The four product questions previously listed here are resolved by owner decision on 2026-08-21.

The remaining major decision is **architecture selection** itself: Candidate A kernel salvage vs Candidate B Hospital-derived skeleton vs Candidate C new minimal kernel, based on the bounded source audit required by Gate 1.
