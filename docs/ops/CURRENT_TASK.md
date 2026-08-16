# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: minimal-story-runtime-destination-target-handoff-test-rollout-v2
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309014907` — ACCEPTED `live-e2e-cli-prod-guard-closure-v1`.
Accepted CLI safety final SHA: `7a188ff5fd5114d193e813d5da0e431becea5bf8`.
Accepted destination-target runtime SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.
The branch commits after `beae855...` are operator/docs/safety lineage; the latest safety cut deleted only the zero-caller obsolete `scripts/live-phase-2-e2e.mjs` and did not change gameplay/navigation runtime semantics.

Previously deployed TEST API Worker during the first destination rollout: `game-proxy-company-v1`, Version `51c5ac28-8d52-49bc-bb14-fdd1f0164126`. Re-verify current deployed identity/source before deciding whether a deploy is needed; do not assume this mutable identity is still current.

TEST Minimal Story Runtime migration `20260816050000_company_v1_minimal_story_runtime_contract` is already applied. **DO NOT REAPPLY, EDIT, OR REAUTHOR IT.**

Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Forbidden Production/sentinel game: `11111111-1111-4111-8111-111111111111`.
Forbidden preserved manual game: `78fb1d94-266f-455a-bda4-7656cc2370c1`.
Forbidden QA evidence game: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`.

The previous destination-target TEST rollout never exercised the product invariant because the now-deleted obsolete live runner performed an unintended forbidden read before touching the disposable TEST game. That operator-path defect is closed. Do not recreate or imitate that deleted runner.

## Objective

Run exactly one bounded TEST-only live acceptance of the already accepted registered destination-target handoff. Prove that an exact registered-NPC navigation action such as `윤민아 보러간다` carries the already-resolved canonical target `heroine2` through Story/scene/Commit to destination readback without source-location NPC teleportation, fake/duplicate Mina identity, or unrelated semantic inference.

This is a narrow product acceptance, not another broad Minimal Story Runtime or Level-7 scenario.

## Mandatory pre-network safety gate

Before any API/DB/network/reset/gameplay operation:

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Confirm the execution target is the Company TEST environment and the exact disposable TEST game ID `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
3. Fail closed before network access if any requested/derived game ID equals or differs into:
   - Production/sentinel `11111111-1111-4111-8111-111111111111`;
   - preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`;
   - QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`;
   - any other game ID.
4. Do not invoke, restore, copy, or recreate deleted `scripts/live-phase-2-e2e.mjs`.
5. Use the existing canonical `scripts/live-playtest-canary.mjs` safety/request flow and/or its already-reviewed repository helpers. If a small one-shot operator command is needed to drive the exact action, compose it from existing canonical request helpers in the current process/temp context only; do not add a new repository harness, compatibility alias, or alternate endpoint contract.
6. `--help`/inspection of any operator script must remain side-effect-free. Do not probe a script by invoking an ambiguous/default live mode.
7. Verify the current TEST API Worker source identity. Deploy only if its runtime source is not equivalent to accepted destination runtime `beae855ebc5a9706bae234af80b2569d73566f0a`. If deploy is required, deploy the exact reviewed runtime lineage only. Do not deploy frontend: the destination-target source cut did not change frontend source.
8. Do not apply or reapply any migration.

If this safety preflight cannot be proved without external access to a forbidden target, STOP as BLOCKED before gameplay.

## One scenario attempt

After the pre-network gate passes, execute one coherent scenario on the disposable TEST game only. No second scenario attempt and no provider retry/regeneration.

1. Canonically reset only the disposable TEST game and verify turn/action/history are empty, setup/opening are not started, scene is canonical setup, and progression is baseline Level 1. Do not use the Level-7 seam for this task.
2. Run normal player Setup and canonical `/api/opening` through the established Company request flow.
3. Read committed current scene after Opening. Establish a confirmed **non-destination source location** through ordinary player action and Story -> Extract -> Commit if needed:
   - destination for registered Mina/`heroine2` is `brand_strategy_office`;
   - if Opening is already at `brand_strategy_office`, first move normally to an exact registered different location such as `brand_strategy_meeting_room` and commit/read it back;
   - if Opening already begins at another exact registered location, do not manufacture another move merely for turn count.
4. Record the source scene immediately before the target action: location, present NPC IDs, focal ID and last speaker.
5. Submit the exact byte-safe player action `윤민아 보러간다` as an ordinary player action. Preserve the literal; do not normalize it into a server-authored semantic command.
6. Run Story -> Extract -> Commit exactly once for that action.
7. Verify the committed turn/history echoes the exact player action using the canonical history envelope (`body.data.records` / existing canonical history unwrapping), not a hand-built alternate response shape.
8. Verify destination authority after Commit:
   - canonical `scene.location_id` is `brand_strategy_office`;
   - registered destination target `heroine2` is the Mina identity used by Story/scene readback where destination presence is established;
   - there is no generated duplicate/fake Mina identity and no second unregistered NPC created to satisfy the name;
   - source-location NPCs do not teleport into the destination merely because they spoke/were present in the source phase;
   - any companion/source NPC present in destination must have destination-phase Story evidence establishing accompaniment/presence;
   - target handoff must not create or infer relationship, consent, comfort, trust, affection, romance, CSA compliance, or sexual state.
9. Verify Minimal Story Runtime retired semantic roots are not resurrected by this turn. Limit this check to the already-reviewed removed-root contract; do not turn this task into another semantic audit.
10. Perform same-action replay/recovery for the destination action and verify Story/Extract/Commit replay/idempotence: no duplicate committed turn, no duplicate destination identity, and committed scene/action identity remains invariant.
11. Verify committed context/history/readback still uses canonical scene and committed parsed blocks/turn history; do not add client/server fallback logic.
12. Finish with one canonical reset of the disposable TEST game. Independently verify turn 0, action/history 0, setup/opening not started, canonical scene setup, Level 1 baseline, and no leftover destination fixture state.

## Stop-on-defect policy

- One product scenario attempt only.
- Do not retry/regenerate a provider Story/Extract to obtain a desired destination result.
- Do not patch source, prompt, parser, model/provider settings, retry logic, fuzzy matching, semantic gates, compatibility layers, DB schema, or migration inside this live acceptance.
- On the first deterministic product defect, capture the smallest decisive evidence (action ID, turn, raw/parsed Story identity, navigation intent/target if available, pre/post canonical scene, history echo), perform final TEST cleanup reset if safe, then STOP as BLOCKED.
- An operator evidence-formatting problem is not permission to rerun gameplay. Use existing canonical response contracts/helpers.

## Architecture constraints

- Story remains narrative authority; destination target handoff is narrow registered identity/location routing, not a generic semantic router.
- Exact registered NPC/location authority may establish the intended destination target for `explicit_npc_destination`; arbitrary name mentions must not become presence.
- A->B movement remains phase-aware. Source-phase speaker/presence evidence cannot populate destination B without destination evidence or the exact registered destination target rule.
- `save.scene` remains sole active durable scene/location/presence/focal/last-speaker authority.
- No new relationship/general memory system, target bag, semantic gateway, entity graph, compatibility wrapper, fuzzy resolver, retry layer, or third parser.
- CSA, sexual state, image/media/TTS and other side systems are out of scope except proving the navigation action does not mutate unrelated semantics.
- Historical applied migrations remain immutable.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- exact reviewed TEST API deployment only if source identity differs;
- canonical reset/setup/opening/ordinary Story/Extract/Commit/history/replay on disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` only;
- read-only TEST DB/context verification for this game's evidence;
- external temp evidence artifact if useful, not committed;
- docs completion commit and immutable Issue #68 terminal report.

Not authorized:
- any Production/sentinel game access, including read-only;
- any access to preserved manual or QA evidence games;
- migration/DDL authoring, edit, apply or reapply;
- frontend deployment;
- source/runtime/test/content edits;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility layer or new harness;
- new branch/PR, merge, Ready, rebase, squash or force-push.

## Acceptance

PASS only if one normal TEST scenario proves exact registered Mina destination handoff end to end: non-destination source -> exact `윤민아 보러간다` -> committed `brand_strategy_office` with correct registered `heroine2`, no source-NPC teleport/fake Mina/unrelated semantic inference, exact history echo, replay/idempotence, and final clean reset.

On PASS or first deterministic blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with START SHA, exact deployed TEST API identity/source decision, scenario turn/action IDs, decisive destination/presence/identity evidence, replay result, final reset state, forbidden-operation confirmation and FINAL docs SHA;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.

## Execution result — WAITING_REVIEW / BLOCKED

- Start HEAD: `5e2bc198c70d42c630b08a2b83864e7b5a4f6e1e`.
- Accepted destination runtime: `beae855ebc5a9706bae234af80b2569d73566f0a`. Current TEST API 100% deployment was read-only verified as Worker `game-proxy-company-v1`, Version `51c5ac28-8d52-49bc-bb14-fdd1f0164126`, matching the previously accepted deployment; no deploy was needed.
- Pre-network target guard was fixed to the disposable TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`; Production/sentinel, preserved manual, and QA evidence IDs were rejected before requests. The deleted `scripts/live-phase-2-e2e.mjs` was not recreated.
- One canonical TEST attempt started. Baseline reset/readback passed: committed_turn=0, setup/opening not_started, canonical setup scene, Level 1, zero history records. Normal Setup succeeded with setup_id `37d1450a-7189-4d76-a936-04cb119399fb`.
- BLOCKER: canonical `/api/opening` returned HTTP 400 and no SSE event frames; the temporary runner classified this as `SSE_NON_SSE_BODY`. The destination action was never sent, so no product destination/presence/replay conclusion is claimed. The temporary artifact did not preserve the non-SSE response body; this is an operator evidence-format limitation, not permission to rerun.
- Final canonical reset/readback passed: committed_turn=0, setup/opening not_started, canonical setup scene, Level 1, zero history records. No retry, second scenario, or provider regeneration was attempted.
- No source/runtime/test/content change, migration/DDL, deploy, Production/preserved/QA access, or frontend operation occurred. TEST operations were limited to the one disposable-game attempt and final cleanup reset.
- Stop for operator review/rearm. No next task generated.
