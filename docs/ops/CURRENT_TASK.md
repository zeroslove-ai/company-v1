# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: story-marker-literal-choice-live-closure-v1
Updated: 2026-08-16
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Starting point

Repository: `zeroslove-ai/company-v1`.
Branch: `company/scene-location-presence-v1`.
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.

Operator review `5304452735` found the preceding TEST rollout materially successful for the Story-marker defect but incomplete for one explicit live acceptance invariant.

Reviewed gameplay/source executable remains:
`b3c06f931d8bd216f217412343621781670f0722`.

Current branch head before this registration is docs-only completion:
`7f37384cac5f0140f1163ce3e5afd87a95bf69ea`.

Already verified live TEST facts:
- migration `20260816000100_company_v1_opening_structured_persistence` is applied;
- canonical Opening writer is exactly `commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)`;
- it is SECURITY DEFINER with `search_path=public, pg_temp`, service_role execution, and stores `opening_state.parsed_blocks`;
- Story marker grammar fix is deployed and a bounded Setup -> Opening -> two ordinary free-text Story/Extract/Commit turns plus replay succeeded;
- prior dedicated game was reset clean.

The missing proof is narrow and live-only: the previous rollout did not select one of the provider-authored Opening choices as the next literal player input on the current reviewed deployment. Both ordinary turns were free text and the terminal substituted older V9 ancestor evidence.

Historical manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` is READ-ONLY and must never be accessed or mutated. Production access is forbidden.

## Objective

Close the exact literal-choice live acceptance gap without changing runtime architecture.

Use the already reviewed/deployed executable lineage. Run one bounded dedicated TEST flow where:
1. Setup and Opening succeed through normal API paths.
2. Capture the four provider-authored canonical Opening choice strings.
3. Select exactly one returned literal string unchanged and submit that exact string as the next `player_action`.
4. Prove Story -> Extract -> Commit succeeds and persisted/action/history evidence retains the exact selected literal identity; no semantic choice metadata or server-authored fallback is involved.
5. Use ordinary free text for the following turn and prove it remains ordinary gameplay input.
6. Prove current-format replay/recovery prefers committed `parsed_blocks` and is idempotent.
7. Reset only the dedicated TEST game and independently confirm clean readback.

This is acceptance closure, not source work.

## Required proof

- exact PR #67 branch/head/topology and reviewed executable ancestry;
- current TEST Worker is healthy and still corresponds to the reviewed executable lineage; do not redeploy merely to refresh identity if the accepted deployment is already current;
- live Opening six-argument writer/migration contract remains intact read-only;
- four literal provider choices are present after Opening;
- selected literal string equals submitted `player_action` byte-for-byte/string-for-string;
- committed action/turn/history/recovery identifies that literal input without server semantic rewrite;
- next free-text input remains unchanged ordinary player input;
- Story terminal parser status, Extract, Commit, and replay succeed;
- committed `parsed_blocks` are present and used by current-format replay/recovery;
- final dedicated TEST reset leaves committed_turn=0, setup/opening not_started, no actions/turns, and no active CSA.

If any deterministic failure appears, preserve bounded evidence in OS TEMP and stop without retry/regeneration.

## Architecture constraints

- No source/runtime/test semantic changes in this lease.
- No provider/model/temperature/token changes, retries/regeneration, parser relaxation/new parser, fuzzy repair, regex cleanup, fallback Story, semantic hard gate, or server-authored semantic choice fallback.
- Exactly-four choices are provider-authored literal presentation shape only; the clicked literal becomes ordinary player input.
- Free text remains ordinary gameplay.
- Story authors narrative; Extract observes; Commit owns structural transactionality/idempotence.
- Recent six raw Story + older natural-language `turn_summary` remains continuity authority.
- No relation/general-event/emotion/work narrative ledger may be restored.
- CSA remains institutional rule/context, not consent/comfort/affection/emotion authority.
- Scene/location/presence, compact clothing UI continuity, TEST-only Level-7 seam, sexual state/media adapters, image catalogs/pools/families, and TTS remain protected actual-consumer side systems. Media classification must never gate whether Story/Extract facts occurred.
- Historical migrations are immutable.

## Authorized operations

Authorized:
- read-only TEST DB/RPC/migration/deployed-identity verification;
- one dedicated disposable TEST game through normal API paths;
- Setup/Opening, one exact literal-choice turn, one free-text turn, replay/recovery, final reset of that dedicated game only;
- OS TEMP evidence;
- docs/audit completion evidence in #67.

Not authorized:
- Production access;
- any access/mutation/reset of manual game `78fb1d94-266f-455a-bda4-7656cc2370c1`;
- source/runtime/test changes;
- migration/DDL/reapplication;
- direct DB mutation to manufacture gameplay state;
- API/frontend deploy unless current deployed identity is proven not to contain the reviewed executable, in which case STOP and report BLOCKED rather than improvising;
- new branch/PR, merge, Ready, rebase, squash, force-push.

## Completion

On success or deterministic BLOCKED finding:
- report dedicated TEST game ID, exact four Opening choices, selected literal and submitted `player_action`, commit/history/replay proof, free-text proof, parsed-block recovery result, final reset state, deployed identity, and any blocker evidence;
- keep executable source unchanged;
- set CURRENT_TASK to `WAITING_REVIEW` in a docs-only completion commit;
- post one immutable terminal report to Issue #68;
- STOP for operator review.

## Execution result — 2026-08-16

The already deployed reviewed Worker was used without redeployment:
`game-proxy-company-v1`, Version
`10044238-541e-4e8a-a115-fb5a6cd1ecb5`, with health previously verified as
HTTP 200, `ok=true`, `edition_id=company-v1`. Read-only TEST contract
verification remained PASS for migration
`20260816000100_company_v1_opening_structured_persistence` and the canonical
six-argument Opening writer with SECURITY DEFINER,
`search_path=public, pg_temp`, service_role EXECUTE, and parsed_blocks
persistence. No migration, DDL, or deployment occurred in this task.

The single bounded run used dedicated TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`. Setup passed with setup ID
`30267c31-cbea-4042-bd22-9c1c82f43c0b`. Opening returned HTTP 200 and a
complete SSE event with four literal choices, but the strict parser stopped
on the provider's attributed identity `DIALOGUE speaker_id="heroine3"`:
`Unknown Story speaker_id: heroine3`. The four returned choices were:

1. `자리를 먼저 정리하고 김제나에게 간단히 인사한 뒤, 오늘 할 일이 무엇인지 물어본다.`
2. `지하철에서 봤던 광고 캠페인 이야기를 꺼내며 가볍게 대화를 시작해 본다.`
3. `자리에 앉기 전에 팀장이 돌아올 때까지 기다리며 사무실 분위기를 더 둘러본다.`
4. `스마트폰을 꺼내 상식개변 앱이 여전히 그대로 있는지 몰래 확인해 본다.`

Because Opening parsing failed, no literal-choice Story/Extract/Commit or
free-text turn was attempted. Evidence is preserved at
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-story-marker-literal-choice-live-closure.json`.
Canonical reset succeeded, and a separate read-only readback was clean:
committed_turn=0, processing_status=idle, player_setup=not_started,
opening_state=not_started, csa_active=[], recent turns=0, history=0.

This is a deterministic live acceptance BLOCKER, not authority to modify the
parser/provider/runtime or retry the provider. No retry, regeneration,
provider/model workaround, parser relaxation, fuzzy repair, semantic
fallback, Production/manual-game access, or source/runtime/test change was
performed.
