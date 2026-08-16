# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-test-rollout-v2
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308534268` — `ACCEPTED_BLOCKED_EVIDENCE` for `minimal-story-runtime-test-rollout-v1`.
Reviewed source/runtime SHA: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`.
Previous rollout final docs SHA: `0770675fad5648b474c1b06f9eaec3ad551278e4`.

Binding semantic canon:
- `docs/COMPANY_V1_MINIMAL_STORY_RUNTIME_RESET_CANON_2026-08-16.md`
- root `CURRENT_TRUTH.md`
- accepted Minimal Story Runtime audit review `5308024297`.

TEST contract already live:
- migration `20260816050000 / company_v1_minimal_story_runtime_contract` is already applied to TEST. **Do not reapply it.**
- reviewed rollout deployed TEST API Worker version `37c05efd-b8b9-4be3-b0f8-c823576b0149`; preflight exact current identity/source lineage before deciding whether any redeploy is necessary.
- frontend was source-equivalent to the reviewed lineage in V1; do not redeploy unless current frontend runtime/assets actually differ.

Disposable TEST game:
- `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
- operator post-V1 read-only verification: committed_turn=0, save_revision=1071, Level 1/exp 0, setup/opening not_started, canonical scene `setup`, csa_active=[], actions=0, history=0.
- retired current-save roots are absent after reset: `npc_stats`, `npc_relationship_state`, `csa_attitudes`, `csa_runtime_state`, `csa_aftereffect_state`, `sexual_event_ledger`, `story_summary_overall`, `story_summary_recent`, `npc_emotion`, `npc_work_state`, and general `event_ledger`.

Forbidden evidence games:
- preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`: DO NOT ACCESS.
- QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`: DO NOT ACCESS.
- Production: forbidden.

## Why V1 was BLOCKED

V1 is accepted as accurate blocked evidence, not as a runtime failure.

The first coherent V1 run already proved a valid live registered-NPC movement: `윤민아 보러간다` resolved registered `heroine2` at canonical `brand_strategy_office`, moved `brand_strategy_meeting_room -> brand_strategy_office`, and did not teleport source-phase presence into the destination.

The corrected no-provider-retry run happened to receive an Opening already located at `brand_strategy_office`. Reusing the same Mina action was therefore a same-location action and could not prove A->B movement. The blocker is deterministic acceptance orchestration around a provider-authored starting location, not evidence that the reviewed navigation reducer is wrong.

Do not change runtime to force an Opening location and do not retry/regenerate Opening until it starts somewhere convenient.

Immutable repository content provides normal-player-action destinations:
- registered `heroine2` 윤민아 has `default_location_id = brand_strategy_office`;
- registered location `brand_strategy_meeting_room` is `브랜드전략팀 회의실` and is adjacent to `brand_strategy_office`.

## Objective

Run one bounded TEST-only continuation that completes the product acceptance left unfinished by V1, without modifying the reviewed Minimal Story Runtime.

Choose the navigation sequence from the actual committed Opening/current scene so a true A->B movement is exercised through ordinary player actions regardless of provider-authored Opening location. Then finish CSA premise separation, six-raw + older-summary continuity, committed readback/replay/idempotence, and final canonical reset in the same coherent run.

## Required execution

### A. Freeze and preflight

1. Freeze START HEAD and verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED.
2. Verify TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` is already present exactly once. Do not reapply or edit it.
3. Read-only verify the disposable game is still at the clean post-V1 baseline and retired semantic roots remain absent.
4. Verify current TEST API Worker identity/source lineage. If it still corresponds to the reviewed runtime `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`, do not redeploy. Deploy only the exact reviewed lineage if actual executable drift is proven.
5. Verify frontend source equivalence. Do not redeploy merely because branch/docs HEAD changed. The stale smoke-helper `/narrative.js` probe is not current source authority; validate only assets actually present in reviewed frontend source.

### B. Setup / Opening / literal input

6. Canonically reset only the disposable TEST game if preflight shows it is not already clean. Do not reset merely for ritual if it is already canonical turn 0.
7. Run Setup + Opening once. Verify exactly four provider-authored canonical literal choices and committed Opening structured blocks.
8. Turn 1 must send one actual Opening provider literal unchanged and complete Story -> Extract -> Commit once.
9. Read the committed canonical `scene.location_id` after Opening/Turn 1 before selecting the navigation sequence.

### C. Deterministic registered navigation through normal gameplay

10. The navigation acceptance must use normal player inputs and immutable registered catalog/map identity only. No direct save patch, synthetic Extract, DB manufacture, provider retry/regeneration, or forced Opening location.
11. Mina destination authority is registered `heroine2` -> `brand_strategy_office`.
12. If the current canonical location is **not** `brand_strategy_office`:
    - send `윤민아 보러간다` as the normal player action;
    - verify the typed structural navigation target is registered `heroine2`, destination is `brand_strategy_office`, and final committed location actually changes A -> office.
13. If the current canonical location **is** `brand_strategy_office`:
    - first send a normal exact registered-location action such as `브랜드전략팀 회의실로 간다` and verify canonical movement to `brand_strategy_meeting_room`;
    - then send `윤민아 보러간다` and verify registered `heroine2` resolves back to `brand_strategy_office`.
14. For the true A->B movement, verify chronology:
    - destination is the canonical final location;
    - source-phase speakers/presence/entrance evidence do not teleport into B;
    - an NPC appears/accompanies in B only when destination-phase evidence establishes it there;
    - remote speakers never become local presence;
    - no stale `npc_scene_state.location_id` or removed mirror chooses the destination.
15. Story must actually continue at the destination and must not create a duplicate/fake Mina or route another NPC's dialogue under Mina's identity.

### D. Continue one coherent scenario

16. Continue ordinary gameplay with several free-text actions. Target enough total committed ordinary turns to cross the six-raw-turn memory boundary, normally 8–10 unless a decisive defect occurs earlier.
17. Establish one meaningful early work detail, promise, request, agreement/refusal, or other natural-language continuity fact before it leaves the latest-six raw window. Do not create a generic semantic ledger for it.
18. Verify every sampled post-Commit current save and Story input remain minimal: retired semantic roots from V1 must not be resurrected as current-save or fresh Story authority.
19. Preserve accepted narrow authority only: canonical scene/time, player progression, CSA lifecycle/capability, compact physical/clothing continuity when naturally observed, direct-evidence `player_sexual_state` if naturally reached, literal choices, Mind Monitor, media/TTS sidecars, committed parsed blocks, turn summaries, transaction/replay identity.

### E. CSA premise separation

20. If Level 7 is required for the chosen CSA, use only the already-installed approved TEST-only Level-7 seam, at most once in this run and only after preflight/reset correctness is proven. It may grant capability only and must not seed narrative outcomes.
21. Activate one valid CSA through the normal product path if practical in the coherent scenario and verify the owner semantics:
    - activation-time company notice/rule is sufficient; no retroactive memory is required;
    - once valid and applicable, the rule is in force as the altered workplace premise;
    - personal dislike, embarrassment, reluctance, or reaction may vary but must not make the active applicable company rule optional/not-in-force;
    - CSA compliance does not automatically imply unrelated consent, comfort, affection, trust, romance, or arousal;
    - no finite physical execution grammar is required or restored.
22. Do not force a sexual outcome for coverage. If direct-evidence player sexual mechanics occur naturally, verify they remain narrow; otherwise report not reached without retrying.

### F. Six raw + older turn_summary memory

23. Continue until the early meaningful fact from step 17 leaves the latest-six raw window.
24. Inspect the actual next Story committed context and prove:
    - exactly the latest six committed raw turns are present as raw recent turns;
    - older committed `turn_summary` entries are chronological and natural language;
    - the older work/promise/request detail remains usable for continuity without `npc_relationship_state`, generic event/emotion/work ledgers, `open_facts`, or another memory bag.
25. If the provider simply chooses not to mention the older detail, do not retry until it does. Verify that the correct summary memory was available to Story; only deterministic omission/corruption in the server projection is a product defect.

### G. Readback / replay / recovery

26. Verify committed refresh/context/frontend readback uses committed authority: choices from Opening/committed parsed blocks, canonical scene/display, no stale client/save semantic mirror regains authority.
27. Perform same-action replay/recovery on one committed ordinary turn and verify Story/Extract/Commit replay identity/flags and no duplicate committed turn/save transition. Never regenerate provider output for replay.
28. Verify history uses committed parsed blocks and turn summaries. The single persisted legacy Extract boundary remains historical read-only and fresh provider output must not enter it.

### H. Stop and cleanup

29. One coherent scenario attempt only. Do not retry/regenerate provider Story/Opening/Extract for prettier evidence.
30. On the first deterministic product defect, capture the smallest decisive turn/action/stage/raw/structured/readback evidence, canonically reset if safe, mark BLOCKED/FAILED, and STOP. Do not patch source inside this rollout.
31. On PASS, perform one final canonical reset and independently verify:
    - committed_turn=0;
    - actions=0 and history/turns=0;
    - processing idle;
    - setup/opening not_started;
    - Level 1 / exp 0;
    - canonical scene `setup` v1;
    - retired semantic roots remain absent;
    - no Level-7 acceleration state remains.
32. Record exact API/frontend identity or equivalence, navigation branch chosen from actual start location, A->B evidence, CSA result, six-raw/older-summary evidence, replay result, final reset and forbidden-operation confirmation.

## Architecture constraints

- Story LLM authors narrative; server is not a second narrative author.
- Extract remains one narrow Story-grounded observer + natural-language `turn_summary`, not a generic semantic-memory engine.
- Commit remains structural transaction authority, not narrative interpreter.
- No `open_facts`, `open_observations`, generic relation/event/emotion/work ledger, entity graph/vector DB, importance scoring, semantic gateway, finite physical execution authority, fuzzy inference, third summary/memory LLM, retry/regeneration workaround, or replacement compatibility bag.
- Registered character/location/catalog IDs and exact deterministic navigation resolution are permitted narrow product identity, not a generic intent ontology.
- CSA is institutional lifecycle/context/capability; compliance stays separate from unrelated consent/comfort/affection/trust/romance/arousal.
- Media/image/TTS are presentation sidecars and cannot define narrative truth.
- Historical committed parsed blocks, turn snapshots and the single legacy persisted-Extract read boundary remain historical/replay evidence.
- Historical migrations are immutable.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployment inspection;
- read-only TEST DB verification;
- exact reviewed TEST API deployment only if executable drift is proven;
- TEST frontend deployment only if actual reviewed frontend source drift is proven;
- disposable TEST game reset/setup/opening/gameplay/CSA/history/replay;
- approved existing TEST-only Level-7 seam at most once if needed;
- bounded temporary evidence artifact;
- docs-only terminal record and immutable Issue #68 terminal report.

Not authorized:
- migration reapply or any new DDL/migration;
- source/runtime/test/config/content edits;
- Production access/deploy;
- any access to preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- any access to QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic hard gate, compatibility runtime/bag;
- new branch/PR, rebase, squash, force-push, merge or Ready transition.

## Rollout result

Result: BLOCKED — WAITING_REVIEW

Execution identity:
- Current task blob: `cdde4b9a3f627993470c0755f86dacdb811ef3a8`
- Start head: `be674874b24df3af16f352873e4e8347d76bcd18`
- Reviewed source: `a341c04c3c5417efc5e5dcad8a3a9105ea1add5d`
- Branch: `company/scene-location-presence-v1`

Preflight:
- TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` present exactly once; not reapplied.
- API Worker remained Version `37c05efd-b8b9-4be3-b0f8-c823576b0149`; health/version readback passed; no redeploy.
- Disposable TEST baseline was clean and retired current-save roots were absent.

Scenario evidence:
- Disposable TEST game only: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
- Setup/Opening passed; four canonical choices were observed; Turn 1 used an Opening literal and completed Story -> Extract -> Commit.
- Opening started at `brand_strategy_office`, so the authorized branch was office -> meeting room -> office. The first normal location action was stored in the bounded artifact as `?????? ???? ??` and did not move the canonical scene; the Mina action was therefore not attempted. This is an operator harness input-encoding failure, not a product navigation finding.
- No provider retry/regeneration, source patch, semantic workaround, or second scenario attempt was used. CSA premise, memory boundary, destination chronology, and replay remain unverified.
- Artifact: `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-minimal-story-runtime-rollout-v2.json`.

Final reset readback: PASS — committed_turn 0, save_revision 1076, processing idle, setup/opening not_started, scene setup v1, Level 1/exp 0, zero recent turns, and retired roots absent.

Forbidden operations: migration reapply 0; API/frontend redeploy 0; Production/preserved/QA evidence access 0; source/migration edits 0; PR merge/Ready 0.

## Acceptance

PASS only if this single run proves all of the following without source changes or provider retries:
- exact provider literal + free-text gameplay works;
- a true registered-NPC A->B navigation is exercised by choosing the movement sequence from the actual committed start location;
- source-phase presence does not teleport and Story/identity remain correct at the destination;
- Minimal Story Runtime retired roots remain absent and are not resurrected;
- one valid CSA premise path, if capability is used, preserves institutional-rule semantics without consent/relationship conflation;
- latest-six raw + chronological older `turn_summary` memory projection is correct after the boundary;
- committed readback/history and replay/idempotence are correct;
- final TEST reset is canonical and clean.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with exact identities and decisive evidence;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.
