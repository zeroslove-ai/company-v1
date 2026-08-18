# Company v1 — CURRENT TASK

Status: READY
Task ID: merge-clothing-csa-repair-test-live-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## 0. Operator review decision

Previous task: `clothing-csa-npc-state-bootstrap-repair-v1`
Previous terminal: Issue #68 comment `5322691683`
Accepted classification: `CLOTHING_CSA_NPC_STATE_BOOTSTRAP_REPAIR_READY`
Previous final branch SHA: `a7fdb343da791c305a51ffa690c5329e63523000`
Previous final CURRENT_TASK blob: `dbe101a0b1ba67b2ae483da25ad1fda284594853`
Reviewed source/test commit: `051bcc8118ccdbb6bf2ee7131086f1eb57268817`
Reviewed PR: `#78`
Reviewed PR exact head: `a7fdb343da791c305a51ffa690c5329e63523000`
Reviewed exact-head CI: `32091694344` SUCCESS
Current accepted main before merge: `43aa03cf645a2e1a2cae3e0283d2e485170db021`

Independent operator review confirmed:
- PR #78 is OPEN, non-draft, mergeable, and unmerged.
- main is still exactly `43aa03cf645a2e1a2cae3e0283d2e485170db021`.
- registration -> source commit is exactly one source/test commit touching only:
  - `src/engine/runtime-core/csa-commit-reducer.js`
  - `test/gameplay-core-simplification.test.mjs`
- final PR adds only lifecycle `docs/ops/CURRENT_TASK.md` beyond those two paths.
- the repair is narrow: when a present scope-matching NPC has no prior `npc_scene_state`, Commit bootstraps the canonical four clothing slots with `unknown` defaults, preserves any existing physical/clothing fields, overlays only exact structured-CSA required slots, and updates `updated_turn` only when the NPC state actually changes.
- focused regression is 18/18 PASS; full test is 351/351 PASS; exact-head CI is green.

The accepted live defect came from disposable TEST game `16184902-7415-468b-a276-dae291c6c74c`: active `csa_17` required `underwear_bottom=removed` for `female_employee`; heroine3 later became canonically present/focal but `npc_scene_state` remained `{}` because the sole clothing CSA Commit writer skipped absent NPC state.

This task has two phases only: merge the already-reviewed PR #78, then deploy that exact merged main to TEST and perform one narrow UTF-8-safe live proof of the repaired seam. It must not expand into Cut3 or a general gameplay repair.

## 1. Frozen base and task branch

Repository: `zeroslove-ai/company-v1`
Required pre-merge main: `43aa03cf645a2e1a2cae3e0283d2e485170db021`
Expected task branch: `company/merge-clothing-csa-repair-test-live-v1`
Reviewed PR: `#78`
Required PR head before merge: `a7fdb343da791c305a51ffa690c5329e63523000`
Required source/test commit: `051bcc8118ccdbb6bf2ee7131086f1eb57268817`
Required exact-head CI: `32091694344` SUCCESS

The task branch intentionally starts from exact pre-merge main and carries only this registration/lifecycle authority. Do not transplant PR #78 source changes onto the task branch. The reviewed source enters main only through normal merge of PR #78.

## 2. Required preflight

Before any merge/deploy/gameplay action:

1. Fresh-fetch `main`; require exact `43aa03cf645a2e1a2cae3e0283d2e485170db021`.
2. Verify this task branch is exactly one docs-only registration commit ahead of that main.
3. Re-read Issue #68 terminal `5322691683`, operator review/READY comment for this task, PR #78, and this exact CURRENT_TASK blob.
4. Re-verify PR #78 is OPEN and unmerged with exact head `a7fdb343da791c305a51ffa690c5329e63523000`.
5. Re-verify PR #78 changed paths are exactly:
   - `src/engine/runtime-core/csa-commit-reducer.js`
   - `test/gameplay-core-simplification.test.mjs`
   - `docs/ops/CURRENT_TASK.md`
6. Re-read the source patch. Require the same reviewed semantics; do not trust remembered summaries.
7. Require exact-head `Company v1 tests` CI success for the exact PR head. If head/paths/CI changed, STOP `BLOCKED_CLOTHING_CSA_REPAIR_REVIEW_DRIFT`.
8. Run or re-run focused regression and full tests if needed to prove the reviewed head remains clean. No source modification is authorized here.

## 3. Phase A — merge reviewed PR #78

If and only if preflight is exact and green:

1. Merge PR #78 to `main` using the repository's normal merge-commit path. Do not squash/rebase unless the normal merge endpoint cannot be used; if merge semantics would differ, STOP instead of improvising.
2. Fresh-fetch `main` and record the exact merge/main SHA.
3. Verify the merged main contains the reviewed `csa-commit-reducer.js` and regression semantics exactly.
4. Wait for/inspect post-merge main CI. Require `Company v1 tests` SUCCESS for the exact merged main before any TEST deployment.
5. If merge or post-merge CI fails, STOP `BLOCKED_CLOTHING_CSA_REPAIR_MERGE_OR_CI`.

No additional source/test/config/docs changes may be introduced into main in this task.

## 4. Phase B — exact merged-main TEST deployment

After post-merge main CI is green:

1. Deploy **only** the exact merged-main API Worker `game-proxy-company-v1` using the existing contract-gated TEST deployment path.
2. Do not deploy frontend: PR #78 contains no frontend changes. Existing TEST frontend may remain at the prior accepted deployment unless a health check proves it is broken; frontend redeploy is not authorized as a workaround.
3. Run the existing Action/Scene/effective-DB read-only gates required by the deployment path.
4. Run corrected API smoke against an explicit disposable game UUID or other accepted non-protected smoke context. Never use the protected sentinel as a destructive fixture.
5. Record exact TEST API Worker version and health result.

No migration, DDL, migration-history repair, `supabase db push`, or schema change is authorized.

## 5. Phase C — narrow UTF-8-safe live proof

Create **one new disposable TEST game** only. Do not reset/reuse any preserved/manual/prior evidence game.

### Input fidelity

- Any Korean free-text action used by the script must be constructed through an ASCII-safe Node representation (`String.fromCodePoint`, `\uXXXX`, or equivalent).
- Before the first gameplay network request, locally verify decoded text, code points/UTF-8 bytes, JSON round-trip, and absence of replacement/corruption characters.
- For every Korean free-text gameplay action used for semantic evidence, verify the persisted `game_actions.player_action` and committed `game_turns.player_action` are byte-exact before drawing a product conclusion.
- No PowerShell/cmd/env inline non-ASCII transport.

### Scenario

Use the shortest deterministic scenario that proves the repaired seam without depending on fuzzy NPC search or the previously unproven registered-NPC handoff behavior.

1. Setup a fresh Level-7 disposable game through the canonical setup/opening path.
2. Establish one registered female employee as canonically present. Prefer an Opening/current-scene heroine already present; do not invent/fuzzy-match a character.
3. Activate the exact catalog clothing CSA equivalent to `no_panties_under_work_clothes` through the canonical app transaction path:
   - active clothing mechanic
   - `subject_scope=female_employee`
   - `required_state={underwear_bottom:removed}`
4. On the Commit where the rule first applies to a present matching female NPC whose prior `npc_scene_state` is absent, read back and require:
   - `npc_scene_state[actor_id]` now exists;
   - canonical clothing object has exactly the four slots `uniform_top`, `uniform_bottom`, `underwear_top`, `underwear_bottom`;
   - previously unknown unspecified slots are `unknown`, not guessed `worn`;
   - `underwear_bottom === 'removed'`;
   - any pre-existing evidenced physical/clothing fields, if present, are preserved;
   - `updated_turn` equals the actual Commit turn that changed/created the state.
5. Perform one unrelated ordinary free-text turn with the same NPC still present and verify:
   - the durable clothing state remains unchanged/idempotent;
   - the active CSA remains active;
   - the player or unrelated NPC state is not blanket-mutated;
   - the next Story context/projection can read the bootstrapped NPC clothing state and rule requirement.
6. Story is **not required to explicitly narrate hidden underwear**. Absence of prose mention is not a failure. Only an explicit contradiction of the durable/active premise is a semantic failure.
7. Verify committed readback after a fresh GET/refresh-equivalent read path, not only the immediate response object.
8. Preserve exact game/action/turn IDs and relevant pre/post-save/structured-action evidence in the terminal report. Do not reset the evidence game at the end.

No retries/regeneration/alternate scenario are allowed to turn a failed semantic result into a pass. Transport-only retry is allowed only if zero gameplay reservation/Commit occurred and the retry is demonstrably before product processing; otherwise STOP and report the evidence.

## 6. Acceptance

Success requires all of the following:

- PR #78 merged from exact reviewed head and merged-main CI green.
- exact merged main deployed to TEST API only, with contract gates/smoke green.
- one fresh UTF-8-safe disposable game proves absent NPC state is bootstrapped by the active structured clothing CSA.
- exact four-slot durable state exists with `unknown` defaults only for unspecified slots and exact required slot overlay.
- next unrelated Commit is idempotent and preserves the clothing state.
- Story/context projection sees the bootstrapped state on the following turn.
- no preserved/manual game mutation, migration/DDL/history repair, Production, provider/model change, source repair, or frontend workaround deployment.

If the narrow proof fails after valid UTF-8 input and exact merged-main deployment, preserve evidence and STOP. Do not repair source inside this task.

## 7. Hard prohibitions

- Production or hospital-v2 access/mutation
- mutation/reset/reuse of preserved evidence games, including `16184902-7415-468b-a276-dae291c6c74c`
- migration/DDL/schema/history writes
- `supabase db push` or migration repair
- provider/model/TTS changes
- frontend source changes or frontend workaround deploy
- Story/Extract prompt changes
- generic CSA DSL, consent/compliance semantic architecture, physical-state redesign
- relationship/event/Cut3 implementation
- retries/regeneration to obtain a lucky Story
- any source repair after live evidence begins

## 8. Terminal

Success terminal:
`CLOTHING_CSA_NPC_BOOTSTRAP_LIVE_PROVEN`

Merge/CI blocked terminal:
`BLOCKED_CLOTHING_CSA_REPAIR_MERGE_OR_CI`

Review-drift terminal:
`BLOCKED_CLOTHING_CSA_REPAIR_REVIEW_DRIFT`

Valid-live product failure terminal:
`CLOTHING_CSA_NPC_BOOTSTRAP_LIVE_DEFECT_PERSISTS`

At terminal:
- set this CURRENT_TASK to `WAITING_REVIEW` on the task branch;
- post exactly one Issue #68 terminal containing registration SHA/blob, PR #78 exact pre-merge head, merge/main SHA, post-merge CI, deployed TEST API Worker version, smoke/gate results, disposable game/setup/action/turn IDs, exact UTF-8 evidence, pre/post clothing state, next-turn idempotence/context projection result, and all prohibited-operation counts;
- STOP.

Do not start the full 15–20-turn acceptance rerun or Cut3 in this task. If this narrow live proof passes, the next operator task is a fresh full UTF-8-safe acceptance rerun on the repaired merged main before any Cut3 work.