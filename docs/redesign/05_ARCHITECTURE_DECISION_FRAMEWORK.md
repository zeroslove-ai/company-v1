# Company Redesign — Architecture Decision Framework

Status: OWNER-REVIEW DRAFT / PRODUCT INPUTS LOCKED  
Date: 2026-08-21

Architecture is chosen only after Product Constitution, Acceptance Scenarios, Golden Master, Gameplay/State/Memory Model, the nine-rule CSA MVP decision, and the Company v1 salvage audit.

**Important correction:** Candidates A/B/C below are **runtime-kernel alternatives only**. They are not three complete product/UI architectures.

The forward game is composed from two axes:

```text
runtime kernel: choose A / B / C
+
Company v1 product salvage: follow 08_COMPANY_V1_SALVAGE_MATRIX.md
```

Whichever kernel wins, the complete Company v1 presentation at `5ec1a76ac782d3a4fc8042f3d6a62854204b1c84` remains the primary UI donor. The reduced `frontend-v2/` shell is not the target UI.

The locked product inputs are:

- ordinary turns have free input **and four Story-authored choices**, projected by Extract;
- immediate physical continuity starts with one bounded `scene_note` only;
- dynamic player sexual/arousal/erection/ejaculation gauge is removed;
- retained CSA templates use flexible supported subject/counterparty scope rather than one hard-coded historical pairing;
- Company v1 visible presentation is high-parity salvage by default; kernel replacement changes wiring/authority, not the product into a new minimal shell.

Architecture may not reopen these for convenience.

## 1. Architecture success criteria

Score kernel candidates in this order:

1. Product fidelity — easiest path to pass P0/P1 acceptance behind the Company v1 presentation.
2. Conceptual simplicity — one turn explainable in a few steps.
3. Single authority — no browser/server/DB duplicate gameplay writers.
4. Long-play continuity without giant ontology.
5. Failure isolation — optional observer/MM/choice/media failure cannot destroy good Story.
6. Streaming correctness.
7. Concurrency correctness.
8. Testability of product and structural contracts.
9. Operational simplicity.
10. Reuse value — only after the above.

## 2. Candidate A — Salvage current v2 transport kernel

Potential KEEP candidates:

- server-owned turn lifecycle;
- one canonical `(game, turn)` job;
- attempt fencing;
- explicit retry rather than auto-regeneration;
- durable streamed Story progress/reconnect;
- isolated mutable Company tables;
- atomic commit boundary;
- Cloudflare/Supabase wiring.

Replace/rebuild around that kernel:

- v2 demo/product content adapter;
- Opening;
- Story context/prompt;
- observer/domain projection;
- current reduced `frontend-v2` product shell;
- product acceptance tests;
- historical generic CSA execution surfaces;
- dynamic player sexual-meter state.

The replacement for `frontend-v2` is **the salvaged Company v1 presentation**, not another new frontend design.

Pros: preserves hard-earned transport/concurrency fixes.  
Risks: job/retry machinery may still be too complex and sunk-cost bias may leak product assumptions back in.

## 3. Candidate B — Hospital-derived runtime kernel/skeleton

Reuse Hospital only as independently proven donor ideas: natural Story + four choices, Story→observe→commit, memory windowing, Mind Monitor approach, and proven interaction patterns.

Do not inherit Hospital semantic domains, hypnosis, consent/physical taxonomies, DB identities, or hidden assumptions.

The Hospital behavior we specifically want is the natural play feel where Story itself writes the next four actions and downstream extraction turns them into UI choices, not wholesale Hospital frontend/runtime copying.

The visible frontend still comes primarily from the Company v1 salvage matrix.

Pros: strong play-feel donor evidence.  
Risks: may smuggle foreign semantics and duplicate solved streaming/concurrency work.

## 4. Candidate C — Entirely new minimal runtime kernel

Build the runtime spine from zero without v1/v2/Hospital implementation base.

This still does **not** mean a greenfield UI: Company v1 presentation/content salvage remains the product layer.

Pros: conceptual cleanliness.  
Risks: repeats solved Worker streaming/concurrency/reconnect problems and may slow first correct gameplay.

## 5. Provisional recommendation

Recommend **Candidate A as the leading kernel candidate only**, conditional on a bounded audit proving it can sit behind a small product-neutral interface.

The leading complete composition is:

```text
Company v1 high-parity presentation/content
+ new thin client controller / minimal view model
+ new minimal Company state/domain
+ Candidate A kernel if it passes audit
```

If A fails the simplicity audit, switch the kernel to B or C without throwing away the Company v1 product layer.

## 6. Target conceptual architecture

```text
Company v1 presentation shell
  |
  | literal free input OR extracted full choice text
  | thin redesigned controller only
  v
Game API / selected kernel
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
Committed Context / minimal Company view model
  |
  +-- salvaged Company v1 renderers/panels
  +-- next Story
  +-- optional Image/TTS sidecars
```

Browser never orchestrates Story→Observer→Commit stages.

## 7. Functional core / imperative shell

Imperative server shell owns HTTP/SSE, LLM/network, DB transaction calls, attempt reservation/fencing, timeout/reconnect, sidecars.

Pure functional core owns content projection, Story context, observer normalization, minimal scene/rule/clothing reducers, memory window, choice projection validation, and server-to-UI view-model projection.

Frontend owns rendering and literal user intent only.

## 8. Product/content compiler boundary

```text
accepted Company content sources
   -> validate/build CompanyContent
   -> Story/UI/domain readers
```

`CompanyContent` carries stable source facts but no gameplay state.

For CSA, `CompanyContent` exposes only the accepted nine active templates and one canonical supported scope vocabulary. It does not compile the historical 44 as active semantics and filter them later.

## 9. Story output contract — natural narrative + natural choices

Player-visible narrative is the primary Story output.

Preferred contract:

- natural Korean narrative;
- dialogue uses product-visible `화자명(연기지시): "대사"` where useful;
- Story ends with four natural full-action suggestions for the next turn;
- no OOC/self-repair/control vocabulary in committed Story;
- no mandatory `[SCENE]/[DIALOGUE]/[CHOICE]` hidden semantic wire merely to make the game work;
- optional speaker metadata is accepted only when identity is unambiguous.

The same post-Story Extract reads the completed text and projects the four choices plus minimal machine state.

Choices may use a simple natural numbered/footer form. The binding law is: **Story authored them; Extract copies them.** Extract is not a second choice author.

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

Extract does not invent replacement choices or narrative consequences. Choice/MM/optional observation failure is local and never triggers a second Story generation.

## 12. Commit boundary

One transaction commits:

- literal action;
- raw Story;
- extracted current-turn choices when valid;
- allowed structural/mechanical reductions;
- scene_note;
- available memory/summary artifacts;
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

Scope flexibility is generic **data**, but rule execution is not a generic DSL.

If source audit proves flexible supported scope is materially too complex or semantically incoherent, stop and return exact evidence/cost to owner before narrowing.

## 15. Company v1 UI/product salvage is binding architecture input

Detailed file/module classification: `08_COMPANY_V1_SALVAGE_MATRIX.md`.

Primary rules:

- `src/frontend/pages/*` at `5ec1a76...` is the primary presentation donor;
- `index.html` + shell/panel/mobile CSS are high-parity transplant, not greenfield redesign;
- `render.js` narrative/choices/history presentation is transplanted with narrow contract rewiring;
- `setup.js` is near-verbatim KEEP with new submit API;
- `company-map.js/css` is KEEP/light-rewire;
- Mind Monitor presentation is transplanted with new observer data;
- `csa-app.js` visual/modal UX is transplanted but old 44-rule/state/submit semantics are rebuilt;
- `tts.js`, history/download/media UI are later donor assets;
- `view-model.js` pattern is kept but implementation is rebuilt around minimal state;
- `app.js` is **not** transplanted wholesale because its `createTurnCoordinator()` owns Story→Extract→Commit;
- legacy API/SSE stage contracts are rewired to one server-owned turn request;
- current reduced `frontend-v2/` shell is not the forward product.

Choosing B or C instead of A does not change these presentation decisions.

## 16. Testing architecture

### Product contract tests

Assert Company content, Setup, salvaged UI surfaces, Story context, four Story-authored choices, free input, scene_note, removed player meter, and exact nine-rule flexible-scope CSA catalog.

### Structural runtime tests

Assert transaction/fencing/reconnect/idempotency/commit invariants of the selected kernel.

### Visual salvage tests/review

Compare actual desktop/mobile result against `5ec1a76...` and `08_COMPANY_V1_SALVAGE_MATRIX.md`. Differences must be intentional, especially removed gauge and changed CSA semantics.

### Manual acceptance

Opening / 3–5 / 10–20 turns, then nine-rule CSA play.

Green structural tests cannot override failed product/manual acceptance.

## 17. First implementation milestone after architecture approval

Milestone 0:

- transplant the Company v1 Story/action/MM/setup presentation at high parity;
- canonical Setup + real Company content;
- correct Opening;
- one ordinary turn through selected kernel;
- Story-authored four choices projected by Extract;
- free input;
- scene_note continuity skeleton;
- refresh/readback;
- no active CSA mutation/media/feedback yet unless required for product identity.

Owner reviews the **actual salvaged UI** plus Opening + 3–5 turns immediately.

## 18. Remaining decision before source implementation

The product behavior questions are closed.

The remaining architecture work is a composed audit:

1. **Kernel:** Candidate A vs B vs C.
2. **Salvage:** finalize exact Company v1 files/modules under KEEP / TRANSPLANT / REWIRE / REBUILD / DELETE / DEFER_KEEP.

The kernel choice may not be used as justification to discard or redesign the accepted Company v1 presentation.