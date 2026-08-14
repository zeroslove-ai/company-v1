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
| Canonical branch | `company/runtime-authority-consolidation-v1` |
| Canonical PR | #65 — OPEN / DRAFT / UNMERGED |
| TEST game | `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` |
| Supabase project | `fmcrspgxstsmxxsmkeee` |
| PRODUCTION game | `11111111-1111-4111-8111-111111111111` — no access authorized in current cut |

Documentation-only commits may advance the branch/PR HEAD beyond the runtime candidate SHA. They do not imply a newer runtime candidate unless this Identity section is explicitly updated after source review.

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

The current Cut 1 Closure runtime candidate is `fd7faa09aa61e0575469aeddbe322ca4253262e3` (`refactor: close action ownership lifecycle authority`). GitHub CI for that SHA completed successfully. The candidate implements the following target lifecycle model in source/migrations; **none of these new DB contracts is live yet**.

### Action ownership model

`game_actions` target fields:

- `processing_status` — current lifecycle stage
- `stage_owner_token` — current Story/Extract provider-stage owner, nullable
- `stage_claimed_at` — owner lease acquisition time, nullable; stale authority
- `error_code` — failure/diagnostic reason only; never an owner token or in-progress lock
- `updated_at` — general row mutation timestamp, not lease authority

Story and Extract use the same fenced ownership contract. Every execution attempt gets a unique owner token (`story:<request_id>` / `extract:<request_id>`). Owner acquisition/replacement is atomic. Stage success/failure verifies the exact owner token and atomically clears `stage_owner_token` and `stage_claimed_at`. After stale takeover, the old owner cannot record late success or late failure.

### Candidate Stage A contract

Closure Stage A migration:

`20260814000300_company_v1_action_ownership_closure_stage_a`

It is designed to be pre-deploy compatible and adds/defines:

- nullable `game_actions.stage_owner_token`
- nullable `game_actions.stage_claimed_at`
- owner-based `claim_game_action_stage(...)`
- owner-fenced `fail_game_action_stage(...)`
- `record_story_result_owned(uuid, uuid, text, jsonb, text)`
- `record_extract_result_owned(uuid, uuid, jsonb, text)`
- reserve stale semantics that prefer same-action replay, use `stage_claimed_at` for owned stale actions, and clear ownership when a different stale action is terminated
- temporary legacy Story/Extract/claim/fail contracts for the currently deployed Worker, guarded so they cannot mutate rows owned by the new Worker

The new Worker path uses owned Story and Extract writers. `error_code` is no longer the new-path ownership store.

### Candidate Stage B enforcement

Stage B remains a **post-new-API canary enforcement step**, not a Stage A prerequisite. Its target is:

- revoke service-role direct gameplay `INSERT/UPDATE/DELETE/TRUNCATE` on the approved core tables while retaining allowed read/RPC access
- remove/revoke legacy unowned Story/Extract writers and legacy lifecycle overloads after caller inventory
- revoke/drop obsolete `apply_reserved_csa_transaction`
- preserve approved SECURITY DEFINER RPC execution

No target architecture is complete while a duplicate durable writer remains intentionally exposed beyond its staged compatibility window.

## DB contract gate

The runtime candidate adds:

- `config/company-v1-db-contract.json`
- `scripts/company-db-contract-gate.mjs`
- `scripts/deploy-api-with-contract-gate.mjs`

Contract id/version: `company-v1-action-authority` / version `2`.

The pre-deploy gate compares the required Stage A contract against a read-only DB catalog: migration marker, ownership columns, exact function identity arguments, SECURITY DEFINER status, safe search path, and service-role EXECUTE. Stage B additionally rejects forbidden legacy functions and direct service-role DML. The deploy wrapper does not start Wrangler when the gate fails.

This gate is staged-rollout aware: Stage A intentionally allows temporary legacy compatibility writers/direct DML; Stage B is the enforcement state.

## Current live DB truth — verified after Closure candidate

Read-only Supabase verification after `fd7faa09...` confirms:

- no migration at or after `20260814000000` is applied
- `game_actions.stage_owner_token` is not live
- `game_actions.stage_claimed_at` is not live
- the new owner-based `claim_game_action_stage`, `fail_game_action_stage`, `record_story_result_owned`, and `record_extract_result_owned` signatures are not live

Therefore the Closure candidate source and live TEST DB are intentionally **not deployment-compatible yet**. The API must not be deployed until Stage A is explicitly approved/applied and the live Stage A contract gate passes.

Existing live facts still include the pre-Cut-1 compatibility surface: direct service-role gameplay DML and the obsolete CSA preapply writer. Those are not Stage A blockers; they are Stage B cleanup targets after the new API is verified.

## Test and verification policy — binding

The current large legacy test suite is **not a preservation target and raw test count is not proof of correctness**.

Rules:

1. Never add runtime compatibility or preserve superseded architecture merely to keep an obsolete test green.
2. When a canonical contract changes, affected tests are classified `KEEP`, `REWRITE`, or `DELETE`.
3. Keep tests that directly protect current product invariants and authority boundaries.
4. Rewrite tests that express a valid invariant through an obsolete implementation detail.
5. Delete duplicate mocks, superseded legacy-contract tests, source/SQL-string existence checks, fake E2E and other implementation-detail tests when they no longer prove a canonical invariant.
6. Focused invariant tests are the development gate. A full suite can be used as a regression signal, but the number `738/738` or any future count is never an acceptance criterion by itself.
7. A failing old test is triaged against current truth before runtime code is changed. Canonical behavior regression blocks; stale test assumptions do not.
8. Runtime acceptance prioritizes source↔DB contract verification and a real TEST Golden Path over accumulation of mocks.
9. Reuse the existing live canary/E2E/reset helpers. Do not create another harness unless the current harness cannot express a required invariant.
10. After Cut 1 is safely rolled out, perform a deliberate Test Suite Reset/Consolidation before later authority cuts inherit the old suite unquestioned: inventory all tests, mark `KEEP/REWRITE/DELETE`, remove duplicate/superseded coverage, and retain a smaller contract-oriented suite plus live Golden Path coverage. **No numeric target is binding.**

This policy is also mirrored in `/AGENTS.md` so future implementation agents receive it before work.

## Supersession note for `10_SOLE_WRITER_DECISION.md`

`10_SOLE_WRITER_DECISION.md` remains binding for the durable commit boundary, CSA authority, scene/location target, relations, physical/sexual evidence, setup/opening, frontend projection, parser compatibility and migration policy.

For **Cut 1 action-lifecycle mechanics only**, the Closure model in this file supersedes the older Decision 2 examples that used `error_code` as the in-progress/ownership CAS field. The canonical Cut 1 target is now `stage_owner_token` + `stage_claimed_at`, with `error_code` reserved for failure/diagnostic meaning.

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

Current state: **Closure implementation candidate complete in source; Stage A not applied; API not deployed; Stage B not applied; PR #65 remains Draft/unmerged.**

Next sequence, only with explicit owner approval for write/deploy steps:

1. Review exact runtime candidate `fd7faa09...` and Stage A migration/contract manifest.
2. Apply Stage A to TEST DB only.
3. Run the live Stage A DB contract gate; it must pass.
4. Deploy the exact reviewed API runtime SHA through the contract-gated path.
5. Operator/assistant runs the real TEST Golden Path first, including reserve → Story → Extract → Commit → context/history/reload/replay/retry and ownership/fencing probes where deterministic.
6. Read back action/save/turn state and confirm owned success/failure clears ownership correctly.
7. Inventory callers of legacy RPCs/raw service-role mutation and `apply_reserved_csa_transaction`.
8. Apply Stage B only after the new API Golden Path passes and the caller gate is clear.
9. Run Stage B contract gate and Golden Path again; direct raw gameplay writes must fail while approved RPCs succeed.
10. Only then declare Cut 1 complete and decide merge/main landing strategy.
11. Perform Test Suite Reset/Consolidation before allowing later authority cuts to inherit the legacy suite as unquestioned contract.

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
