# Company v1 — CURRENT TASK

Status: READY
Task ID: minimal-story-runtime-destination-target-handoff-test-rollout-v3
Updated: 2026-08-17
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Previous operator review: `5309112951` — ACCEPTED_BLOCKED_EVIDENCE for `minimal-story-runtime-destination-target-handoff-test-rollout-v2`.
Accepted destination-target runtime SHA: `beae855ebc5a9706bae234af80b2569d73566f0a`.
Accepted CLI deletion/safety SHA: `7a188ff5fd5114d193e813d5da0e431becea5bf8`.
Previous blocked docs SHA: `80173c1a1881a4cd1487cc1b0cb858ac94209380`.

TEST Minimal Story Runtime migration `20260816050000_company_v1_minimal_story_runtime_contract` is already applied. DO NOT REAPPLY, EDIT, OR REAUTHOR IT.

Dedicated disposable TEST game: `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
Forbidden Production/sentinel game: `11111111-1111-4111-8111-111111111111`.
Forbidden preserved manual game: `78fb1d94-266f-455a-bda4-7656cc2370c1`.
Forbidden QA evidence game: `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`.

Independent operator verification after V2:
- PR #67 remained OPEN / DRAFT / UNMERGED / mergeable at docs-only head `80173c1...`.
- Disposable TEST game was clean: committed_turn=0, save_revision=1091, idle, setup/opening not_started, canonical scene=setup, Level 1/exp 0, csa_active=[], game_turns=0, game_actions=0; retired semantic roots remained absent.
- Current reviewed `/api/opening` requires `game_id` + `setup_id`.
- Repository `scripts/live-playtest-canary.mjs` already uses the canonical flow `setup.body.data.setup_id` -> `/api/opening` and captures raw response/SSE evidence.
- V2 temporary out-of-repo runner received HTTP 400 but did not preserve the non-SSE body. That is insufficient evidence for an Opening or destination-runtime source defect. Do not patch product code from that result.

## Objective

Re-arm exactly one bounded TEST-only acceptance of the accepted registered destination-target handoff, but remove the V2 request/evidence ambiguity by using the repository's already-reviewed canonical canary Setup/Opening path directly.

PASS target remains narrow:
non-destination canonical scene -> exact byte-preserved `윤민아 보러간다` -> committed `brand_strategy_office` with registered `heroine2`, no source-NPC teleport, no fake/duplicate Mina, exact history echo, replay/idempotence, and final clean reset.

This is not a new source cut, broad semantic acceptance, or harness-development task.

## Mandatory pre-network safety gate

Before any network/API/DB/reset/gameplay operation:

1. Freeze START HEAD and verify PR #67 remains OPEN / DRAFT / UNMERGED, base `main`.
2. Fail closed unless the game ID is exactly `2d00d76e-85b1-4cf0-8dab-a04e8a044b84`.
3. Production/sentinel `11111111-1111-4111-8111-111111111111`, preserved manual `78fb1d94-266f-455a-bda4-7656cc2370c1`, QA evidence `f31b6c1b-0b27-4a4e-8c9d-7a238360891f`, and every other game ID are forbidden before network access.
4. Do not recreate, invoke, copy, or imitate deleted `scripts/live-phase-2-e2e.mjs`.
5. Verify the current TEST API Worker identity. If runtime lineage still equals accepted `beae855...` / the accepted TEST deployment lineage, do not redeploy. If it has drifted, deploy only the exact reviewed runtime lineage. Do not deploy frontend.
6. Do not apply/reapply/edit any migration.
7. Confirm `scripts/live-playtest-canary.mjs` is the current repository canonical Company live request path. Do not hand-roll Setup or Opening in a temporary runner.

## Canonical Opening boundary — reuse existing canary

1. Start the one product attempt by running the existing repository canary in its side-effect-safe explicit `--opening-only` mode against the exact disposable TEST game, with `--reset-if-dirty` only if the preflight proves that game dirty.
2. Use an artifact path outside the repository.
3. The canary's existing flow must own:
   - context/reset safety;
   - `/api/player-setup`;
   - reading `setup.body.data.setup_id`;
   - `/api/opening` request;
   - raw HTTP/SSE capture and Opening parsing.
4. Do not duplicate those calls in another runner.
5. If Opening returns non-2xx, non-SSE, parser failure, or another terminal failure, STOP the product attempt. Preserve from the existing canary artifact, or additionally capture read-only if already available without a retry:
   - exact HTTP status;
   - exact raw response body/raw_sse;
   - request endpoint and request shape excluding secrets;
   - setup_id;
   - immediate read-only context/opening_state.
   Do not retry/regenerate Opening.
6. A successful `--opening-only` run leaves the same disposable game at committed Opening state. Continue that same game; do not reset and do not run a second Opening.

## Destination continuation — same one attempt

After canonical Opening succeeds:

1. Read committed context and establish the current canonical location.
2. Destination for exact registered Mina/`heroine2` is `brand_strategy_office`.
3. If Opening is already at `brand_strategy_office`, use one ordinary byte-safe exact registered-location action to move through Story -> Extract -> Commit to a different canonical source such as `brand_strategy_meeting_room`, then verify that source readback. If Opening is already elsewhere, use it as the source; do not add movement merely for turn count.
4. Use only normal current endpoints and canonical envelopes for continuation: `/api/context`, `/api/story`, `/api/extract`, `/api/commit`, `/api/history`, `/api/reset`. A small temp process may orchestrate these exact calls after Opening, but it must not implement a new endpoint contract, parser, retry system, compatibility alias, or repository harness.
5. Before sending Korean scripted actions, locally verify exact JS string -> UTF-8 Buffer encode/decode -> JSON stringify/parse round-trip and absence of `?` replacement/U+FFFD. Do not use a hand-written code-point oracle.
6. Record source canonical scene: location, present_npc_ids, focal_character_id, last_speaker_id.
7. Submit exact player action `윤민아 보러간다` unchanged and run Story -> Extract -> Commit exactly once.
8. Verify canonical `/api/history` via `body.data.records` or the existing canonical history unwrapping and prove the committed `player_action` exactly equals outbound action.
9. Verify committed destination:
   - `scene.location_id === 'brand_strategy_office'`;
   - `heroine2` is present as the uniquely registered destination target;
   - no generated/fake/duplicate Mina identity exists;
   - source-location NPCs are absent unless exact destination-phase Story evidence establishes accompaniment/presence;
   - no relationship/consent/comfort/trust/affection/romance/CSA/sexual semantic state is invented by target routing.
10. Verify the reviewed Minimal Story Runtime retired roots remain absent; do not broaden into another semantic audit.
11. Perform same-action Story/Extract/Commit replay for the Mina action and verify replay flags/idempotence, unchanged committed turn cardinality, unchanged destination identity, and no duplicate presence.
12. Finish with one canonical reset of the disposable TEST game and verify turn 0, history/action 0, setup/opening not_started, canonical scene setup, Level 1 baseline, csa_active=[], and retired roots absent.

## Stop-on-defect policy

One product attempt only. No provider retry/regeneration and no second Opening/scenario attempt.

If a deterministic product failure occurs after a canonical request reached the server, preserve the smallest decisive raw evidence and stop after safe cleanup.

If an operator/orchestration/evidence bug occurs, do not reinterpret it as product failure and do not patch runtime. Record exact evidence, cleanup if needed, and STOP for operator review.

## Architecture constraints

- Keep accepted destination runtime `beae855...` unchanged unless a future separately reviewed source task is explicitly authorized.
- Story remains narrative authority; exact registered destination target handoff is narrow identity/location routing, not general semantic success inference.
- `save.scene` remains sole active durable scene/location/presence/focal/last-speaker authority.
- Preserve A->B phase filtering: source speakers/presence cannot teleport to destination.
- No new semantic router, target/memory bag, fuzzy name matcher, gateway, parser, compatibility wrapper, retry layer, third model call, or server-authored narrative outcome.
- Historical applied migrations remain immutable.

## Authorized operations

Authorized:
- read-only Git/PR/source/deployed-identity inspection;
- exact reviewed TEST API deploy only if lineage drift is proven;
- existing canonical `live-playtest-canary.mjs --opening-only` against the disposable TEST game;
- ordinary canonical context/story/extract/commit/history/replay/reset continuation on that same disposable TEST game only;
- read-only TEST DB/context evidence for that game;
- external temp evidence artifacts, not committed;
- docs-only completion commit and immutable Issue #68 terminal report.

Not authorized:
- any Production/sentinel access, including read-only;
- preserved manual or QA evidence game access;
- migration/DDL authoring/edit/apply/reapply;
- frontend deploy;
- source/runtime/test/content behavior edits;
- provider/model/temperature/token changes;
- retry/regeneration, parser relaxation/new parser, fuzzy repair, semantic gate, compatibility alias/layer, new repository harness;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Acceptance

PASS only if the same one attempt proves canonical Opening through the existing canary and then exact registered Mina destination handoff end to end, with canonical destination/presence identity, no teleport/fake identity/unrelated semantic inference, exact committed action echo, replay/idempotence, and final clean reset.

On PASS or first blocker:
- set this file to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68 with START SHA, deployed identity decision, canonical Opening result/evidence, source/destination action evidence, replay result, final reset state, forbidden-operation confirmation, and FINAL docs SHA;
- STOP for operator review. Do not generate the next CURRENT_TASK yourself.
