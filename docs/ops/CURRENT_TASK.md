# Company v1 — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: hospital-reference-spine-alignment-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

**STOP STATE:** The user has paused the execution loop. Codex/Hermes must not start implementation, deploy, create/reset TEST games, or run live gameplay until a later owner/operator registration explicitly changes this task to `Status: READY` with exact branch/SHA/blob authority.

## 0. Owner design decision

Newest binding design:

`docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`

Current main at this design handoff:

`5654fe20a5d39c6fd4c9d2e94c7d450e331bc83d`

This main already includes:
- PR #78 clothing-CSA absent-NPC bootstrap repair;
- PR #79 `user-live-turn33-continuity-contract-repair-v1` bounded continuity repair.

Do not revert PR #79 by assumption. Freshly inspect what it changed when this task eventually becomes READY, then keep only source behavior that fits the new Hospital Reference Spine Alignment canon. Delete redundant hotfix residue rather than layering new compatibility paths.

The earlier `user-live-turn33-continuity-contract-repair-v1` task identity is superseded as the forward implementation plan. Its live evidence and already-landed source changes remain factual inputs.

## 1. Target architecture

The intended fresh loop is:

```text
literal player input / clicked literal choice
→ minimal committed facts
→ Story (sole narrative author)
→ one lightweight post-Story Extract call
→ small deterministic reducers
→ Commit
→ game_save + game_turns
→ next Story / UI
```

The same Extract call may return:

- structural scene observation;
- compact clothing observation when needed;
- narrow player sexual delta if the current UI mechanic is retained;
- elapsed time;
- natural-language turn summary;
- Mind Monitor presentation text;
- one current evidence vocabulary for retained machine changes.

Mind Monitor is **not a separate LLM stage**. It stays in the same Extract call, Hospital-style, but is presentation-only: missing/partial output is fail-open, requires no exact quote provenance, gets no retry solely for completion, and cannot alter Story/Commit authority.

## 2. Evidence motivating the alignment

Preserved manual TEST game:

`9755b57b-5cbb-44dd-a624-020fe516c16d`

The 33-turn session showed that Story itself was generally coherent while the fresh observation boundary remained over-fragmented: physical evidence vocabulary mismatch, half-alive player sexual state, blank summaries, blank Mind Monitor, stale focal state, and overly narrow multi-NPC exact navigation.

These are not authorization for separate new subsystems. They are evidence that the Story→Extract→Reducer contract should become materially smaller.

## 3. Required implementation approach once READY

### Phase A — current-source inventory

Freshly inspect current main, including PR #79 changes, and map:

- Story payload fields;
- fresh Extract provider fields;
- fresh Extract normalization fields;
- reducer consumers;
- current UI consumers;
- historical-only replay/compatibility readers;
- scene/focus readers;
- player sexual state readers/writers;
- memory readers;
- exact navigation resolver.

Every retained fresh field requires one current consumer and one authority reason.

### Phase B — deletion and contract reduction

Target outcomes:

- one post-Story Extract call only;
- delete unreachable fresh legacy semantic vocabulary rather than merely adding more prohibitions;
- one actor-scoped evidence vocabulary consumed directly by retained reducers;
- remove duplicate evidence translations/adapters;
- keep compact clothing as the proven finite continuity/CSA mechanic;
- retain free physical/position durability only if a concrete current consumer is proven;
- keep Mind Monitor in the same Extract call, presentation-only and fail-open;
- preserve one natural-language `turn_summary`;
- when an older summary is empty, use a deterministic bounded read-time projection of already committed Story/parsed narrative so the committed turn does not vanish from long-term memory;
- make retained player sexual mechanic one-writer coherent or remove writer/state/UI/tests together;
- audit focal/last-speaker durability and derive presentation-only focus instead of adding a classifier when possible;
- keep exact navigation structural, including multiple exact registered NPCs that all resolve to one unique destination;
- do not add generic relationship/event/emotion/open-fact state.

### Phase C — scenario/contract tests

At minimum prove:

1. literal player action round-trip;
2. exact single and multi-NPC same-destination navigation;
3. movement clears source presence and destination evidence adds only destination actors;
4. exact clothing CSA mechanical continuity;
5. ordinary clothing evidence cannot cross-authorize another actor;
6. optional observation failure does not fail a correct Story turn;
7. retained player sexual mechanic changes only from exact Story evidence;
8. empty old summary does not erase the committed turn from long-term Story memory;
9. empty/partial Mind Monitor does not affect Commit or next Story;
10. fresh Extract has no generic relation/event/emotion/work/sexual-event authority;
11. refresh/replay returns the same committed reality.

Tests that only preserve superseded implementation shape are deletion candidates.

## 4. Final acceptance order — manual live play must be last

When eventually READY, use this order:

1. source audit;
2. deletion/contract simplification;
3. focused tests;
4. full tests;
5. exact-head CI;
6. owner review;
7. merge;
8. exact merged-main TEST deploy;
9. structural/API smoke only;
10. prepare one fresh disposable Level-7 manual TEST game / public URL;
11. perform **zero automated gameplay Story turns** in that final game;
12. set `WAITING_USER_LIVE_ACCEPTANCE` and STOP;
13. user performs the long 30–50+ turn product-play acceptance.

**Codex/Hermes automated long live gameplay is forbidden for this alignment task.**

## 5. Hard prohibitions

- no implementation while status is `WAITING_OWNER_DECISION`;
- no automatic loop restart;
- no Hospital source copy/paste architecture migration;
- no giant Worker consolidation;
- no new semantic router/classifier/verifier;
- no general consent/compliance engine;
- no relationship/event/emotion/open-fact ledger reintroduction;
- no finite generic physical/sexual action grammar;
- no generic CSA execution DSL;
- no third parser generation;
- no retry/regenerate-until-lucky behavior;
- no provider/model change to mask defects;
- no separate Mind Monitor LLM stage;
- no optional subsystem failure causing Story loss;
- no automated long live QA before user manual acceptance;
- no Production changes without separate owner authorization.

## 6. Resume condition

A future operator may make this executable only by explicitly registering:

- `Status: READY`;
- exact current `main` SHA;
- exact task branch;
- exact registration SHA;
- exact CURRENT_TASK blob SHA;
- confirmation that the 2026-08-18 Hospital Reference Spine Alignment Canon was re-read against current source, including PR #79 changes;
- bounded implementation/deploy authority.

Until then: **STOP.**
