# Company v1 — CURRENT TASK

Status: WAITING_REVIEW
Task ID: csa-natural-rule-authority-reset-v1-land-recovery
Updated: 2026-08-15
Ops channel: GitHub Issue #68 — `Company v1 agent ops loop`

This file is the sole active execution authority.

## Why this recovery task exists

The prior task `csa-natural-rule-authority-reset-v1` completed a local implementation and verification at local commit:

`b60011c5a25684a53fcd53908128873fc31e3c9b`

but correctly STOPPED because the remote branch moved during execution. The remote-only movement was operator-created and has now been independently verified:

`ce19f3ed919eb1acb82701eb7a3f3d1afdf83c31..b69bcc25cecef777b87c071a120e73d1389d47c2`

is exactly one docs-only commit modifying only `CURRENT_TRUTH.md` (+40/-0). There is no competing executable remote delta.

The local implementation must NOT be discarded or reconstructed from memory if the commit object still exists. This task exists only to safely land that implementation source/test delta on top of the current canonical remote docs head, reverify it, and stop for operator review.

## Binding topology / identities

Repository: `zeroslove-ai/company-v1`
Branch: `company/scene-location-presence-v1`
Canonical PR: #67, base `main`, must remain OPEN / DRAFT / UNMERGED.
Accepted pre-CSA executable: `efd4f167a837a9e31982b974704d9f8c9af9e4a4`.
Original CSA task registration/start head: `ce19f3ed919eb1acb82701eb7a3f3d1afdf83c31`.
Preserved local implementation candidate: `b60011c5a25684a53fcd53908128873fc31e3c9b`.
Canonical remote docs-only head before this recovery registration: `b69bcc25cecef777b87c071a120e73d1389d47c2`.
A docs-only recovery registration descendant is the expected remote HEAD when this task begins.

Preserved manual game `78fb1d94-266f-455a-bda4-7656cc2370c1` remains READ ONLY forever.

## Mandatory Phase 0 — prove the local candidate before touching it

1. Fetch remote.
2. Verify the local object `b60011c5a25684a53fcd53908128873fc31e3c9b` exists and is a commit.
3. Verify its ancestry/parent relationship against the prior task start. If it is not the expected local implementation descendant of `ce19f3ed...`, STOP/BLOCK.
4. Inventory every path changed by `ce19f3ed... -> b60011c...`.
5. Separately verify the canonical remote delta from `ce19f3ed...` to the current remote recovery-registration HEAD consists only of operator docs/workflow changes (`CURRENT_TRUTH.md` and `docs/ops/CURRENT_TASK.md`). Any executable remote delta means STOP/BLOCK.
6. Preserve all approved untracked evidence artifacts untouched.

## Landing method — preserve implementation, do not merge histories

Do NOT merge, force-push, create another branch, or blindly rebase the whole local commit including its stale CURRENT_TASK patch.

Land the local candidate as follows, or an exactly equivalent safe procedure:

1. Save the immutable source identity `b60011c...` and its changed-path/diff evidence.
2. Bring the local checked-out canonical branch to the current `origin/company/scene-location-presence-v1` docs-only recovery-registration HEAD only after the local candidate object is proven safely addressable.
3. Reapply ONLY the implementation/runtime/test/content delta from `b60011c...`, explicitly EXCLUDING `docs/ops/CURRENT_TASK.md` and excluding any operator-updated `CURRENT_TRUTH.md`.
   - Prefer a path-scoped diff/apply or equivalent deterministic transfer from the local commit.
   - Do not manually re-author the implementation from prose.
4. Commit the reapplied implementation as a new executable commit on top of the current canonical docs head.
5. Prove that the new executable commit's runtime/test/content diff is equivalent to the corresponding runtime/test/content diff in `b60011c...`. Differences are allowed only where the new canonical docs/current-task context requires docs-only changes; any unexplained executable difference => STOP/BLOCK.
6. Run the required validation again.
7. Only after validation passes, set this CURRENT_TASK to `WAITING_REVIEW` in a docs/workflow-only descendant if needed and push fast-forward normally.

Local `reset --hard` is not a default instruction. If local branch positioning cannot be achieved without destructive history movement, STOP/BLOCK and report the exact Git graph instead. Do not risk the preserved local implementation object or untracked evidence.

## Expected implementation semantics to preserve

The landed implementation must remain the CSA natural-rule authority reset already reported from `b60011c...`:

- remove fresh CSA finite physical execution grammar as Story/Commit authority;
- remove mandatory-enactment/direct-coverage/relation-switch authority from the fresh path;
- remove old CSA runtime/aftereffect writers where superseded;
- keep active institutional `world_rules` / human-readable rule context;
- keep CSA app lifecycle, level/slot/strength/product capability, applicable registered identity and transaction/idempotence mechanics where actually used;
- Story authors the natural HOW; no exact physical action/posture token is required;
- Extract open facts observe what actually happened;
- ACTING may remain a visible narrative block, but legacy `enactment_id` / `actor_id` / `posture_after` attributes must not become fresh durable semantic authority;
- institutional compliance must not mechanically write affinity/romance/trust/emotion/consent/sexual willingness;
- compact clothing UI continuity remains a narrow projection;
- image/media including sexual image pools/tags remain presentation adapters and must not gate narrative facts;
- setup catalogs, stable registered character/location IDs, canonical scene integrity, open facts, literal provider choices, action/turn transactionality and replay remain intact;
- retained historical execution readers, if any, are LEGACY_READ_ONLY only.

The six-stage main-loop canon now in `CURRENT_TRUTH.md` is binding and must remain byte-preserved through this recovery:
`player input/choice -> Story -> Extract -> Commit -> game_save/game_turns -> Context/History/UI/next Story`.
Sidecars must not become competing semantic authorities or turn blockers.

## Validation

At minimum:
- rerun the focused CSA/open-observation/Story contract tests relevant to the local implementation;
- full `npm.cmd test`;
- syntax checks for modified JS/MJS;
- `git diff --check`;
- inspect the final executable diff against both the current canonical docs head and the preserved local candidate;
- verify PR #67 remains base `main`, OPEN / DRAFT / UNMERGED;
- DB writes/resets, migration apply, live TEST gameplay/LLM, deploy, Production access, and manual-game mutation must all be 0.

The prior local report had 420/420 full tests; do not treat that count as correctness proof and do not force the new suite to have the same count if source/test files are byte-equivalent and current branch context changes counts legitimately. Explain any difference.

## Forbidden

- Production access/mutation.
- TEST live gameplay/LLM calls.
- DB writes/resets, DDL/migration apply, deploy.
- Mutation/reset of preserved manual game.
- New branch/PR, merge commit, PR Ready, squash, force-push.
- Editing historical applied migrations.
- Reconstructing the implementation from memory when `b60011c...` is available.
- Losing or cleaning approved untracked evidence artifacts.
- Provider/model/temperature/token changes, retries/regeneration, fuzzy semantic repair, regex semantic classifiers, parser relaxation/new parser, new physical enum/taxonomy.

## Terminal report

The recovery implementation is landed and waiting for operator review.

- Preserved local candidate: `b60011c5a25684a53fcd53908128873fc31e3c9b`, parent `ce19f3ed919eb1acb82701eb7a3f3d1afdf83c31`.
- Recovery start head: `30865263b8f63ae359d73a3eaea6476975a104b9`.
- Landed executable: `95ed0692f0da2ceff786ffcd8e0543e5a11b4e6f`.
- The runtime/test implementation tree is byte-equivalent to the preserved candidate. `docs/ops/CURRENT_TASK.md` and operator-maintained `CURRENT_TRUTH.md` were excluded from the executable transfer.
- Focused CSA/open-observation/Story tests passed 73/73; full `npm.cmd test` passed 420/420; modified JS/MJS syntax and `git diff --check` passed.
- No live TEST gameplay/LLM, DB write/reset, migration apply, deploy, Production access, or preserved manual-game mutation was performed.

No next task was generated. Stop for PR #67 operator review.

On success report:
- original local candidate `b60011c...` proof and parent/changed paths;
- recovery START_SHA;
- new landed executable FINAL_SHA;
- exact source/test/content equivalence result versus local candidate;
- any paths deliberately excluded (`CURRENT_TASK.md`, operator `CURRENT_TRUTH.md`);
- focused/full/syntax/diff-check results;
- PR #67 state;
- all forbidden live/DB/deploy/Production/manual-game operations = 0.

Then set CURRENT_TASK to `WAITING_REVIEW`, post one immutable terminal report to Issue #68, and STOP. Do not start live acceptance or another Cut automatically.
