# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-destination-target-handoff-test-rollout-v1
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5308903596` — ACCEPTED `minimal-story-runtime-destination-target-handoff-v1`.
Reviewed source/runtime SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.
Source terminal comment: `5308879240`.

The accepted source cut fixes one proven product defect only:
- exact player action `윤민아 보러간다` can resolve through the existing navigation resolver to destination `brand_strategy_office`, target `heroine2`, source `explicit_npc_destination`;
- the exact registered target is then carried through existing destination Story cast/presence and Commit `entered_npc_ids` instead of being dropped;
- source-location NPCs are still filtered on authoritative A->B movement;
- explicit location-only navigation remains target-free;
- ambiguous/unregistered/wrong-catalog identities remain unresolved/fail closed.

TEST migration `20260816050000 / company_v1_minimal_story_runtime_contract` is already applied exactly once. DO NOT EDIT, REAPPLY OR REPLACE IT.

Disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`, QA evidence game `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`, and Production are forbidden.

## Objective

Perform one bounded TEST-only live acceptance of the accepted destination-target handoff using the normal Company gameplay path.

The decisive product assertion is:

`brand_strategy_meeting_room` (or another confirmed non-destination location)
→ exact player action `윤민아 보러간다`
→ deterministic navigation destination `brand_strategy_office`
→ destination Story/canonical scene carries the one registered identity `heroine2`
→ no source-location NPC teleports into the destination
→ no generated/fake/duplicate Mina identity appears.

This is a rollout/acceptance task. Do not patch source on failure.

## Required execution

1. Freeze START HEAD. Verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`, and HEAD is only the reviewed source lineage plus this docs-only registration.
2. Verify the accepted source/runtime SHA `beae855ebc5a9706bae234af80b2569d73566f0a` is an ancestor of the branch and re-check the exact changed runtime files before deployment.
3. Verify current TEST API Worker identity.
   - If the deployed API does not contain the reviewed `beae855...` runtime lineage, deploy exactly the reviewed branch lineage through the existing Stage-B contract-gated API path.
   - Do not make source edits during deployment.
   - Frontend source did not change in the accepted cut; do NOT redeploy frontend merely for this task.
4. Canonically reset only disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` and verify baseline:
   - `committed_turn=0`;
   - actions/history empty;
   - setup/opening not started;
   - canonical Scene v1 bootstrap valid;
   - no legacy semantic roots are recreated.
5. Run normal Setup + Opening. Do not use direct DB patches or synthetic scene state.
6. Establish a confirmed non-destination source location through normal API gameplay if Opening did not already place the player there.
   - Preferred source for exact regression parity: `brand_strategy_meeting_room`.
   - If movement is needed, use an ordinary explicit location action through Story -> Extract -> Commit, not a save mutation.
   - Before the decisive action, read committed context and prove current `scene.location_id` is not `brand_strategy_office` and preferably exactly `brand_strategy_meeting_room`.
7. Record the source scene before the decisive turn: location, `present_npc_ids`, focal, last speaker, committed turn, and exact registered identity directory for Mina/`heroine2`.
8. Send the exact free-text player action, unchanged:
   - `윤민아 보러간다`
9. Run exactly one normal Story -> Extract -> Commit for that decisive action. Capture bounded evidence sufficient to distinguish:
   - the submitted `player_action` literal;
   - resolver/navigation metadata if exposed by existing diagnostics/logs;
   - raw Story and parsed Story speaker IDs;
   - Extract scene observation;
   - Commit/canonical scene readback;
   - committed history/action identity.
   Do not add a new harness or diagnostics layer merely to obtain prettier evidence.
10. PASS requirements for the decisive turn:
   - canonical destination `scene.location_id === 'brand_strategy_office'`;
   - canonical destination `present_npc_ids` contains `heroine2`;
   - Mina resolves to the existing registered `heroine2`, not a generated/new ID;
   - no duplicate Mina-like registered/generated identity is created in save/context/history/display;
   - source-location NPCs from the pre-move scene are absent unless the destination-phase Story contains independent valid destination evidence for them;
   - source-phase dialogue alone cannot teleport a source NPC into the destination;
   - target presence is not written into relationship/consent/affection/trust/CSA/sexual semantic authority merely because navigation targeted Mina.
11. If the destination Story naturally introduces another registered NPC with valid destination-phase evidence, verify that accompaniment can coexist with `heroine2`; do not manufacture such an NPC solely for coverage.
12. Verify committed readback after refresh/context/history uses the same destination and registered target identity. No client-side fallback may invent a different cast.
13. Perform same-action Story/Extract/Commit replay for the decisive committed action and verify idempotence:
   - replay flags true where expected;
   - committed turn and canonical destination scene do not change;
   - no duplicate target/presence is appended.
14. Do not run extra provider attempts to obtain a nicer narrative. One scenario attempt only. If a deterministic product defect occurs at Setup/Opening/source-move/decisive navigation/Extract/Commit/readback/replay, capture the first decisive evidence, cleanup if safe, and STOP BLOCKED.
15. Finish with one canonical reset of the disposable TEST game and verify:
   - `committed_turn=0`;
   - actions/history 0;
   - setup/opening not started;
   - canonical scene bootstrap;
   - no residual destination-target state.
16. Set this file to `WAITING_REVIEW` in a docs-only completion commit and post one immutable terminal report to Issue #68. STOP. Do not generate the next task.

## Architecture constraints

- Story LLM remains narrative author.
- Extract remains one Story-grounded observer plus natural-language `turn_summary`.
- Commit remains structural transaction authority.
- Registered character/location identity and exact deterministic navigation are allowed narrow product mechanics.
- This narrow `explicit_npc_destination` handoff is not relationship, consent, comfort, affection, trust, CSA, sexual, or generic narrative-memory authority.
- Do not restore the old semantic router.
- Do not generalize `named NPC in player input => present`.
- No generic target-memory bag, entity graph, semantic gateway, fuzzy name matching, fallback NPC generation, new parser generation, compatibility runtime, retry/regeneration or provider/model change.
- Historical migrations are immutable; already-applied Minimal Story Runtime migration is unchanged.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- TEST API deployment of the exact reviewed runtime lineage only if required;
- disposable TEST game canonical reset/setup/opening/ordinary gameplay/context/history/replay;
- read-only TEST DB verification for the disposable TEST game if needed;
- docs completion commit and immutable Issue #68 terminal report.

Not authorized:
- source/runtime/test behavior edits;
- migration/DDL authoring/application/reapplication/edit;
- frontend deployment unless a proven deployment identity defect directly blocks using unchanged accepted frontend assets, in which case STOP for operator review rather than improvising;
- Production access/deploy;
- any access/mutation/reset of preserved manual game `78fb...` or QA evidence game `f31b...`;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate or compatibility layer;
- new branch/PR, rebase, squash, force-push, merge or Ready.

## Acceptance

PASS only if one normal TEST scenario proves the previously dropped exact registered destination target survives from navigation resolution through Story destination cast and canonical Commit/readback, with no source-NPC teleport and no fake/duplicate Mina identity, followed by replay idempotence and final canonical reset.

On PASS or first deterministic blocker:
- set Status to `WAITING_REVIEW`;
- post one immutable terminal report with START SHA, reviewed/deployed source identity, Worker version, decisive action ID/turn, source scene, destination Story/Extract/Commit/readback evidence, replay result, final reset state and forbidden-operation confirmation;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.

## Execution result — WAITING_REVIEW / BLOCKED

- Start HEAD: `dd2104781f03d38f9f96c420c5b0a342317e21cf`.
- Reviewed source/runtime SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.
- PR #67 remained OPEN / DRAFT / UNMERGED, base `main`.
- Read-only live contract catalog plus the previously operator-verified Scene Stage A behavioral probes passed the existing Action Stage B + Scene Stage A deploy gate.
- Exact reviewed API lineage was deployed as Worker `game-proxy-company-v1`, Version `51c5ac28-8d52-49bc-bb14-fdd1f0164126`; frontend was not deployed.
- No TEST setup/opening/gameplay/reset/write was run. No migration/DDL was authored/applied/reapplied. Preserved manual/QA games were not accessed.
- BLOCKER: invoking `node scripts/live-phase-2-e2e.mjs --help` did not display help; the script has no help guard and executed its default Production sentinel `/api/context` read, which returned `development_game_not_at_clean_turn_0`. No Production write occurred, but this was an unintended read-only Production access and therefore the rollout cannot claim a clean forbidden-operation result.
- The decisive TEST navigation scenario was not started after this boundary violation. No retry or alternate runner was attempted.
- Stop for operator review/rearm. No next task was generated.
