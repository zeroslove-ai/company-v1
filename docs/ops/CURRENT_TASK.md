# Company v1 — CURRENT TASK

Status: WAITING_OWNER_DECISION
Task ID: hospital-reference-spine-alignment-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

**STOP STATE:** This task is deliberately **not READY**. The user has paused the execution loop. Codex/Hermes must not start implementation, deploy, create/reset TEST games, or run live gameplay from this file until a later owner/operator comment explicitly changes this task to `Status: READY` with exact registration SHA/blob/branch.

## 0. Owner design decision

Newest binding design:

`docs/COMPANY_V1_HOSPITAL_REFERENCE_SPINE_ALIGNMENT_CANON_2026-08-18.md`

Current accepted main at design registration:

`196e4ef632017c88c27f76c2d00a77f8ce194f7c`

That main includes PR #78 clothing-CSA absent-NPC bootstrap repair. Do not reopen that exact seam without new evidence against the merged/deployed repair.

The earlier queued proposal `user-live-turn33-continuity-contract-repair-v1` is **superseded as an implementation plan**. Its 33-turn observations remain evidence, but the next implementation should treat them as one over-fragmented fresh observation-boundary problem rather than independent hotfixes.

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

## 2. Why this task exists

Direct manual TEST game evidence:

`9755b57b-5cbb-44dd-a624-020fe516c16d`

Observed by the user through 33 committed turns:

- literal UTF-8 input functioning;
- exact-four choices functioning on all 33 committed turns;
- Story continuity materially better than prior architecture;
- physical/position observations could be proposed yet dropped because Extract evidence vocabulary and reducer evidence vocabulary do not match;
- player sexual state remained effectively unchanged while frontend readers still expose the mechanic;
- successful Extract turns could have empty `turn_summary`;
- successful Extract turns could have empty `mind_monitor`;
- multiple exact NPC names sharing one destination could fail deterministic navigation, leaving canonical location behind Story;
- focal state could remain stale relative to actual current dialogue/action center.

These are interpreted as one structural class: **fresh Story→Extract→Reducer contract fragmentation**.

## 3. Proposed implementation scope once READY

### A. Fresh-path inventory first

Before editing, re-read current main and prove all current callers for:

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

### B. Fresh Extract reduction

Reduce the current fresh contract instead of adding another adapter.

Targets:

- one post-Story Extract call only;
- delete unreachable fresh legacy vocabulary rather than merely prohibiting it in prompts;
- remove duplicate evidence translation shapes;
- one actor-scoped evidence vocabulary consumed directly by retained reducers;
- keep compact clothing only as proven product state;
- retain free physical/position durability only if a concrete current consumer is proven;
- keep Mind Monitor in the same Extract call but presentation-only/fail-open;
- preserve one natural-language `turn_summary`.

Do not add relationship/event/emotion/open-fact ledgers.

### C. Memory continuity

Keep latest six committed raw turns + older natural-language summaries.

If an older committed turn has an empty summary, the turn must not disappear from memory. Use a deterministic bounded read-time projection of already committed raw Story/parsed narrative as fallback. No second LLM summary call, no retry-until-summary, no semantic ledger.

### D. Scene/focus/navigation

- preserve structural location/presence authority;
- audit `focal_character_id` / `last_speaker_id`; derive at presentation/readback if no independent durable consumer exists;
- do not add a focus classifier;
- allow deterministic navigation when multiple exact registered NPC mentions all resolve to the same single registered location;
- conflicting/ambiguous destinations fall back to Story;
- no general intent parser.

### E. Player sexual mechanic

Make an explicit end-to-end decision:

- if current product/UI genuinely retains it: one fresh Extract delta/current display state + exact Story evidence → one deterministic reducer → one durable state;
- if not retained: remove writer/state/UI/tests together.

No sexual event ledger or generic sexual action taxonomy.

### F. Tests

Prefer scenario/contract coverage over implementation-shape preservation.

Required classes include:

1. literal player-action round trip;
2. single- and multi-NPC same-destination exact navigation;
3. movement/presence separation;
4. exact clothing CSA mechanical continuity;
5. ordinary actor-correct clothing evidence;
6. optional observation failure does not fail Story turn;
7. retained player sexual mechanic updates only from exact Story evidence;
8. empty old summary still preserves committed turn through raw-Story memory fallback;
9. empty Mind Monitor does not affect Commit/next Story;
10. no fresh generic relation/event/emotion/work/sexual-event authority;
11. refresh/replay returns the same committed reality.

## 4. Final acceptance order

When this task is eventually READY and implementation is accepted, use this order:

1. source audit;
2. deletion/contract simplification;
3. focused tests;
4. full tests;
5. exact-head CI;
6. owner review;
7. merge;
8. exact merged-main TEST deploy;
9. structural/API smoke only;
10. prepare one fresh manual TEST game / URL;
11. **STOP at `WAITING_USER_LIVE_ACCEPTANCE`**;
12. user performs the long 30–50+ turn product play.

**Codex/Hermes automated 15–20/30–50 turn live QA is forbidden for this design.** User manual live play is intentionally the final product acceptance stage.

## 5. Hard prohibitions

- no implementation while status is `WAITING_OWNER_DECISION`;
- no automatic loop restart;
- no Hospital source architecture copy;
- no giant Worker consolidation;
- no new semantic router/classifier/verifier;
- no general consent/compliance engine;
- no generic relation/event/emotion/open-fact ledger;
- no finite generic physical/sexual action grammar;
- no generic CSA execution DSL;
- no third parser generation;
- no retry/regenerate-until-lucky behavior;
- no provider/model change to mask defects;
- no separate Mind Monitor LLM stage;
- no optional subsystem failure causing Story loss;
- no automated long live gameplay before user manual acceptance;
- no Production changes without separate owner authorization.

## 6. Resume condition

A future operator may make this executable only by explicitly registering:

- `Status: READY`;
- exact current `main` SHA;
- exact task branch;
- exact registration SHA;
- exact CURRENT_TASK blob SHA;
- confirmation that the 2026-08-18 Hospital Reference Spine Alignment Canon was re-read against current source;
- bounded implementation/deploy authority.

Until then: **STOP.**
