# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-release-candidate-product-acceptance-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309876392` — ACCEPTED `minimal-story-runtime-final-residue-test-rollout-v2`.
Accepted final docs/head: `b8dfe8b8b1e4aaccd780f222849fec14dbae1abf`.
Reviewed source/test lineage: `907eee3bcace9918e4965221eec2f44719213682` plus the accepted registered-destination handoff lineage already included in current deployed source ancestry.

Accepted live state before this task:
- TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` is live exactly once.
- TEST migration `20260817000100 / company_v1_final_residue_closure` is live exactly once.
- TEST API `game-proxy-company-v1` Version `1011e5a2-f034-40ae-bef7-6cdd76b266a6` and Frontend `gamebuilder-company-v1` Version `1a3c1416-5362-4658-a8fe-465006a342dd` were verified live at 100% in the immediately preceding accepted rollout. Do not redeploy if these reviewed identities remain live/equivalent.
- Disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` was independently verified clean after final reset: committed_turn=0, actions=0, turns=0, Level 1, setup/opening not_started, canonical scene=`setup`, empty presence, retired choice/scene/location mirrors absent.

Forbidden game IDs — do not read, mutate, reset, or use for evidence:
- Production/sentinel: `11111111-1111-4111-8111-111111111111`;
- preserved manual: `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- QA evidence: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`.

Production is forbidden.

## Accepted product evidence already available

Do not rerun old microtests merely to reproduce these facts:
- registered NPC destination navigation and A→B source-phase presence isolation are accepted live;
- weak non-clothing CSA activation-time premise, separation from unrelated consent/affection/trust/arousal, exact UTF-8 player-action fidelity, canonical time and useful literal choices were exercised in one 9-turn product run;
- physical/contact, compact clothing and intimate/sexual side systems were exercised in one 12-turn bounded run; naturally unreached positive mechanics were correctly treated as coverage limitations, not retry-until-lucky targets;
- post-Minimal-Story-Runtime final residue migration/API/Frontend contract is accepted live, including removed mirror non-resurrection and replay/reset.

## Objective

Run one final release-candidate **product acceptance** of the current post-Minimal-Story-Runtime TEST lineage in a single coherent multi-turn scenario. The goal is not to force every mechanic to fire and not to create more architecture. The goal is to verify that the current user-facing gameplay spine remains coherent after the accumulated semantic simplification and final-residue rollout.

This is acceptance only. Do not patch source inside this task.

## Required execution

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Before any gameplay request, fail closed unless the target is exactly disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
3. Read-only preflight:
   - verify the two accepted TEST migrations remain present exactly once;
   - verify the reviewed TEST API/Frontend identities are still live/source-equivalent. If runtime identity drifted from the accepted lineage, STOP as BLOCKED; do not deploy or broaden scope without separate review.
4. Canonically reset only the disposable TEST game and verify clean baseline: turn/action/history 0, Level 1, setup/opening not_started, canonical `save.scene=setup`, empty presence, retired save mirrors absent.
5. Run Setup + Opening once through the canonical request path. Opening must produce exactly four non-empty unique provider-authored literal choices.
6. Commit **10–14 ordinary turns in one coherent workplace scenario**. Do not run disconnected probes. Use:
   - Turn 1 as one actual Opening-returned literal transported unchanged;
   - at least two later provider-returned literal choices when available;
   - several exact UTF-8 free-text player actions.
7. Establish one concrete early work promise/request/detail by turn 2 or 3, then refer back to it naturally only after it has left the latest-six raw window. Verify later Story can preserve the meaning through chronological older `turn_summary` memory. Do not create a relation/event/work ledger to help it.
8. Exercise one registered navigation/presence transition naturally in the scenario. Reuse current exact registered location/NPC authority; no fuzzy name matching, named-input→presence shortcut, or new semantic router. Verify source-location NPCs do not teleport to the destination and registered identity remains stable.
9. Exercise player agency with at least two explicit free-text actions whose intended action/target matters. Inspect Story outcome rather than requiring success: the player input is intent/attempt, but Story must not silently replace the requested target/action with an unrelated one without narrative reason.
10. If a weak non-clothing CSA can be activated naturally through the canonical app transaction path without changing progression/config, exercise one activation at a concrete game time. Verify:
    - it begins from activation time, not retroactively;
    - when applicable, it is treated as the current workplace premise;
    - unrelated consent/comfort/affection/trust/romance/arousal are not mechanically inferred from compliance.
    If the scenario cannot naturally activate one, record this as coverage limitation; do not rerun or mutate state just to force it.
11. Physical/contact/clothing/intimate/sexual/media side systems are observation-only acceptance axes in this run:
    - if Story establishes an evidenced physical or compact-clothing change, durable narrow state may follow;
    - if Story establishes only attempt/refusal/boundary, prior durable state should remain;
    - sexual mechanical state/ledger may change only when Story actually establishes supported events;
    - no such side mechanic may auto-mutate consent/relationship/CSA semantics;
    - media/image miss or alternate classification must remain presentation-only and cannot block Story/Extract/Commit.
    Do not manufacture outcomes or retry until a mechanic fires.
12. Verify canonical time remains chronological/coherent across the scenario.
13. At/after the summary boundary, inspect the actual Story context projection or equivalent accepted evidence and verify exactly six latest raw committed turns are used for raw recent context while older chronological natural-language summaries remain available. Do not mistake a broader DB/context fetch window for Story’s six-raw projection.
14. Mid-run, perform a normal committed refresh/context/history readback. Verify current canonical scene/identity, choices, Mind Monitor and supported narrow display/mechanical state come from committed server authority; retired roots/mirrors remain absent.
15. Perform same-action Story/Extract/Commit replay on one committed ordinary turn. Verify replay acknowledgement/idempotence and unchanged committed_turn.
16. Throughout the run verify fresh state does not resurrect retired/general semantic-memory authority or final-residue mirrors. In particular, do not recreate generic relation/emotion/work/general-event ledgers, stale choice caches, duplicate scene/location/presence mirrors, or compatibility bags.
17. Finish with exactly one canonical reset of the disposable TEST game and verify committed_turn=0, action/history=0, Level 1, setup/opening not_started, canonical scene=`setup`, empty presence, and retired mirrors absent.
18. Evidence may be stored under OS TEMP only. Do not commit evidence artifacts.

## Acceptance interpretation

This task is `PRODUCT_PLAY_PASS` only if the one coherent scenario completes without a deterministic gameplay/runtime defect and demonstrates:
- literal + free-text player agency;
- coherent Story→Extract→Commit progression;
- registered navigation/presence identity;
- long-horizon six-raw + older-summary continuity;
- canonical time;
- committed refresh/history/replay/idempotence;
- side-system isolation and final-residue non-resurrection;
- final canonical reset.

A naturally unreached optional side mechanic is a **coverage limitation**, not failure and not permission to rerun until lucky.

Provider wording that is merely stylistically imperfect is not a deterministic product defect. However, a clear player-agency substitution, contradictory world premise, wrong identity/location/presence, broken committed memory, or turn-blocking side-system coupling is a product blocker and must be captured rather than patched in this task.

## Stop-on-defect policy

One scenario attempt only. On first deterministic product defect:
- capture the exact turn/action/stage and smallest relevant Story/Extract/committed evidence;
- perform final disposable cleanup reset if safe;
- STOP as BLOCKED for operator review.

Do not retry/regenerate the provider, alter model/settings, patch prompt/runtime/parser, add fuzzy repair, semantic gate, compatibility layer, or manual DB state to make the attempt pass.

## Architecture constraints

- Minimal gameplay spine remains: player input/literal choice → committed minimal context → Story LLM → raw Story → Extract grounded observations + natural `turn_summary` → structural Commit → committed save/history → next turn.
- Story is narrative authority; Commit is not a narrative interpreter.
- `save.scene` is sole durable scene/location/presence authority.
- ordinary choices come from committed `parsed_blocks`; no fresh save choice cache.
- latest six raw turns + older chronological `turn_summary` are narrative memory; do not introduce generic fact/relation/event/emotion/work memory.
- CSA remains institutional lifecycle/context/mechanics, not consent/relationship/physical truth.
- physical/clothing/sexual/media/Mind Monitor/TTS remain narrow proven side systems only.
- preserve the one proven historical persisted-Extract read-only boundary; do not expand compatibility.

## Authorized operations

Authorized:
- read-only Git/PR/deployed-identity inspection;
- read-only TEST migration/function verification;
- disposable TEST game reset/setup/opening/ordinary gameplay/context/history/replay/final reset;
- canonical app transaction path for one weak CSA activation if naturally practical;
- read-only TEST DB verification for the disposable game;
- OS TEMP evidence;
- docs-only completion record and immutable Issue #68 terminal report.

Not authorized:
- Production or any forbidden-game access;
- migration/DDL apply/reapply/repair;
- API/frontend deploy unless a future operator task separately authorizes it; identity drift here is BLOCKED;
- source/runtime/test/content/config edit;
- provider retry/regeneration/model/temperature/token change;
- new parser, fuzzy repair, semantic gateway/gate, compatibility runtime, memory ledger or manual DB outcome manufacture;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Completion

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with START SHA, exact deployed identities, turn count, decisive scenario evidence, summary-boundary evidence, replay result, optional coverage limitations, final reset proof, forbidden-operation confirmation and final docs SHA;
- STOP. Do not generate the next CURRENT_TASK yourself.
