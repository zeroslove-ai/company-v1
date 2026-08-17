# Company v1 — CURRENT TASK

Status: READY
Task ID: test-effective-db-contract-live-resume-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority. It supersedes the terminal stop of `overnight-cut2-live-quality-loop-v1` only for the bounded TEST-resume work below.

## 0. Owner/operator decision

The previous overnight loop stopped before TEST deployment because `supabase db push --dry-run` found migration-version history drift between the TEST project and this checkout.

Independent read-only review after that stop established a narrower fact:

- current accepted `main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`;
- Cut 1 and Cut 2 are already landed and their landed-main CI runs succeeded;
- TEST project: `fmcrspgxstsmxxsmkeee`;
- remote migration history uses historical timestamp versions that do not match several current repository migration filenames;
- however the **effective TEST DB definitions** of the Cut 1 target functions already match the intended gameplay-core-simplification contract: work-hook-free opening/setup, six-field canonical scene, minimal save, and current validation shape;
- therefore migration-history metadata drift is not evidence that TEST runtime schema is missing the Cut 1 behavior.

The correct next step is **not** to repair old migration history merely to make `db push` happy.

Resume live acceptance by proving the effective DB contract, performing no historical migration-table repair, deploying the exact accepted main to the established TEST Workers, and running a new disposable player-style Level-7 session.

Intermediate non-Production review/merge/deploy decisions remain operator-self-approved. Do not ask the owner to continue when the objective evidence below is satisfied.

## 1. Frozen baseline

Repository: `zeroslove-ai/company-v1`
Expected starting `main`: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
Expected branch: `company/test-effective-db-live-resume-v1`

Landed Cut 1:
- PR #70 merge: `cfcd328a00b3caa9d87034e6ab7ca60c6ace51ce`
- landed-main CI: `32043074446` SUCCESS

Landed Cut 2:
- source: `d4c9c4f7895d3efe764ff31b9b6a66098c35885e`
- PR #71 merge: `f91f2579947befacb10a45abde2599a92faf3276`
- landed-main CI: `32043850713` SUCCESS

Terminal/docs main:
- PR #72 merge/current main: `8f3c5326e483650211fbc6c9f54a7527d2278d4e`
- exact main CI: `32044041912` SUCCESS

TEST infrastructure expected from current repo config:
- Supabase project: `fmcrspgxstsmxxsmkeee`
- API Worker: `game-proxy-company-v1`
- Frontend Worker: `gamebuilder-company-v1`

Preserved games must not be reset/reused, including prior owner/manual evidence games such as `2d00d76e-85b1-4cf0-8dab-a04e8a044b84` and `78fb1d94-266f-455a-bda4-7656cc2370c1`.

## 2. Hard prohibitions

Do not:
- access or mutate Production;
- run `supabase migration repair` against historical TEST migration rows;
- insert/update/delete `supabase_migrations.schema_migrations` merely to reconcile filename timestamps;
- run broad `supabase db push` while legacy history remains divergent;
- rewrite/delete historical migration files;
- add a compatibility migration solely to mirror old timestamps;
- change provider/model as a correctness strategy;
- retry/regenerate until Story happens to pass;
- introduce a semantic action router/verifier, consent matrix, finite physical-action grammar, relationship/event/open-fact ledger, generic CSA execution DSL, or shadow compatibility architecture;
- reset a failed live-test game before evidence is preserved.

If the **effective DB contract** does not match the accepted runtime and reconciling it would require destructive/history surgery rather than a clearly additive current migration, STOP `BLOCKED_EFFECTIVE_DB_CONTRACT_MISMATCH` with exact definitions/differences.

## 3. Phase A — effective TEST DB contract proof

Before any deployment or write:

1. Fresh-fetch `main`, branch head, CURRENT_TASK, and Issue #68 READY registration.
2. Require starting main remains `8f3c5326...`; otherwise rebase the evidence on the new exact main only if the intervening commits are already accepted docs/CI lineage. Any gameplay/source drift => STOP.
3. Read-only query TEST `supabase_migrations.schema_migrations` and record the migration-version drift as metadata evidence only.
4. Read the repository file `supabase/migrations/20260817000200_company_v1_gameplay_core_simplification.sql`.
5. Read-only inspect TEST `pg_get_functiondef` + ACL for:
   - `company_apply_opening_scene_v1(jsonb)`
   - `company_minimalize_save_v1(jsonb)`
   - `company_validate_scene_v1(jsonb,boolean)`
   - `validate_company_save_v1(jsonb)`
   - `reserve_company_player_setup(uuid,uuid,jsonb,jsonb)`
6. Compare behavior/signatures, not historical parameter-name cosmetics.
7. Required effective facts:
   - Opening/setup does not require or write work_hook / scene_goal.
   - Opening creates scene with exactly structural fields: version, location_id, present_npc_ids, focal_character_id, last_speaker_id, updated_turn.
   - minimalizer strips retired stats/relation/CSA-runtime/sexual-ledger/image-choice/work residue required by current contract.
   - save validator requires the current structural scene and player sexual state.
   - setup RPC calls the current opening function and only service_role has intended mutation access.

### Decision

If these effective facts already match, record `EFFECTIVE_DB_CONTRACT_ALREADY_CURRENT` and **perform no DB DDL/migration-history write at all**. Proceed to Phase B.

Do not mark `20260817000200` as applied by editing migration history. The historical ledger mismatch can be audited separately; it is not allowed to block live product validation when the effective schema is already current.

If one narrowly required current function is actually missing/outdated, first prove that applying only the additive/current `20260817000200` definitions is safe and dependency-complete. Apply it TEST-only only if exact preconditions are proven. Never fix the old ledger merely to enable CLI push.

## 4. Phase B — exact-main TEST deployment

After `EFFECTIVE_DB_CONTRACT_ALREADY_CURRENT` (or a separately proven narrow additive apply):

1. Confirm local/remote checkout uses exact accepted `main` executable tree. Ops-only task metadata may be excluded from executable identity.
2. Run `npm test` and require zero failures.
3. Run `git diff --check`.
4. Run the existing API and frontend Worker dry-run/contract gates.
5. Deploy API Worker `game-proxy-company-v1` from the exact accepted main executable.
6. Deploy frontend Worker `gamebuilder-company-v1` from the same accepted lineage.
7. Record exact Worker version IDs and deployed commit/tree identity.
8. Smoke/readback must prove API/FE are reachable and target the intended TEST project.

This task authorizes TEST deployment only. Production remains forbidden.

## 5. Phase C — new disposable Level-7 game

Create a brand-new TEST game for this acceptance. Do not reset an existing evidence game.

Prepare:
- Level 7
- EXP 0
- committed_turn 0
- clean Opening/setup state
- no prior history

Use the existing TEST-only acceleration seam if it safely accepts the new game. If it is hard-coded to an old evidence game, use a one-off TEST-only fixture write for the new game rather than broadening production runtime code.

Record the new game ID before gameplay.

## 6. Phase D — player-style live acceptance

Run one natural coherent live-provider session of roughly 15–20 committed turns using the real Story → Extract → Commit → committed readback path. Prefer actual frontend interaction if the maintained harness supports it; otherwise use the existing SSE/canary harness plus frontend/readback verification. Do not build another large harness.

The session must mix provider choices and free text like a real player and cover:

1. Opening and repeated choices: no stale Opening choice may reappear after committed turns.
2. Literal free-text fidelity: actor, target, direction and explicit self-state must not silently change.
3. Several personal/non-work turns: Story must not compulsively return to meetings/onboarding/work reports.
4. Cross-location movement plus same-location registered-NPC handoff.
5. Activate one exact structured clothing CSA: Story and four-slot durable state must agree immediately for the correct subject scope.
6. Exercise one narrative/on-request CSA, then separately request an unrelated act: rule is ordinary/in-force but does not create unrelated obedience/consent/permission.
7. Natural adult intimate progression sufficient to check same-turn meaningful progress, visible body canon, player sexual state updates and non-generic character-specific description.
8. Cut 2 presentation behavior:
   - retired/frozen NPC stats must not be falsely displayed;
   - Mind Monitor remains usable;
   - image/media may be absent/fallback but must never block Story/Commit.
9. Continue past six raw turns; revisit an early promise/situation and verify chronological turn_summary memory remains coherent.
10. Refresh/reload/recovery parity.
11. For every suspicious turn, inspect exact `game_actions`, `game_turns`, save and Extract evidence before classification.

No stochastic retry. A bad provider turn is evidence and must remain in the preserved game.

## 7. Phase E — evidence-driven repair loop

The prior owner authorization for up to 3 substantive repair cycles remains active.

On the first material defect:
1. preserve the game and exact turn evidence;
2. classify root domain: input/choice, Story context/prompt, scene/presence, CSA, clothing/physical/player mechanic, Extract, Commit/persistence, memory/summary, frontend, presentation sidecar;
3. audit the existing path before coding;
4. prefer deleting conflicting authority or reconnecting the canonical writer;
5. do not add regex semantic gates or retry loops;
6. create one bounded repair branch/PR from current main;
7. focused + full tests + diff check + exact-head CI;
8. self-review and normal merge if no unresolved P0/P1;
9. TEST redeploy;
10. retest on a **new disposable game**, preserving the failed one.

Maximum 3 substantive cycles. STOP early if the same root cause survives two attempted fixes or resolution requires prohibited architecture/Production/destructive DB work.

## 8. Post-live review targets (do not preempt live evidence)

Record these as explicit quality findings during the session rather than automatically adding systems before testing:

- Cut 2 removed fake/frozen legacy numeric NPC stats rather than rebuilding them. Decide after play whether Mind Monitor is sufficient UX. If numeric feedback is still clearly valuable, a later presentation-only sidecar may contain at most small non-authoritative fields such as affinity/sexual_arousal; never csa_acceptance/resistance gates.
- Cut 2 removed Extract image authority, but current frontend media projection may still be only a neutral/general fallback. Verify actual user experience before adding deterministic asset selection from committed Story + focal actor + clothing + existing asset metadata.
- Audit remaining named residue only after live core behavior is known: `mandatory-enactment.js`, `semantic-contract.js`, `sexual-state/ledger.js`, `posture.js`, `workplace-context.js`, legacy extract adapters, and donor-named frontend files. Delete only after caller/persisted-read proof; do not create another cleanup architecture.
- Delete commented-out obsolete tests instead of preserving dead test bodies as comments when encountered in the next source change.

## 9. Success / terminal

### `LIVE_RESUME_ACCEPTED`
- effective TEST DB contract proven current without unsafe history repair;
- exact accepted main deployed to TEST;
- final disposable live game completes required session without unresolved P0/P1;
- Production untouched;
- remaining UX/cleanup findings documented and prioritized.

### `LIVE_RESUME_REPAIR_LIMIT_REACHED`
- 3 evidence-driven repair cycles used with unresolved material defect.

### `BLOCKED_EFFECTIVE_DB_CONTRACT_MISMATCH`
- current effective DB actually differs and cannot be brought current by a clearly safe additive/narrow TEST-only change.

### `BLOCKED_OWNER_ARCHITECTURE_OR_PRODUCTION_DECISION`
- resolution requires Production or prohibited architecture.

Do not stop for ordinary intermediate approval. At terminal, set CURRENT_TASK to WAITING_REVIEW, post one immutable Issue #68 report with exact SHAs/CI/Worker versions/game IDs/turn evidence/findings, and STOP.
