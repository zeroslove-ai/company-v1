# Company v1 Current Truth — 2026-08-14

> **이 파일이 Company v1 기술 정본이다. 과거 handoff/PR/architecture/completion report와 충돌하면, 실제 current source / live DB / Git ancestry / immutable evidence를 우선하고 이 문서를 그 검증된 사실에 맞춰 갱신한다. 계획은 배포 사실처럼 쓰지 않는다.**

## Mandatory read-before-answer / read-before-work rule

Company v1 runtime에 대해 구현 지시, 리뷰, 배포 판단, 완료 승인, 구조 설명을 하기 전에 반드시 다음 순서로 확인한다.

1. `/CURRENT_TRUTH.md`
2. `/AGENTS.md`
3. 이 파일 `09_CURRENT_TRUTH.md`
4. `10_SOLE_WRITER_DECISION.md`
5. 질문이 current repo/PR/DB/deploy 상태에 의존하면 해당 Git SHA/PR/live DB를 직접 확인

기억이나 과거 완료보고만으로 current fact를 단정하지 않는다. 움직이는 branch를 리뷰할 때는 exact `REVIEW_SHA`를 먼저 고정하며, 리뷰 도중 HEAD가 움직이면 새 range를 별도로 검토한다.

## Identity

| Item | Current verified value |
|---|---|
| Repo | `zeroslove-ai/company-v1` |
| `origin/main` baseline | `1e3a5255e51a284e45baf551dcfd415360981927` |
| Audit freeze / Cut 1 base | `00f459277868fc5f2d48dae5c3a2dc655c8afd25` |
| Runtime baseline before Cut 1 | `5ba68bb204767756b9c8a4b5a72ea4003f2075b6` |
| Cut 1 Closure runtime candidate | `fd7faa09aa61e0575469aeddbe322ca4253262e3` |
| Cut 1 runtime review range | `00f459277868fc5f2d48dae5c3a2dc655c8afd25..fd7faa09aa61e0575469aeddbe322ca4253262e3` |
| Stage A rollout-prep SHA | `c345107f5017184ed542210c4249acc94a293af4` |
| Live gate correction / API deploy review SHA | `96888a3492c0d85f6f3c6649217d842e6d391494` |
| Deployed API source | `3c3b41425f0ef536c5d36aec2d4911e7d8de9a8d` |
| Deployed API Worker Version | `b440d3ea-b96e-4232-a8cc-fdfa1c497ae1` |
| Stage B live migration | `20260814051254 / company_v1_authority_enforcement_stage_b` |
| Cut 2 Scene Stage A review SHA | `4f5d77d9bde813d977c99327fe077edb0acb03ff` |
| Canonical branch | `company/runtime-authority-consolidation-v1` |
| Canonical PR | #65 — OPEN / DRAFT / UNMERGED |
| TEST game | `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` |
| Supabase project | `fmcrspgxstsmxxsmkeee` |
| PRODUCTION game | `11111111-1111-4111-8111-111111111111` — no access authorized in current cut |

`96888a3...` contains no `src/**` runtime changes relative to `fd7faa09...`; it adds only rollout/test/documentation corrections, including safe migration ordering and the live-catalog contract gate correction. Documentation-only commits may advance the branch/PR HEAD beyond an executable review SHA; that does not create a new runtime behavior unless source is changed and separately reviewed.

## Precedence

1. Current source at the exact reviewed SHA controls candidate executable behavior.
2. Live DB catalog, privileges, migration ledger and function bodies control deployed durable facts.
3. Exact deployed Worker identity controls what is actually running.
4. Git ancestry controls lineage.
5. Immutable captured evidence controls what a recorded run observed.
6. This file is the human-facing interpretation of verified facts and binding current decisions.
7. Completion reports and old handoff/PR prose are evidence to inspect, not authority by themselves.

## Durable authority baseline

- `commit_company_turn` remains the sole normal-turn durable `game_save` / `game_turns` commit boundary.
- Story and Extract may persist staged action outputs, but gameplay state is not durable before normal Commit.
- Application lifecycle writes to `game_actions` use named RPCs; direct REST PATCH is not a permitted target writer.
- `save.scene` v1 remains the target sole scene/location/presence authority; its validator/reader consolidation is **outside Cut 1**.
- Active-relations writer consolidation, setup/opening catalog duplication, player physical/sexual consolidation, frontend cache projection and parser compatibility cleanup remain later authority cuts.
- Historical applied migrations are immutable; cleanup is additive.

## Cut 1 Closure — reviewed source candidate

The reviewed runtime candidate is `fd7faa09aa61e0575469aeddbe322ca4253262e3` (`refactor: close action ownership lifecycle authority`). GitHub CI for that SHA completed successfully. The current rollout/gate review SHA is `96888a3492c0d85f6f3c6649217d842e6d391494`; GitHub CI for that SHA also completed successfully and no `src/**` runtime code changed between the two SHAs.

### Action ownership model

`game_actions` canonical Cut 1 fields:

- `processing_status` — current lifecycle stage
- `stage_owner_token` — current Story/Extract provider-stage owner, nullable
- `stage_claimed_at` — owner lease acquisition time, nullable; stale authority
- `error_code` — failure/diagnostic reason only; never an owner token or in-progress lock
- `updated_at` — general row mutation timestamp, not lease authority

Story and Extract use the same fenced ownership contract. Every execution attempt gets a unique owner token (`story:<request_id>` / `extract:<request_id>`). Owner acquisition/replacement is atomic. Stage success/failure verifies the exact owner token and atomically clears `stage_owner_token` and `stage_claimed_at`. After stale takeover, the old owner cannot record late success or late failure.

## Stage A — LIVE TEST truth

Final Stage A source migration:

`20260814000300_company_v1_action_ownership_closure_stage_a.sql`

Supabase applied this through the operator migration path and recorded:

- migration version: `20260814023308`
- migration name: `company_v1_action_ownership_closure_stage_a`

Verified live TEST facts:

- `game_actions.stage_owner_token` = nullable `text`
- `game_actions.stage_claimed_at` = nullable `timestamptz`
- owner-based `claim_game_action_stage(uuid, uuid, text, text, text, text, text, text, boolean)` is live
- owner-fenced `fail_game_action_stage(uuid, uuid, text, text, text, text, text, boolean)` is live
- `record_story_result_owned(uuid, uuid, text, jsonb, text)` is live
- `record_extract_result_owned(uuid, uuid, jsonb, text)` is live
- all four new RPCs are `SECURITY DEFINER`
- all four use `search_path = public, pg_temp`
- all four grant EXECUTE to `service_role`
- the live readback also confirmed no unnecessary public/anon/authenticated execution on the newly introduced owned RPC surface
- legacy Story/Extract/lifecycle RPC overloads were present for the Stage A compatibility window; Stage B live readback confirmed their removal
- legacy Story/Extract writers rejected rows whose `stage_owner_token` was non-null during the Stage A compatibility window
- `apply_reserved_csa_transaction(uuid, uuid, integer)` was present for Stage A and was removed by live Stage B enforcement
- service-role direct gameplay `INSERT/UPDATE/DELETE/TRUNCATE` was present for Stage A and is revoked in live Stage B
- Stage B migration `20260814051254 / company_v1_authority_enforcement_stage_b` is applied in TEST
- API Worker source `3c3b41425f0ef536c5d36aec2d4911e7d8de9a8d` is deployed as Version `b440d3ea-b96e-4232-a8cc-fdfa1c497ae1`; Frontend was not redeployed

## DB contract gate — LIVE VERIFIED

Contract files:

- `config/company-v1-db-contract.json`
- `scripts/company-db-contract-gate.mjs`
- `scripts/deploy-api-with-contract-gate.mjs`

Contract id/version: `company-v1-action-authority` / version `2`.

`96888a3492c0d85f6f3c6649217d842e6d391494` corrects the live-catalog assumptions found after Stage A application:

- migration authority uses exact `schema_migrations.name`, not source filename timestamp
- function identity uses canonical type-only arguments (`oidvectortypes(p.proargtypes)`), not parameter-name-bearing argument text

Independent read-only TEST verification using the corrected catalog shape returned:

- migration check = PASS
- ownership-column check = PASS
- required owned-RPC identity/security/grant check = PASS
- overall Stage A contract = **PASS**

Therefore the Stage A DB contract prerequisite for API deployment is satisfied. The deploy wrapper must still execute the corrected gate before Wrangler starts; if that runtime preflight fails, deployment must stop.

Stage A intentionally permitted temporary legacy compatibility writers and direct DML. Live Stage B readback confirmed that direct gameplay DML is revoked, SELECT is retained, approved RPC invocation succeeds, and the legacy writers are removed.

## Stage B enforcement — LIVE TEST truth

Final Stage B source migration:

`20260814000400_company_v1_authority_enforcement_stage_b.sql`

The operator-applied live migration is recorded as:

`20260814051254 / company_v1_authority_enforcement_stage_b`

Verified live TEST facts:

- service-role direct gameplay `INSERT/UPDATE/DELETE/TRUNCATE` is revoked on the six approved core tables
- SELECT remains available where required
- a raw service-role `UPDATE` was rejected with PostgreSQL `42501`
- approved SECURITY DEFINER RPC invocation succeeds
- legacy lifecycle, Story, Extract, and CSA-preapply RPCs are removed

The pre-Stage-B scoped Golden Path passed. The post-Stage-B scoped Golden Path now also passes with the `3c3b414...` Worker: Opening, Turn 1/2 Story/Extract/Commit, replay, context/history, and final reset all succeeded. Cut 1 runtime acceptance is complete; the broad Phase12K clothing evidence remains a separate later-cut item.

## Test and verification policy — binding

The current large legacy test suite is **not a preservation target and raw test count is not proof of correctness**.

1. Never add runtime compatibility or preserve superseded architecture merely to keep an obsolete test green.
2. When a canonical contract changes, affected tests are `KEEP`, `REWRITE`, or `DELETE`.
3. Keep tests that directly protect current product invariants and authority boundaries.
4. Rewrite tests that express a valid invariant through an obsolete implementation detail.
5. Delete duplicate mocks, superseded legacy-contract tests, source/SQL-string existence checks, fake E2E and other implementation-detail tests when they no longer prove a canonical invariant.
6. Focused invariant tests are the development gate. A full suite may be a regression signal, but raw pass count is never an acceptance criterion.
7. A failing old test is triaged against current truth before runtime code is changed.
8. Runtime acceptance prioritizes source↔DB contract verification and a real TEST Golden Path over accumulation of mocks.
9. Reuse the existing live canary/E2E/reset helpers. Do not create another harness unless the current harness cannot express a required invariant.
10. Test Suite Reset/Consolidation is complete on Draft PR #66; no numeric test-count target is binding.

## Test Suite Reset / Consolidation — verified

- Test-reset branch: `company/test-suite-consolidation-v1`
- Test-reset PR: #66 — OPEN / DRAFT / UNMERGED
- v1.1 final test result: 417/417 passing
- source/SQL implementation-text regex tests: 0 remaining
- unreachable/dead-return masked assertions: 0 remaining
- runtime, content, migration, DB, and deployment changes: 0

## Supersession note for `10_SOLE_WRITER_DECISION.md`

`10_SOLE_WRITER_DECISION.md` remains binding for durable commit, CSA authority, scene/location target, relations, physical/sexual evidence, setup/opening, frontend projection, parser compatibility and migration policy.

For **Cut 1 action-lifecycle mechanics only**, this file supersedes the older Decision 2 examples that used `error_code` as the ownership CAS field. The canonical model is `stage_owner_token` + `stage_claimed_at`, with `error_code` reserved for failure/diagnostic meaning.

For **Cut 1 rollout status**, this file also supersedes the old statement in Decision 11 that no migration has been applied: Stage A and Stage B are verified live in TEST; the deployed API is `3c3b41425f0ef536c5d36aec2d4911e7d8de9a8d` / Version `b440d3ea-b96e-4232-a8cc-fdfa1c497ae1`.

## Known later authority conflicts — do not fold into Cut 1

- live CSA preapply mutation before Commit — Stage B removes the obsolete writer
- scene compatibility fields / `player_scene_state.location_id` split from target `save.scene`
- live validator requires legacy `scene_state` but not target `save.scene`
- Engine/Extract active-relations duplicate mutation paths
- SQL setup/opening semantic catalog duplication
- opening fallback mojibake
- fresh/persisted/legacy parser compatibility surfaces
- frontend stream/session caches separate from committed context
- player/NPC physical/sexual authority gaps still requiring their own later cut

These are evidence/backlog for their designated authority cuts, not incidental Cut 1 patches.

## Cut 1 acceptance / rollout sequence

Current state: **Closure source `3c3b414...` deployed as Version `b440d3ea...`; Stage A and Stage B applied to TEST; post-Stage-B scoped Golden Path passed; final TEST reset is clean; PR #65 remains Draft/unmerged; Cut 1 runtime acceptance is complete.**

Next sequence, with explicit owner approval for deployment/write steps:

1. Preserve the exact deployed Worker identity and TEST acceptance evidence.
2. Decide merge/main landing strategy for PR #65.
3. Perform Test Suite Reset/Consolidation before later authority cuts inherit the legacy suite as unquestioned contract.

## Post-Stage-B Opening evidence — verified

- Immutable evidence: `C:\Users\JAEWAN\company-v1-cut1-post-stage-b-980f4c5\cut1-post-stage-b.json`
- The prior Opening failure was resolved by the exact reviewed source `3c3b414...` and redeployed Worker Version `b440d3ea...`.
- The post-Stage-B canary observed provider/control choices `4`, parsed choices `4`, and committed Opening choices `4`; `commit_company_opening` succeeded.
- Turn 1 and Turn 2 Story/Extract/Commit succeeded; Story, Extract, and Commit replay all returned their replay/idempotent results without increasing the committed turn or save revision.
- Context/history readback contained the expected committed turns and story/parsed-block/choice records during the run.
- Final read-only state: `committed_turn=0`, `processing_status=idle`, `player_setup=not_started`, `opening_state=not_started`, `csa_active=[]`, recent turns `0`, history records `0`.
- Cut 1 runtime acceptance is complete. The broad Phase12K clothing evidence remains separate.

## Cut 1 final invariants

1. Normal-turn durable save/turn state is committed only by `commit_company_turn`.
2. Application action-lifecycle mutation uses named RPCs, not direct REST PATCH.
3. Story and Extract share one fenced provider-stage ownership model.
4. At most one current owner exists per provider stage.
5. Stale takeover fences the old owner from both success and failure writes.
6. `stage_claimed_at` is lease authority; `updated_at` is not.
7. `error_code` contains failure/diagnostic meaning only.
8. Stage success/failure and owner release are atomic.
9. Stage B removes raw gameplay DML and obsolete/legacy duplicate writers after staged compatibility verification.
10. An API SHA whose required DB contract is absent must be blocked from deployment.

## Cut 2 scene/location/presence candidate — Stage A live, acceptance pending

Historical source candidate branch was `company/scene-location-presence-v1`, based on
the accepted test-suite line. The reviewed source is
`4f5d77d9bde813d977c99327fe077edb0acb03ff` and introduces strict `save.scene`
v1 reading, legacy-only bootstrap, one canonical scene reducer, a
compatibility projection, typed ephemeral navigation intent, and evidence-gated
location/presence observation.

Historical pre-closure TEST facts:

- Scene Stage A migration is applied as version `20260814091536` with name
  `company_v1_scene_authority_stage_a`.
- Behavioral probes pass: `legacy_only_save_accepted`,
  `canonical_scene_save_accepted`, `canonical_missing_nullable_key_rejected`,
  and `reset_returns_scene_v1` (the reset probe used transaction rollback).
- Final TEST readback is `committed_turn=0`, `save_revision=833`,
  `actions=0`, and `turns=0`.
- Live ACL readback found `service_role` EXECUTE on the internal helpers
  `company_validate_scene_v1(jsonb, boolean)` and
  `company_bootstrap_scene_v1(jsonb)`, contrary to the reviewed manifest.
- Scene Stage A acceptance is **not complete**. The historical 00500 migration
  is immutable; additive ACL closure source
  `20260814000550_company_v1_scene_authority_stage_a_acl_closure.sql` is
  pending review and application.
- Historical handoff state above is superseded by the verified post-Cut2 closure
  recorded below; it must not be used as the current deployment state.

## Post-Cut2 scene/location/presence authority — verified current state

The current source branch is `company/scene-location-presence-v1`, with
docs-only HEAD `1171ccad50ed2dc009c1daf61d784f4c3539de2a`; the reviewed /
deployed executable is `a919baf87d92e841e64b731576ccb176d5745570`, and the
current PR is #67 OPEN / DRAFT / UNMERGED.

Verified live TEST facts:

- Scene Stage A: `20260814091536 / company_v1_scene_authority_stage_a`.
- Scene Stage A ACL closure: `20260814093123 /
  company_v1_scene_authority_stage_a_acl_closure`.
- Scene Stage B: `20260814000600 / company_v1_scene_authority_stage_b`.
- `validate_company_save_v1(jsonb)` structurally requires canonical `save.scene`;
  legacy scene mirrors remain optional typed compatibility fields.
- Navigation and NPC-directed movement acceptance passed.
- Dedicated TEST is clean at `save_revision=881`, `committed_turn=0`, with zero
  actions and turns. The immutable manual evidence game is
  `78fb1d94-266f-455a-bda4-7656cc2370c1` and is not the dedicated TEST game.
- Cut 2 Stage B and scoped post-Stage-B acceptance are complete. Remaining
  relationship/event, summary, physical/sexual, setup/catalog, and parser/cache
  debts are not silently marked complete by this fact.

See `docs/audit/POST_CUT2_GAME_MODEL_RECOVERY_2026-08-14.md` for the read-only
end-to-end flow, seven-turn reconstruction, authority matrix, and recommended
next cut. No implementation cut is authorized by that document.

## Narrative semantic-state residue simplification — source/test review pending

The source/test task `narrative-semantic-state-residue-simplification-v1` was
implemented on `company/scene-location-presence-v1` in commit `648a823` and is
now marked `WAITING_REVIEW` in `docs/ops/CURRENT_TASK.md`. This is not a live
deployment or acceptance fact.

The candidate removes continuity-only relation/general-event/emotion/work
writers and Story-facing projections. Fresh Extract rejects those non-empty
semantic residue channels; historical persisted residue is inert at the read
boundary. It preserves concrete consumers for stats, sexual records/counters,
canonical scene/location/presence, physical/clothing, time/progression/CSA,
choices, Mind Monitor, raw Story, and `turn_summary`.

Verification facts: full test command `npm.cmd test` passed 413/413, focused
semantic/consumer tests passed 103/103, changed JS/MJS syntax checks passed,
and `git diff --check` passed. No DB write, migration, reset, deployment, or
Production access was performed; PR #67 remains OPEN / DRAFT / UNMERGED.

## Semantic residue fail-open closure — source/test review pending

The follow-up correction `narrative-semantic-residue-fail-open-closure-v1`
was implemented in source/test commit `0fc5099` and is marked
`WAITING_REVIEW` in `docs/ops/CURRENT_TASK.md`. This remains a source/test
candidate, not a live deployment or acceptance fact.

The prior fresh Extract `FRESH_SEMANTIC_RESIDUE_FORBIDDEN` whole-turn failure
was removed. Current-format normalization now drops removed or unknown
optional relation/general-event/emotion/work observation residue with
diagnostic warnings while preserving valid narrow siblings; explicit
save/state patch violations remain hard failures. No removed semantic writer,
reader, projection, or replacement gateway was restored.

Verification facts: focused correction tests passed 35/35, full `npm.cmd test`
passed 417/417, changed JS/MJS syntax checks passed, and `git diff --check`
passed. No DB write, migration, reset, deployment, or Production access was
performed; PR #67 remains OPEN / DRAFT / UNMERGED.

## Deep Level-7 live acceptance v9 — TEST verified, operator review pending

The accepted simplified-runtime executable `0fc509911e5bdf5aabb92fe5241a845f686bdb17`
was deployed to the TEST Worker `game-proxy-company-v1` as Version
`20052ce9-4c65-4158-9bae-5a7cd8372e1e`. The Stage B action contract gate and
Wrangler dry-run passed before deployment, and `/health` returned HTTP 200 with
`edition_id=company-v1`.

One coherent run on disposable TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84` completed setup/opening and eight
ordinary Story → Extract → Commit turns. An exact literal Opening choice
round-tripped as the next player action; free-text actions committed; fresh
Extract results contained no current-format relation/general-event/emotion/work
residue; scene/progression/time and other narrow readback remained usable; and
the selected committed turn replayed with Story/Extract/Commit replay flags
true while `committed_turn` and `save_revision` remained invariant. The live
history readback contained eight committed records, each with a natural-language
`turn_summary`. The accepted source projection contract was verified to slice
the latest six raw turns and place older summaries in chronological
`turn_summary_memory`; the temporary broad context probe used
`recent_turns=15`, so it is not represented as a direct six-item API response.

Evidence is preserved at
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v9-evidence.json`.
Final disposable-game reset was independently read back clean at
`committed_turn=0`, `processing_status=idle`, setup/opening `not_started`,
zero recent turns, and `save_revision=973`. No Production or historical
manual-game access occurred. `docs/ops/CURRENT_TASK.md` is now
`WAITING_REVIEW`; the next architecture task was not generated.

## Final active-runtime compatibility residue cleanup — source/test verified

The source/test cleanup task `final-runtime-compatibility-residue-cleanup-v1`
was completed on `company/scene-location-presence-v1` in source/test commit
`1025f4da096389838328afc1982ba9a47d421421`; `docs/ops/CURRENT_TASK.md` is
`WAITING_REVIEW`. This is not a new live deployment or TEST acceptance fact.

The zero-consumer `legacy-narrative-parser.js` re-export alias was deleted and
historical parser tests were routed through the single `parsePersistedNarrative`
read boundary. The persisted Story reader, V1 Extract adapter, old-save scene
hydration, canonical scene-to-mirror projection, frontend recovery, and
proven product/media/state consumers were retained because concrete current
callers or historical persisted-data dependencies remain. Historical applied
migrations were not edited.

Verification: `npm.cmd test` passed 417/417; targeted persisted-parser,
replay, Extract, scene, display, and frontend recovery tests passed 92/92;
changed JS/MJS syntax checks and `git diff --check` passed. No DB write,
TEST reset/live access, migration/DDL, deployment, or Production access was
performed. PR #67 remains OPEN / DRAFT / UNMERGED; operator review is pending.

## Opening structured persistence contract — authored, not live

Task `opening-structured-persistence-contract-v1` was completed as source,
test, and additive-migration authoring only from start HEAD
`625ec976dce59b8e86d877a29eeb9a01aaf6b99d` on
`company/scene-location-presence-v1`.

Source/test/migration commit:
`c62c92e231a0f0b44a723474bd16a7dba1985124`.

Authored migration:
`supabase/migrations/20260816000100_company_v1_opening_structured_persistence.sql`.
It drops the zero-active-caller five-argument Opening writer in the authored
additive migration and defines the six-argument
`commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)` contract with
server-produced `p_parsed_blocks`, preserved structural checks/idempotence,
`SECURITY DEFINER`, `search_path = public, pg_temp`, and service-role-only
execution. The API sends `parsedOpening`; current-format Opening projection
prefers stored `opening_state.parsed_blocks`; historical rows without it keep
the existing single inert persisted-parser boundary.

The active runtime caller inventory found no five-argument writer caller.
Historical verification/preflight references remain unchanged as immutable
prior-contract evidence and are not runtime writers. No semantic narrative
gate, parser, provider change, retry, or regeneration was added.

Targeted Opening/replay/frontend/reset/turn tests passed 75/75 and the full
`npm.cmd test` passed 419/419; changed JS/MJS syntax and diff checks passed.
The migration is **not applied**. API/deploy/live DB/TEST reset/DB writes and
Production access remain 0. PR #67 remains OPEN / DRAFT / UNMERGED. Operator
review is required before any TEST migration application or deployment.

## Opening structured replay authority — BLOCKED on additive DB/RPC contract

The source/test task `opening-structured-replay-authority-v1` was investigated
from start HEAD `4d8fc0cf57c465f1be1ba3336adffc0a3f508079` on
`company/scene-location-presence-v1`. The current
`commit_company_opening(uuid, uuid, text, text, jsonb)` contract stores only
Opening `story_text` and `choices` in `opening_state`. The API's structured
`parsedOpening` exists in the response but is not sent to or stored by the
RPC. `openingTurnProjection()` therefore still reparses persisted raw Opening
prose; the frontend consumes that server projection and does not add a second
parser.

This cannot be closed by a source-only patch without inventing a non-canonical
storage path. The minimum required follow-up is an approved additive
`p_parsed_blocks jsonb` Opening RPC/write contract that stores
`opening_state.parsed_blocks`, followed by server projection preference for
that field and a historical fallback only when it is absent. No migration was
authored or applied in this task.

Existing Opening/setup/frontend recovery tests passed 54/54. No source/test
behavior changes, DB write, TEST reset/live access, migration/DDL, deployment,
or Production access occurred. PR #67 remains OPEN / DRAFT / UNMERGED.

## Committed `parsed_blocks` replay authority — source/test verified

The follow-up source/test task `committed-parsed-blocks-replay-authority-v1`
was implemented on `company/scene-location-presence-v1` in source/test commit
`7b61c9fd69930e82afc97a2dc907136ce3678beb`. Current-format replay, history,
Extract, and Commit readers now prefer usable committed `parsed_blocks.blocks`;
the existing `parsePersistedNarrative` boundary remains only for rows without
usable structured blocks. Fresh generation still uses the fresh parser, and
opening state remains on its separate persisted opening projection because the
current opening RPC does not store committed-turn `parsed_blocks`.

The current raw Story remains the exact Extract/presentation input, but it no
longer overrides usable committed structured blocks during replay/recovery.
No new parser, gateway, semantic fallback, or compatibility wrapper was added.

Verification: targeted replay/structured-persistence tests passed 11/11;
broader focused tests passed 80/80; full `npm.cmd test` passed 419/419;
changed JS/MJS syntax checks and `git diff --check` passed. No DB write, TEST
reset/live access, migration/DDL, deployment, or Production access was
performed. PR #67 remains OPEN / DRAFT / UNMERGED; operator review is pending.

## Story control-marker root-cause cut: source/test ready for review

The preserved ordinary Story failure artifact showed the provider stream
starting with `[SCENE brand_strategy_meeting_room]`, which the strict shared
wire parser correctly rejects as `STORY_PROTOCOL_INVALID / Malformed Story
control marker`. The repository-owned ordinary Story prompt did not explicitly
separate JSON `scene_id` data from marker syntax, and Opening/ordinary prompts
held overlapping marker instructions.

At start HEAD `bceafd9adc0e001b42a5de29caf02485da9ea6c7`, the fix consolidates
one `FRESH_MARKER_GRAMMAR` into both prompts. It requires bare `[SCENE]`,
forbids scene IDs/attributes in that marker, and leaves the strict parser as
the sole acceptance boundary. No parser relaxation, normalization, retry,
provider/model change, fallback Story, semantic gateway, TEST live call, DB
write, migration, or deployment was made.

Changed source/test files:

- `src/engine/story-prompt.js`
- `src/engine/opening-prompt.js`
- `test/narrative-protocol.test.mjs`
- `test/narrative-request-contract.test.mjs`
- `test/setup-opening.test.mjs`

Focused and full validation passed: 18/18 narrative tests, 24/24 setup/
Opening tests, 38/38 related persistence/replay tests, and `npm.cmd test`
420/420. Syntax checks and `git diff --check` passed. The Cut remains source/
test-only and awaits review before any live rollout.

## Opening structured persistence TEST rollout: BLOCKED

The exact reviewed source/test/migration contract
`c62c92e231a0f0b44a723474bd16a7dba1985124` was deployed to TEST after the
docs-only descendant `ca25605082cd14991320f18df939b87326aed8e3` was verified
to contain no executable changes. The additive migration
`20260816000100_company_v1_opening_structured_persistence` was applied once;
live migration ledger and RPC readback confirmed the canonical six-argument
`commit_company_opening` writer, removal of the old five-argument writer,
SECURITY DEFINER, `search_path = public, pg_temp`, service_role-only execute,
and persistence of `opening_state.parsed_blocks`.

Worker `game-proxy-company-v1` version
`4660b79f-8ff3-40f5-ae1f-cd8134219f7c` was deployed at
`2026-08-15T19:11:34.108703Z`; health returned HTTP 200 and
`edition_id=company-v1`. Frontend deploy and Production access were zero.

The bounded dedicated TEST canary used game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`. Setup and Opening passed, then the
first ordinary Story failed deterministically with
`story_protocol_invalid` / `Malformed Story control marker` for action
`e0fcda84-3130-4b19-9bcd-5851f9662ae6`. Extract and Commit were not attempted.
The preserved artifact is
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-canary-cut1-authority.json`.
Canonical final reset passed with HTTP 200/`ok=true`; the artifact records
`committed_turn=0`, `save_revision=975`, `processing_status=idle`, and no
recent actions. No retry or workaround was performed. Cut 2 opening
structured persistence rollout acceptance remains incomplete pending operator
 review.

## Story marker TEST rollout: PASS, operator review pending

The exact reviewed executable lineage containing
`b3c06f931d8bd216f217412343621781670f0722` was deployed to TEST only as
Worker `game-proxy-company-v1`, Version
`10044238-541e-4e8a-a115-fb5a6cd1ecb5`, at
`2026-08-15T21:08:34.371359Z`. Health returned HTTP 200 with
`ok=true` and `edition_id=company-v1`. Frontend deployment and Production
access were zero.

Read-only TEST contract verification remained PASS for migration
`20260816000100_company_v1_opening_structured_persistence` and the canonical
six-argument `commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)`:
SECURITY DEFINER, `search_path=public, pg_temp`, service_role-only execute,
and `opening_state.parsed_blocks` persistence in the function body. No
migration or DDL was applied.

The bounded dedicated TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84` passed Setup, Opening, two ordinary
free-text Story/Extract/Commit turns, Turn 1 Story/Extract/Commit replay,
context/history readback, and final reset. Opening provider output contained
4 raw and 4 canonical choices; the complete SSE payload contained 4 parsed
choices and 4 canonical choices. Ordinary Story parser status was success,
Story terminal SSE was complete, and Extract/Commit succeeded for both turns.
The final read-only context was clean: committed_turn=0,
processing_status=idle, player_setup=not_started, opening_state=not_started,
csa_active=[], and no recent turns. The current artifact is
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-canary-cut1-authority.json`.

The exact selected-literal round-trip is preserved in the prior v9 live
artifact `C:\Users\JAEWAN\AppData\Local\Temp\company-v1-deep-level7-v9-evidence.json`:
the Opening literal was submitted as `player_action` and matched exactly.
That run used ancestor `0fc509911e5bdf5aabb92fe5241a845f686bdb17`, an ancestor
of reviewed executable `b3c06f931d8bd216f217412343621781670f0722`; the reviewed
change only consolidates Story marker grammar and does not alter the choice
path. Thus the current rollout closes the attributed-SCENE boundary while
retaining the previously verified literal-choice contract.

No retry, regeneration, provider/model workaround, parser change, semantic
fallback, frontend deployment, Production access, or preserved manual-game
access occurred. Story-marker TEST rollout acceptance is complete pending
operator review; no later Cut 2 task is generated by this result.

## Literal-choice live closure: BLOCKED at Opening parser boundary

The next acceptance-only task used the already deployed reviewed Worker
`game-proxy-company-v1`, Version
`10044238-541e-4e8a-a115-fb5a6cd1ecb5`, without redeployment. Health and the
read-only Opening contract remained verified: migration
`20260816000100_company_v1_opening_structured_persistence`, canonical
`commit_company_opening(uuid, uuid, text, text, jsonb, jsonb)`, SECURITY
DEFINER, `search_path=public, pg_temp`, service_role EXECUTE, and
`parsed_blocks` persistence.

On dedicated TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, Setup passed with setup ID
`30267c31-cbea-4042-bd22-9c1c82f43c0b`. Opening returned HTTP 200/complete
and four literal choices, but the strict parser deterministically failed on
provider output containing `[DIALOGUE speaker_id="heroine3"]` with
`Unknown Story speaker_id: heroine3`. The selected-literal turn and following
free-text turn were therefore not attempted. No retry, regeneration,
provider/model workaround, parser relaxation, or semantic fallback was used.

The bounded evidence is preserved at
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-story-marker-literal-choice-live-closure.json`.
The canonical reset and separate read-only readback were clean:
`committed_turn=0`, `processing_status=idle`, setup/opening `not_started`,
`csa_active=[]`, recent turns `0`, history `0`. No source/runtime/test,
migration/DDL, deployment, or Production/manual-game operation occurred in
this task. The active task is `WAITING_REVIEW`; the blocker is an acceptance
result requiring operator review, not authorization for an incidental parser
or provider change.

## Story speaker identity projection investigation — BLOCKED

Task `story-speaker-identity-projection-root-cause-v1` started at source/test
HEAD `67d0f87d3c8e4af411e8513a5ed728ca00a34de0`, with reviewed executable
`b3c06f931d8bd216f217412343621781670f0722`. Source tracing verified that the
current Company edition registers `heroine3`, `masterFromEdition()` projects
the canonical character set, and Opening exposes the active canonical ID.
The strict parser accepts registered `heroine3` and rejects the unregistered
`heroine3_alias`; the focused regression is in
`test/setup-opening.test.mjs` at source/test SHA
`6446b9873ee14865a9f292e5795d4f547c3690af`.

No stale alias/template or deterministic source producer defect was found.
The preserved live artifact's outer `Unknown Story speaker_id: heroine3`
diagnostic conflicts with this source behavior and does not preserve a valid,
independently reproducible probe boundary. The exact live failure boundary is
therefore BLOCKED for operator review; no parser relaxation or runtime fix is
authorized or made. Focused tests passed 55/55 and the full local suite passed
421/421. No source runtime, content, migration, DB, live TEST/reset, deploy,
or Production changes occurred. Cut 2 acceptance remains incomplete.

## Story speaker identity live evidence closure — BLOCKED / incomplete history capture

On `company/scene-location-presence-v1`, the bounded TEST closure used the
already deployed reviewed executable
`b3c06f931d8bd216f217412343621781670f0722` as Worker
`game-proxy-company-v1`, Version
`10044238-541e-4e8a-a115-fb5a6cd1ecb5`. No redeploy or migration occurred.

Dedicated TEST game `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` Setup and Opening
passed. The raw provider Story terminal payload contained canonical speaker
IDs `heroine4` and `heroine3`; the parser master contained registered
characters `heroine1` through `heroine5` and the registered general-NPC IDs;
strict parsing succeeded; and Opening returned four provider-authored literal
choices. The first literal was submitted unchanged as Turn 1 input, followed
by one free-text Turn 2. Both Story/Extract/Commit pipelines passed, and
Story/Extract/Commit replay was acknowledged for both actions with the Turn 1
revision invariant preserved.

The temporary evidence orchestrator used the wrong field shape when extracting
the `/api/history` response, so committed history action IDs and parsed-block
presence were not preserved in the artifact. The required final reset was
successful and read back clean (`committed_turn=0`, `processing_status=idle`,
`opening_state=not_started`, history count 0). Because the live game has
already been reset, this missing history evidence cannot be reconstructed
without another bounded run. This is an evidence-capture BLOCKED state, not a
runtime defect or authorization for a retry. The artifact is preserved at
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-story-speaker-live-closure.json`.

## Legacy save/DB residue cleanup candidate — WAITING_REVIEW

Task `legacy-save-db-residue-deletion-v1` started from source/test SHA
`45eeacadc2c269cfeafa654cbe56dd2116ed82ab` on
`company/scene-location-presence-v1`; source/test candidate SHA is `9c52e74`.
The source/test candidate is complete for operator review; this is not a live
DB acceptance fact.

The consumer audit classified the candidate fields as follows:

- DELETE `story_summary_overall` and `story_summary_recent`. Current Story
  context uses recent raw Story plus `game_turns.turn_summary` memory; no active
  source/UI reader remains for either save-level summary field.
- KEEP `npc_relationship_state`. `character-display`, `runtime-display`, the
  frontend relationship projection, and sexual-state validation consume this
  map. It was not removed from current fixtures or contracts.
- DELETE `npc_emotion`, `npc_work_state`, and general `event_ledger`. Current
  gameplay/UI has no reader or writer for these maps; fresh Extract explicitly
  drops general event observations. The separate `sexual_event_ledger` remains
  in the sexual/media path.

The candidate removes deleted fields at the runtime save boundary and from the
current Opening/reset contract candidate, seed, fixtures, mocks, frontend
projection, and stale general-event canary read. It authors exactly one
additive migration:
`20260816000200_company_v1_legacy_save_residue_cleanup.sql`.
Historical migrations were not edited. The migration is not applied; live DB
contract acceptance remains pending operator review and a separately authorized
rollout.

Validation: targeted residue/Opening/display tests 54/54; full
`npm.cmd test` 421/421; JSON/JavaScript syntax checks and `git diff --check`
passed. No DB write, migration application, TEST reset/live gameplay, deploy,
Production access, provider/model change, or new semantic compatibility
authority occurred. The next architecture cut was not generated.

## Legacy save/DB residue TEST rollout — BLOCKED

The accepted source/test candidate `9c52e74a8e32278207e6e9b729c33d64eb770fd1`
was applied to TEST through the single additive migration
`20260816000200_company_v1_legacy_save_residue_cleanup.sql`. The live ledger
recorded it exactly once as version `20260816011104` with name
`company_v1_legacy_save_residue_cleanup`. The post-apply validator,
`commit_company_opening`, and `reset_company_game` function identities,
SECURITY DEFINER settings, `search_path=public, pg_temp`, and intended ACLs
were read back successfully.

The exact reviewed API executable was deployed as Worker Version
`52daecdd-c589-4013-942b-1bd80dda18e2`; the changed frontend was deployed as
Version `4bd2ddfb-151e-4b93-a57f-eebf1b49446f`. Health and frontend readback
passed. On dedicated TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84`, Setup/Opening, one literal-choice
turn, one free-text turn, Story/Extract/Commit, and Turn 1 replay passed.
Read-only post-commit evidence showed all five deleted keys absent,
`turn_summary` and `parsed_blocks` present for both turns, and retained
relationship/sexual/stats/CSA/opening structures present.

Acceptance is **BLOCKED** because the required final canonical reset returned
HTTP 400 `invalid reset initial save: ["missing required key: scene",
"missing required key: scene"]`. No retry or cleanup reset was attempted.
The first authoritative artifact is preserved at
`C:\Users\JAEWAN\AppData\Local\Temp\company-v1-legacy-save-residue-rollout.json`.
The TEST game remains in the failed acceptance state pending operator review;
no rollback, second migration, source/config change, Production access, or
preserved manual-game access occurred.

## Legacy save reset canonicalization closure — WAITING_REVIEW

The deterministic reset regression was corrected from the accepted source/test
baseline `9c52e74a8e32278207e6e9b729c33d64eb770fd1` in commit
`a65a757d560ac15f01619de6df0eafbcc4905368`, with one focused reset-contract
test addition and exactly one additive migration source:
`20260816020000_company_v1_reset_canonicalization_closure.sql`.
Historical migrations were not edited. Local focused tests passed 26/26 and
the full suite passed 422/422; JavaScript syntax and `git diff --check` passed.

The migration was applied exactly once to TEST and independently read back as
ledger version `20260816013408` /
`company_v1_reset_canonicalization_closure`. The live
`reset_company_game(uuid,text)` is SECURITY DEFINER with
`search_path=public, pg_temp`, service_role EXECUTE, and PUBLIC/anon/
authenticated revoked. Its candidate order is: remove the five deleted
save-level keys, call the existing `company_bootstrap_scene_v1`, call the
existing `company_apply_initial_clothing_v2`, validate that same candidate
with the strict current `validate_company_save_v1`, then delete turns/actions
and persist that same validated candidate. The scene helper remains an
internal SECURITY DEFINER helper with the same search path and no service_role
grant; the clothing helper remains the existing immutable internal helper
with no service_role grant; validator strictness was not changed.

The canonical reset was called once on dedicated TEST game
`2d00d76e-85b1-4cf0-8dab-a04e8a044b84` and returned HTTP 200. Final readback:
`committed_turn=0`, `processing_status=idle`,
`player_setup.status=not_started`, `opening_state.status=not_started`,
`turn_count=0`, `action_count=0`, `save_revision=994`; canonical `scene`
exists and `validate_company_save_v1` returned `{valid:true,errors:[]}`.
`story_summary_overall`, `story_summary_recent`, `npc_emotion`,
`npc_work_state`, and general `event_ledger` are absent. Retained
relationship, sexual, stats, CSA, physical/clothing, identity, and literal
choice structures remain present. Progression and sexual-event media were
absent in the master initial save and were not lost by reset. No API/frontend
deployment, Production/manual-game access, additional gameplay, retry,
rollback, or second migration occurred. Cut 2 acceptance remains
WAITING_REVIEW pending operator review of this exact closure.
