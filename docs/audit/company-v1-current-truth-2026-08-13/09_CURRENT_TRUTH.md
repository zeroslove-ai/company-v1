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
| Deployed API source | `b0e9e38a227e452183c389e80f9153f694c5c876` |
| Deployed API Worker Version | `3068e016-da34-44ca-9c6e-aadb5a61956a` |
| Stage B live migration | `20260814051254 / company_v1_authority_enforcement_stage_b` |
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
- API Worker source `b0e9e38a227e452183c389e80f9153f694c5c876` is deployed as Version `3068e016-da34-44ca-9c6e-aadb5a61956a`; Frontend was not redeployed

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

The pre-Stage-B scoped Golden Path passed. The first post-Stage-B canary then failed during Opening before Turn 1 because the database rejected a non-four-item choice projection with `opening choices must contain exactly four items`. Cut 1 runtime acceptance is therefore not complete.

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
10. After Cut 1 is safely rolled out, perform deliberate Test Suite Reset/Consolidation before later authority cuts inherit the old suite unquestioned. No numeric target is binding.

## Supersession note for `10_SOLE_WRITER_DECISION.md`

`10_SOLE_WRITER_DECISION.md` remains binding for durable commit, CSA authority, scene/location target, relations, physical/sexual evidence, setup/opening, frontend projection, parser compatibility and migration policy.

For **Cut 1 action-lifecycle mechanics only**, this file supersedes the older Decision 2 examples that used `error_code` as the ownership CAS field. The canonical model is `stage_owner_token` + `stage_claimed_at`, with `error_code` reserved for failure/diagnostic meaning.

For **Cut 1 rollout status**, this file also supersedes the old statement in Decision 11 that no migration has been applied: Stage A and Stage B are verified live in TEST; the deployed API remains `b0e9e38a...` / Version `3068e016...`.

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

Current state: **Closure source deployed as `b0e9e38a...` / Version `3068e016...`; Stage A and Stage B applied to TEST; pre-Stage-B scoped Golden Path passed; post-Stage-B Opening choice contract failed before Turn 1; PR #65 remains Draft/unmerged; Cut 1 is not complete.**

Next sequence, with explicit owner approval for deployment/write steps:

1. Review the Opening choice fail-open candidate; it has not been redeployed.
2. Run the scoped TEST Golden Path only after the candidate is reviewed and redeployed.
3. Rerun the scoped TEST Golden Path against the live Stage A/B database, including Opening, Turn 1/2, replay, context/history, and final reset.
4. Only then declare Cut 1 complete and decide merge/main landing strategy.
5. Perform Test Suite Reset/Consolidation before later authority cuts inherit the legacy suite as unquestioned contract.

## Post-Stage-B Opening evidence — verified

- Immutable evidence: `C:\Users\JAEWAN\company-v1-cut1-post-stage-b-980f4c5\cut1-post-stage-b.json`
- Opening streamed visible content but did not produce a successful `commit_company_opening` result.
- Captured visible Story contained `0` literal `[CHOICE]` markers; the stream decoder observed `5` choice-block starts and `4` choice-block ends.
- The available reconstructed Story parsed to `0` choices, `0` non-empty choices, and `0` unique choices. The captured artifact does not contain the final `p_choices` RPC argument; the DB error proves the submitted projection did not satisfy the exact-four contract.
- The canary performed its final reset successfully; TEST ended clean at `save_revision=828`, `committed_turn=0`, with no actions or turns.
- The Opening choice fail-open correction is a source/test candidate only until exact-SHA review, redeploy, and a new live retest. The broad Phase12K clothing evidence remains separate.

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
