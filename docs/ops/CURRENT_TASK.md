# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: overnight-cut2-live-quality-loop-v1
Updated: 2026-08-18
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority for the owner-authorized overnight continuation loop.

## 0. Owner directive — supersedes prior owner gates

At 2026-08-18 00:34 KST the owner explicitly authorized continuous execution through:

`land Cut 1 → implement/review/land Cut 2 → TEST rollout → player-style live acceptance → evidence-driven repair/retest when necessary`

The owner does **not** want intermediate `WAITING_OWNER_DECISION`, merge-authorization, deploy-authorization, or “ask the user before continuing” gates inside this scope.

For every non-Production phase below, the operator/watcher is delegated authority to:
- review the exact implementation;
- classify ACCEPTED / CHANGES_REQUIRED / BLOCKED from evidence;
- create/update the next branch/PR/task as needed;
- merge an ACCEPTED PR by normal GitHub `merge` with exact-head guard;
- apply explicitly scoped TEST-only migrations/fixture writes;
- deploy the accepted TEST candidate;
- run live TEST gameplay;
- if live evidence proves a real defect, create and execute a bounded repair task without asking the owner again.

**Do not stop merely because a prior document or PR description says “owner approval required”, “merge forbidden”, “Cut 2 forbidden”, or equivalent. This directive supersedes those workflow gates for the scope above.** Architectural/product canons remain binding.

## 1. Hard boundaries that still require STOP

Never auto-authorize any of the following:
- Production game access or mutation;
- Production DB write/reset/migration;
- Production-only deployment or route change;
- provider/model swap as a correctness strategy;
- retry/regenerate-until-lucky acceptance;
- a new semantic gateway/verifier/router, consent matrix, finite physical-action grammar, relationship/event/open-fact ledger, generic CSA execution DSL, or compatibility shadow architecture;
- a change that contradicts `CURRENT_TRUTH.md` or `docs/COMPANY_V1_POST_MERGE_GAMEPLAY_SIMPLIFICATION_CANON_2026-08-17.md` rather than implementing it;
- destructive rewriting of historical migrations/evidence;
- resetting a failed live-test game before its evidence is preserved.

If one of these becomes necessary, preserve exact evidence and STOP `BLOCKED_OWNER_ARCHITECTURE_OR_PRODUCTION_DECISION`.

## 2. Auto-approval rule

At every source/merge boundary, the operator may self-approve and continue when all are true:
1. exact branch/head/ancestry is frozen and no unexplained drift exists;
2. full `npm test` passes with zero failures;
3. `git diff --check` passes;
4. exact-head `Company v1 tests` GitHub Actions concludes `SUCCESS`;
5. code review finds no unresolved P0/P1 gameplay correctness defect;
6. changes remain within the current canon and do not add a prohibited authority layer;
7. optional/presentation failures remain nonblocking to Story/Commit;
8. the change is deletion-first or is the smallest proven single-writer mechanic/sidecar needed by the product.

When these conditions pass, post an immutable Issue #68 review record and **continue automatically**. Do not wait for user confirmation.

## 3. Phase A — land accepted Cut 1

Frozen pre-registration facts to re-verify before mutation:
- repository: `zeroslove-ai/company-v1`
- current `main` at registration: `111be1fba0029c8086d76ca72afcd8b22a18fcca`
- PR #70: `company/gameplay-core-simplification-v1`
- previously accepted executable head: `0f1e36c049b16c51302376a4f46cc714c89315d1`
- synchronized implementation head before this docs-only registration: `917c03eb198f111bba69b9b6698136b592f48970`
- exact-head CI before registration: run `32041771244` SUCCESS
- PR #69 is already merged and `main` push CI coverage is present.

Required:
1. Fresh-fetch main, PR #70 and this task.
2. Prove the only change after `917c03eb...` is this owner-authorized lifecycle/task document unless a newer owner instruction exists.
3. Require CI SUCCESS on the exact new PR #70 head created by this task registration.
4. Self-review that no gameplay/source/runtime change occurred after the accepted implementation.
5. Merge PR #70 exactly once by normal GitHub `merge` with exact-head guard.
6. Require `Company v1 tests` SUCCESS on the exact resulting main merge SHA.
7. Record `CUT1_LANDED_ACCEPTED` and immediately continue to Phase B. Do not stop at an owner gate.

## 4. Phase B — Cut 2 `presentation-sidecars-cleanup-v1`

Create a fresh branch from the exact accepted Cut 1 landed main and one normal PR against main.

### 4.1 Primary goal

Finish presentation-sidecar cleanup **without reopening Story/Extract/Commit semantic authority**.

### 4.2 Required audit first

Before editing, inventory fresh callers/readers/writers for:
- legacy NPC stat UI: `affinity`, `resistance`, `csa_acceptance`, `sexual_arousal`, `relationship_summary`;
- image selection / `image_selection` / `image_character_id` / media coupling;
- TTS/media failure paths;
- historical compatibility adapters still reachable from fresh requests;
- dead donor/work/relationship/event/stat helpers/readers;
- any reader with no current writer and any writer with no concrete product consumer.

Do not preserve a subsystem merely because a stale test or UI field references it.

### 4.3 Reaction meters decision — owner intent

The owner reported “stats do not change” as a real UX defect. Preserve useful visible reaction feedback, but **do not resurrect `npc_stats`**.

If current UI still materially benefits from numeric meters, implement at most a tiny presentation-only `npc_reaction_state` with exactly the smallest useful set:
- `affinity`
- `sexual_arousal`

Rules:
- one writer from post-Story observation/committed turn evidence;
- bounded numeric display state only;
- no `csa_acceptance`;
- no `resistance` as an action/CSA gate;
- no machine-authored relationship summary;
- never project these meters back into Story as consent, permission, rule applicability, affection truth, or action authority;
- missing/ambiguous update is dropped and never blocks the turn;
- if the UX can be made clearer by deleting a dead meter rather than implementing it, delete it.

The operator may choose deletion instead of implementation for any legacy meter except that the final UI must not falsely display a frozen stat as though it were live.

### 4.4 Media/image sidecar

Move image selection completely out of fresh Extract semantic authority.

Preferred inputs:
- committed parsed Story;
- current focal/present actor;
- confirmed compact clothing state;
- finite existing asset metadata.

Rules:
- no image semantic verdict may reject/retry/rewrite Story;
- no image result becomes durable narrative authority;
- failure means no image or neutral fallback;
- do not add another LLM call solely for image selection unless an already-approved sidecar architecture requires it; prefer deterministic presentation mapping from committed data.

TTS follows the same nonblocking rule.

### 4.5 Cleanup

Delete or collapse, after caller proof:
- dead legacy stat readers/writers/helpers;
- fresh media/Extract coupling;
- stale compatibility adapters not required by persisted historical readback;
- dead work/event/relation/stat naming residue;
- obsolete tests that protect removed implementation shape.

Do not delete a historical adapter solely by name; prove fresh/persisted caller safety first.

### 4.6 Cut 2 acceptance

Add behavior-oriented tests for:
- visible reaction UI is either truly live or absent; never fake/frozen;
- `csa_acceptance`, resistance gating and relationship-summary authority cannot re-enter fresh state;
- reaction sidecar cannot affect Story prompt/CSA applicability/Commit validity;
- image/media failure cannot fail a valid turn;
- fresh Extract contains no image-selection authority;
- refresh/recovery reads committed presentation state correctly where retained;
- source surface is reduced where old readers/writers are removed.

Run full suite, diff check and exact-head CI. Self-review. If accepted, merge Cut 2 normally with exact-head guard, require landed-main CI SUCCESS, record `CUT2_LANDED_ACCEPTED`, and continue immediately to Phase C.

If review finds a real defect within Cut 2 scope, fix it on the same branch and repeat validation. Do not ask the owner.

## 5. Phase C — TEST-only rollout

After Cut 2 landed-main CI SUCCESS, prepare one TEST candidate from that exact main lineage.

Fresh-verify deployment identities from repo/config before mutation. Current expected TEST infrastructure is:
- Supabase TEST project URL host: `fmcrspgxstsmxxsmkeee.supabase.co`
- API Worker config name: `game-proxy-company-v1`
- Frontend Worker config name: `gamebuilder-company-v1`

Do not infer Production safety from names. Before deployment prove the operation is the same established TEST acceptance route used by prior Company v1 TEST evidence and does not require Production game access.

Authorized TEST operations:
- apply unapplied additive Company v1 migrations required by Cut 1/Cut 2 to TEST only, in order;
- validate resulting save/functions structurally;
- deploy API/Frontend TEST candidate from exact accepted main lineage;
- create a **new disposable TEST game** for this acceptance;
- prepare that new game at Level 7 / EXP 0 using a TEST-only fixture mutation or existing safe fixture seam.

Do **not** reset or reuse preserved historical/manual evidence games, including any game that contains the owner’s prior manual QA turns. If the existing Level-7 helper is hard-locked to a preserved game, use a one-off TEST-only fixture write for a newly created disposable game rather than broadening Production runtime architecture merely for testing.

Record exact migration names, Worker version IDs, disposable game ID and deployed commit SHA.

## 6. Phase D — player-style live TEST acceptance

Use live provider calls and the real committed Story→Extract→Commit path. Prefer the actual frontend path/headless interaction if an existing maintained harness supports it; otherwise use the existing SSE/canary gameplay harness plus committed frontend/readback verification. **Do not build a new large harness just to continue this task.**

Use one natural, coherent session of roughly 15–20 committed turns. Do not make it a list of synthetic endpoint assertions. Vary choices and free text like a real player.

Minimum scenario coverage:
1. Opening and several normal choices; prove choices never fall back to stale Opening choices.
2. Free-text literal action fidelity; actor/target/directionality must not silently change.
3. Ordinary non-work conversation; verify narration does not compulsively snap back to meetings/onboarding/work reports.
4. Cross-location movement and same-location registered-NPC handoff.
5. Activate at least one exact clothing CSA and verify Story + four-slot durable state agree immediately for the correct subject scope.
6. Exercise an active on-request/narrative CSA and separately request an unrelated action; verify the CSA is ordinary/in-force but does not grant unrelated obedience/consent/permission.
7. Exercise explicit adult intimate/sexual progression naturally enough to verify:
   - direct executable requests progress meaningfully in the same turn rather than repeated wait/continue staging;
   - visible body description can use confirmed exposed canon;
   - player sexual mechanic changes when Story explicitly establishes the evidence;
   - description is not reduced to repetitive generic gestures/work-report language.
8. Verify Cut 2 reaction meters, if retained, visibly change only as presentation and never alter rule/action authority.
9. Verify image/media sidecar works or fails harmlessly without affecting Story/Commit.
10. Continue past six raw-turn memory depth; revisit an early promise/relationship/situation and verify older chronological `turn_summary` supports coherent continuity.
11. Refresh/reload/recovery/readback parity.
12. Inspect exact DB turn/action/save evidence for any suspicious turn rather than judging UI text alone.

### Live acceptance rules

- one scenario at a time;
- no stochastic retry/regeneration to obtain a pass;
- do not silently discard an ugly or wrong provider turn;
- a deterministic or materially reproducible defect is evidence, not something to retry away;
- preserve the game immediately when a real defect is found.

## 7. Phase E — autonomous defect-driven repair loop

If Phase D finds a real product defect, classify it before changing code:
- literal input / choice authority;
- Story prompt/context quality;
- scene/location/presence;
- CSA scope/premise;
- physical/clothing/player mechanic writer;
- Extract observation/evidence;
- Commit/state persistence;
- memory/summary;
- frontend readback/UI;
- presentation sidecar.

Then inspect exact game turn/action/save + current code and choose the smallest deletion-first root fix.

The operator is pre-authorized for **up to 3 substantive repair cycles** tonight, provided each fix:
- stays inside the binding architecture;
- does not add prohibited semantic layers;
- addresses preserved live evidence;
- is reviewed with focused + full tests + exact-head CI;
- is merged normally after self-acceptance;
- is redeployed to TEST only;
- is retested on a **new disposable game** while preserving the failed game.

Do not create symptom-specific regex gates for arbitrary narrative quality. If a provider-quality issue is not deterministic enough for a structural fix, record it as a quality finding and continue collecting evidence rather than inventing a semantic verifier.

STOP early if:
- the same root failure remains after two attempted fixes;
- a fix would require a prohibited/new architecture layer;
- Production access/change is required;
- test/deploy lineage cannot be proven;
- DB migration cannot be made additive/safe;
- a security/data-integrity issue appears.

Otherwise continue until live acceptance is materially clean or 3 repair cycles are consumed.

## 8. Terminal condition

Do **not** stop at intermediate `WAITING_REVIEW` solely for user approval.

Terminal only when one of these occurs:

### `OVERNIGHT_LIVE_ACCEPTED`
- Cut 1 landed-main CI SUCCESS;
- Cut 2 landed-main CI SUCCESS;
- TEST migrations/deploy verified;
- one final disposable live game completes the required player-style acceptance without unresolved P0/P1 product defects;
- any remaining findings are explicitly classified as nonblocking quality/UX follow-up;
- Production untouched.

### `OVERNIGHT_REPAIR_LIMIT_REACHED`
- 3 evidence-driven repair cycles used and unresolved defect remains.

### `BLOCKED_OWNER_ARCHITECTURE_OR_PRODUCTION_DECISION`
- only for the hard boundaries in section 1.

At terminal, update this file to `WAITING_REVIEW`, post one complete immutable Issue #68 report with exact SHAs/PRs/CI/deploy/migrations/game IDs/turn evidence, and STOP.

## 9. Terminal report — BLOCKED_OWNER_ARCHITECTURE_OR_PRODUCTION_DECISION

- Cut 1 PR #70 merged at `cfcd328a00b3caa9d87034e6ab7ca60c6ace51ce`; main CI run `32043074446` was SUCCESS.
- Cut 2 PR #71 merged at `f91f2579947befacb10a45abde2599a92faf3276`; PR CI run `32043791667` and main CI run `32043850713` were SUCCESS.
- Cut 2 branch commit: `d4c9c4f7895d3efe764ff31b9b6a66098c35885e`, pushed as `company/presentation-sidecars-cleanup-v1`.
- TEST migration read-only preflight targeted project `fmcrspgxstsmxxsmkeee` and found remote-only migration history versions absent from this checkout. `supabase db push --dry-run` stopped with `LegacyDbPushMissingLocalError` and listed remote versions requiring migration-history repair before any push.
- No TEST migration was applied, no Worker deployment was attempted, no disposable game was created, no live turns were run, and Production was untouched.
- Blocker: repairing remote-only migration history or applying schema changes without a reconciled additive migration lineage would be an unsafe DB/history operation outside the explicit task boundary. Owner/operator review is required before TEST rollout can continue.

Production rollout is explicitly outside this overnight authority.
