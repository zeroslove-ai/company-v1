# Company v1 — CURRENT TASK

Status: READY
Task ID: user-live-turn33-continuity-contract-repair-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## 0. Operator review decision

Previous task: `merge-clothing-csa-repair-test-live-v1`
Accepted terminal: Issue #68 comment `5323008480`
Accepted terminal classification: `CLOTHING_CSA_NPC_BOOTSTRAP_LIVE_PROVEN`
Previous task registration SHA: `7f124c1873f1732cc6fcdc8dc761e75eb19aa7c6`
Previous final task branch SHA: `4475a263d942f21fb92af71d8a26440a25aadac0`
Previous final CURRENT_TASK blob: `85eea9ae329b0e307dfbf993dafb67f20f221b6c`

Independent verification accepted the terminal:
- PR #78 exact reviewed head `a7fdb343da791c305a51ffa690c5329e63523000` was normal-merged.
- Merge commit/current main is `196e4ef632017c88c27f76c2d00a77f8ce194f7c`.
- Main CI run `32092604861` is SUCCESS on that exact SHA.
- Exact merged-main TEST API Worker is `game-proxy-company-v1` version `867c3789-60e9-4c7f-b621-98787ee886a1`.
- Narrow disposable TEST game `bde757fc-2ced-489e-ad92-1145084cfba5` proved the repaired absent-NPC clothing bootstrap live: at committed turn 17, present registered `heroine3` with no prior `npc_scene_state` received exactly four clothing slots with structural unknown defaults and `underwear_bottom=removed`, `updated_turn=17`; later evidenced clothing updates preserved that required slot through turn 20.
- All 20 Korean actions in that proof were byte-exact in `game_actions` and `game_turns`.
- Production/migration/provider-model changes/preserved-game mutation were zero. One transport-only opening retry occurred before any gameplay reservation/Commit; gameplay retries were zero.

This closes the clothing-bootstrap defect. Do not reopen it in this task unless fresh evidence shows a distinct regression.

Issue #68 comment `5322999593` was deliberately queued while the previous task was still active. The previous task is now terminal and accepted, so this task promotes that queued user-live evidence into executable authority.

## 1. Frozen base and branch

Repository: `zeroslove-ai/company-v1`
Required base main: `196e4ef632017c88c27f76c2d00a77f8ce194f7c`
Expected branch: `company/user-live-turn33-continuity-contract-repair-v1`

Before editing:
1. fresh-fetch `main` and require the exact base above;
2. verify this branch is exactly one docs-only registration commit ahead of that base;
3. re-read terminal `5323008480`, queued evidence comment `5322999593`, and this exact CURRENT_TASK blob;
4. read current truth/authority docs and current source contracts before choosing changes;
5. inspect preserved user game `9755b57b-5cbb-44dd-a624-020fe516c16d` READ-ONLY, committed turns 1..33 only. T34/in-flight actions are excluded from the evidence baseline;
6. do not infer defects from prose summaries alone; line up exact Story, Extract, Commit, save/history and source paths.

If main/evidence differs materially, STOP `BLOCKED_USER_LIVE_TURN33_EVIDENCE_DRIFT` rather than guessing.

## 2. User manual-play authority and preserved evidence

User-owned TEST game: `9755b57b-5cbb-44dd-a624-020fe516c16d`

Hard preservation rule:
- NEVER reset, reuse, advance, replace, or mutate this game for scripted QA;
- read-only inspection is allowed;
- all prior manual/QA/evidence games remain preserved as well.

Accepted baseline facts:
- committed turns 1..33 are the semantic evidence window;
- 33/33 committed turns have exactly four stored choices;
- Korean free-text is intact; there is no UTF-8 corruption class in this session;
- Story continuity and literal player-action fidelity are generally strong across this long session;
- therefore do not regress Story into a finite physical/sexual action grammar, generic workplace script, retry-until-lucky loop, or server-authored semantic outcome system merely to close the defects below.

## 3. Confirmed defect A — physical position evidence is disconnected from the canonical writer

Live evidence:
- T8 Extract emitted `npc_observations.heroine5.physical.position_label` plus top-level `evidence.physical_change.changed=[npc_scene_state.heroine5.position_label]`; post-save `position_label` remained null.
- T23 Extract emitted position labels for heroine3/heroine5 plus physical-change evidence; post-save both remained null.
- T24 repeated the same shape; post-save remained null.
- Final T33 `npc_scene_state.heroine3/heroine5.position_label` is still null and their `updated_turn` remains 3 despite later observed physical changes.

Current contract seam to verify before edit:
- Extract prompt currently documents top-level physical-change evidence;
- fresh physical normalization retains `position_label` and clothing but not an actor-scoped position evidence value that Commit can consume;
- observation reducer/buildSceneStatePatch expects exact Story evidence at the position axis before writing.

Required repair direction:
- establish ONE actor-scoped exact Story-evidence path for `position_label` end-to-end: Extract prompt/schema -> normalization -> observation reducer -> canonical physical-state writer;
- delete/replace contradictory parallel evidence wording rather than keeping two competing evidence contracts;
- multi-NPC evidence must remain actor-specific: a quote proving heroine3 cannot authorize heroine5;
- exact Story grounding remains mandatory;
- do not add posture enums, physical action taxonomy, semantic routers/verifiers, retries, generic CSA execution, or fuzzy text inference.

## 4. Confirmed defect B — player sexual UI/state is a live zombie contract

Live evidence:
- `player_sexual_state` stayed exactly `{arousal:0, updated_turn:0, ejaculation_count:0, ejaculation_progress:0}` through all 33 committed turns;
- this remained unchanged through Story-established explicit sexual activity, including exposure/erection, penetration, and sustained intercourse;
- fresh Extract returned no usable `player_observation.sexual` updates.

Current product seam to verify before edit:
- Extract prompt says the retained direct player sexual mechanic may be observed;
- fresh normalization accepts `player_observation.sexual`;
- `reducePlayerSexualState()` has exact-evidence gates and is the durable writer;
- frontend currently consumes this state for visible excitement/ejaculation/erection presentation;
- current Extract evidence wording is not demonstrably aligned with the exact evidence shapes the reducer requires.

Required repair decision:
1. freshly inventory all current user-visible and context consumers;
2. if this mechanic is still a current product feature, make the EXISTING Extract observation/evidence contract internally coherent and add exact Story-backed regressions proving real updates can flow through the current sole writer;
3. if current canon proves the mechanic has actually been superseded, remove the stale writer/state consumer AND user-visible consumer together in the same cut instead of keeping an always-zero zombie;
4. never infer sexual success from player input intent, CSA activation, image tags, rule applicability, or mere attempted action;
5. do not invent a closed sexual-event/action taxonomy or consent matrix.

If the audit cannot determine the product authority without a new architectural decision, STOP `BLOCKED_PLAYER_SEXUAL_CONTRACT_OWNER_DECISION` with exact caller evidence instead of improvising.

## 5. Confirmed defect C — exact multi-NPC destination movement can lose deterministic routing

Live evidence:
- T24 explicit canonical location movement committed immediately.
- T26 naturally named exact registered coworkers Park Jungwoo and Seo Wonhee while moving toward the office where both were registered; Story established `brand_strategy_office`, Extract proposed it, but post-save remained at `office` until later exact scene evidence arrived.
- T27/T32 still proposed `brand_strategy_office` without exact scene evidence and Commit correctly preserved prior location.
- T33 finally supplied exact `kind:scene` evidence and only then changed the canonical location.

Current source seam to verify:
- `resolvePlayerNavigationIntent()` checks exact registered NPC mentions before catalog location matching;
- multiple mentioned NPCs can currently force an unresolved result even when all exact identities resolve to the same single canonical destination;
- the existing single-NPC movement phrase path is narrow.

Required repair direction:
- keep navigation deterministic, structural and exact;
- support the bounded case where multiple EXACT registered full-name mentions all resolve to ONE same canonical destination AND the literal action contains existing/explicit movement intent;
- ambiguous multiple destinations remain unresolved;
- non-movement mentions of multiple coworkers must remain non-navigation;
- no fuzzy name match, generated NPC search, semantic movement classifier, destination guessing, or Story-text backfill;
- add a regression shaped from the actual T26 request plus negative non-movement and divergent-destination cases.

## 6. Confirmed defect D — long-term continuity has silent summary holes

Live evidence:
- committed T12, T27, T29, T32 have blank `turn_summary` despite substantial Story continuity content;
- Mind Monitor is blank at T12, T27, T28, T29, T30, T32;
- those Extract results reported success without deterministic warning/telemetry for the missing outputs.

Current authority seam:
- Story context carries the latest six committed raw turns;
- older turns rely on chronological `turn_summary_memory`;
- therefore a blank summary becomes a real long-term context hole once the raw turn ages out;
- Mind Monitor is intentionally fail-open and must not trigger retry loops.

Required repair direction:
- do NOT synthesize semantic summaries in server code;
- do NOT retry Extract until a summary appears;
- make blank summary on a non-empty committed Story deterministic/observable and ensure it cannot silently erase the older-turn context;
- if fallback is required, prefer authority-preserving committed raw Story/parsed-block projection over invented server semantic prose;
- preserve chronological ordering and the existing six-raw-turn boundary unless source proof requires a narrower change;
- Mind Monitor may remain fail-open, but missing target entries must emit deterministic warning/telemetry instead of silent `success` + `{}`;
- strengthen prompt/schema wording only as part of ONE coherent authority contract, not as a second compatibility path;
- do not invent inner thoughts server-side.

## 7. Secondary bounded audit — stale focal character authority

Evidence:
- final T33 `last_speaker_id` and interaction center point at heroine1 while `focal_character_id` remains heroine5;
- T26 onward Extract repeatedly echoed heroine5 as focal candidate after conversational focus changed.

Required handling:
- inventory every current `focal_character_id` consumer before changing it;
- if focal is presentation-only or redundant, prefer demoting/removing stale Extract semantic authority and reuse already-authoritative same-turn structural/presentation signals;
- fix only if caller proof makes the cleanup small, coherent, and within this repair;
- otherwise record the audit result and leave it for a separately scoped task;
- do not add a new focal classifier/router/verifier.

## 8. Already closed / do not duplicate

The user session's early absent-NPC clothing state predates PR #78. Current main already contains the reviewed repair, and the post-merge live proof established the fixed path on TEST.

Do not reopen or modify the clothing CSA bootstrap path in this task unless a fresh regression directly blocks one of A-D.

## 9. Architecture boundaries

Preserve these project rules:
- one durable domain, one canonical writer;
- player input is literal intent/attempt, not automatic success;
- Story owns narrative outcome;
- Extract observes Story-established facts;
- Commit owns structural/provenance/transaction writes;
- DB owns durable state/history, not semantic invention;
- frontend is presentation/readback, not a gameplay writer;
- applied migration evidence is immutable;
- no compatibility layer just to preserve stale tests;
- delete contradictory/superseded contract wording or readers when a single current path is proved;
- exact evidence and exact registered identities beat semantic guesswork.

Forbidden architecture:
- finite physical/sexual action grammar;
- generic semantic action router/verifier;
- consent matrix or relationship inference from CSA;
- generic CSA execution DSL;
- retry/regenerate-until-lucky;
- server-authored symptom-specific narrative fallback;
- provider/model swap to mask product defects.

This task is defect/authority repair before the next roadmap Cut. Do not start Cut3 relationship/event implementation.

## 10. Source/test scope

Expected source areas are limited to the existing owners of the four confirmed seams and closest tests, for example:
- Extract prompt/current observation normalization;
- runtime observation reducers / physical-state evidence writer;
- existing player sexual reducer and its current frontend/context consumers only if defect B requires them;
- existing deterministic navigation authority helper;
- committed Story context / turn-summary projection and Extract warnings;
- closest existing contract/regression test files;
- `docs/ops/CURRENT_TASK.md`.

Do not treat this as an allowlist requiring artificial edits. Conversely, unrelated content/catalog/CSA clothing/relationship/event/DB/migration/media/TTS changes require STOP `BLOCKED_USER_LIVE_TURN33_SCOPE_DRIFT` unless proven indispensable to A-D.

## 11. Required tests and review

Add focused regressions for each confirmed defect:

A. physical position evidence
- one NPC exact actor-scoped Story quote writes its position_label;
- wrong actor quote cannot cross-authorize another NPC;
- missing/non-exact evidence preserves prior state;
- multi-NPC observations remain independently gated.

B. player sexual state
- if retained: Story-established exact evidence updates the current intended fields through the sole existing reducer;
- attempt/input without Story-established success does not update;
- malformed/missing evidence remains fail-open/preserve-prior with deterministic warnings where current contract requires;
- frontend/context projection reads only the canonical state;
- if removed as superseded: prove no remaining current writer/consumer/UI contract remains.

C. navigation
- actual T26-shaped exact multi-NPC same-destination movement resolves the unique canonical destination;
- exact multi-NPC non-movement does not navigate;
- exact NPCs resolving to different destinations remain unresolved;
- existing single NPC and explicit catalog-location navigation remain unchanged.

D. memory/summary/Mind Monitor
- a non-empty committed Story cannot silently disappear from older-turn memory merely because Extract summary is blank;
- fallback, if used, is committed authority text/blocks, chronological and deterministic, not generated semantic prose;
- non-empty valid summaries remain preferred;
- missing Mind Monitor remains fail-open but emits deterministic warning/telemetry and does not retry/invent thoughts.

Secondary focal change, if any, needs its own caller/negative regressions.

Then run:
- all focused suites touching A-D;
- full `npm test` with zero failures;
- `node --check` on every changed JS/MJS source/tool file;
- `git diff --check`;
- final grep/inventory proving no duplicate new writer/router/parser contract was added.

Test count itself is not a preservation goal. Delete stale assertions if they contradict the single current contract and replace them with current semantic invariants.

## 12. PR, CI, merge authorization

If implementation is coherent and verification passes:
1. commit source/test repair in coherent commit(s), with lifecycle docs separate if useful;
2. open one PR to `main`;
3. require exact-head `Company v1 tests` SUCCESS;
4. inspect exact final PR diff and all changed paths;
5. verify no unresolved P0/P1, no forbidden architecture, and A-D regressions pass;
6. normal merge to `main` is authorized under the existing owner delegation only if all checks above are clean;
7. fresh-fetch merged main and require its exact push CI SUCCESS.

If any of A-D cannot be safely repaired without contradicting canon or requiring new DB/schema/provider architecture, STOP with a precise blocker rather than merging a partial semantic workaround. A clean coherent subset may only be merged if the terminal explicitly itemizes the unresolved defect and the remaining defects are independently safe; do not silently declare full success.

## 13. TEST deployment and smoke — after merge only

After exact merged-main CI is green:
- deploy the exact merged-main API Worker to TEST using the existing gated path if API/runtime source changed;
- deploy frontend to TEST only if frontend source genuinely changed; otherwise retain source-equivalent frontend and prove equivalence;
- run read-only Action/Scene/effective-DB gates and corrected API/frontend smoke as applicable;
- no migration/history repair, broad DB push, or schema/DDL is authorized;
- no scripted gameplay acceptance is authorized.

Do not use or mutate preserved user/evidence games for smoke.

## 14. Final manual-acceptance handoff — MUST BE LAST

After source audit -> repair -> tests -> PR/CI -> merge -> merged-main CI -> TEST deploy/smoke are complete:

1. create exactly ONE fresh disposable Level-7 TEST manual-test game;
2. complete only the minimum setup needed to make it playable and produce the frontend URL;
3. perform ZERO gameplay Story turns in that final game;
4. do not automatically test A-D in it;
5. record exact API/frontend Worker versions, game ID and public TEST frontend URL;
6. set CURRENT_TASK to `WAITING_USER_LIVE_ACCEPTANCE`;
7. post one Issue #68 terminal and STOP.

The user will perform gameplay acceptance. Any further defect classification/repair must come from that user manual evidence, not an automated long live loop.

## 15. Hard prohibitions

- mutate/reset/reuse preserved game `9755b57b-5cbb-44dd-a624-020fe516c16d`
- mutate/reset/reuse any prior preserved evidence/manual game
- automated 15–20 turn gameplay acceptance
- any gameplay turn in the newly prepared final manual-test game
- Production/hospital-v2 access or mutation
- provider/model/TTS/binding change
- migration repair, broad `supabase db push`, DDL/schema change
- new semantic gateway/router/verifier/parser generation
- retry/regenerate-until-pass
- Cut3 implementation
- unrelated clothing bootstrap rework

## 16. Terminal

Success terminal:
`USER_LIVE_TURN33_CONTINUITY_REPAIR_WAITING_MANUAL_ACCEPTANCE`

Final success status:
`WAITING_USER_LIVE_ACCEPTANCE`

Blocked terminals as applicable:
- `BLOCKED_USER_LIVE_TURN33_EVIDENCE_DRIFT`
- `BLOCKED_USER_LIVE_TURN33_SCOPE_DRIFT`
- `BLOCKED_PLAYER_SEXUAL_CONTRACT_OWNER_DECISION`
- `BLOCKED_USER_LIVE_TURN33_REPAIR`

Terminal report must include:
- registration SHA/blob and branch;
- preserved game read-only verification and zero mutation counts;
- exact A-D root-cause findings and disposition;
- secondary focal audit result;
- exact changed paths/source commits;
- focused/full/syntax/diff verification;
- PR number/exact head/CI and merge/main SHA/main CI if merged;
- TEST API/frontend versions and smoke/gate results;
- fresh manual-test game ID + frontend URL if success;
- explicit `final_manual_game_story_turns=0`;
- migration/DDL/Production/provider-model/retry safety counts;
- STOP. Do not begin user gameplay or the next roadmap Cut.
